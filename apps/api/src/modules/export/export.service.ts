import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import type { ExportXlsxQuery, ExportXlsxTipo, Filtros, RelatorioImpressao } from '@meta-bi/shared';
import type { ContextoRequisicao, UsuarioAutenticado } from '../../common/auth/types.js';
import { ApiException, Erros } from '../../common/errors.js';
import { ENV, type Env } from '../../config/env.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { DashboardService } from '../dashboard/dashboard.service.js';
import { PdfRenderer } from './pdf-renderer.service.js';
import { type InfoExportacao, planilhaClientes, planilhaPedidos, planilhaRanking } from './planilhas.js';
import { PrintTokenService } from './print-token.service.js';

// Map (e não objeto literal) porque a regra de escopo do ESLint trata qualquer chave "pedidos" como relação.
const TITULOS = new Map<ExportXlsxTipo, string>([
  ['pedidos', 'Pedidos'],
  ['gestores', 'Ranking de representantes'],
  ['estados', 'Ranking de estados'],
  ['regioes', 'Ranking de regiões'],
  ['clientes', 'Clientes'],
]);
const COLUNA: Record<'gestores' | 'estados' | 'regioes', string> = {
  gestores: 'Representante',
  estados: 'UF',
  regioes: 'Região',
};

export interface Arquivo {
  conteudo: Buffer;
  nome: string;
  tipo: string;
}

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  constructor(
    private readonly dashboard: DashboardService,
    private readonly tokens: PrintTokenService,
    private readonly renderer: PdfRenderer,
    private readonly audit: AuditService,
    private readonly prisma: PrismaService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  /** Nomes dos representantes filtrados — só os que o usuário pode ver. */
  private async rotulosGestor(u: UsuarioAutenticado, f: Filtros) {
    const ids =
      u.escopo.tipo === 'representantes'
        ? f.gestor.filter((g) => u.escopo.representanteIds.includes(g))
        : f.gestor;
    if (!ids.length) return new Map<string, string>();
    const reps = await this.prisma.representante.findMany({
      where: { id: { in: ids } },
      select: { id: true, nomeExibicao: true },
    });
    return new Map(reps.map((r) => [r.id, r.nomeExibicao]));
  }

  async xlsx(
    u: UsuarioAutenticado,
    tipo: ExportXlsxTipo,
    q: ExportXlsxQuery,
    ctx: ContextoRequisicao,
  ): Promise<Arquivo> {
    const rotulos = await this.rotulosGestor(u, q);
    const info = (
      periodo: { de: string; ate: string },
      linhas: number,
      truncado = false,
    ): InfoExportacao => ({
      titulo: TITULOS.get(tipo)!,
      periodo,
      filtros: q,
      geradoPor: u.nome,
      geradoEm: new Date(),
      linhas,
      truncado,
    });

    let conteudo: Buffer;
    let periodo: { de: string; ate: string };
    let linhas: number;
    if (tipo === 'pedidos') {
      const r = await this.dashboard.pedidosParaExportar(u, q, this.env.EXPORT_MAX_LINHAS);
      periodo = r.periodo;
      linhas = r.data.length;
      conteudo = planilhaPedidos(r.data, info(periodo, linhas, r.total > linhas), rotulos);
    } else if (tipo === 'clientes') {
      const r = await this.dashboard.clientes(u, q);
      periodo = r.periodo;
      linhas = r.ranking.length;
      conteudo = planilhaClientes(r, info(periodo, linhas), rotulos);
    } else {
      const r = await this.dashboard.ranking(u, q, tipo);
      periodo = r.periodo;
      linhas = r.linhas.length;
      conteudo = planilhaRanking(r, COLUNA[tipo], info(periodo, linhas), rotulos);
    }

    await this.audit.registrar({
      acao: 'export.xlsx',
      usuarioId: u.id,
      detalhes: { tipo, linhas, filtros: filtrosParaAuditoria({ ...q, ...periodo }) },
      ctx,
    });
    return {
      conteudo,
      nome: `meta-bi-${tipo}-${periodo.de}_${periodo.ate}.xlsx`,
      tipo: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }

  async pdf(u: UsuarioAutenticado, f: Filtros, ctx: ContextoRequisicao): Promise<Arquivo> {
    const periodo = await this.dashboard.periodo(u, f);
    const token = this.tokens.criar(u, f);
    const base = (this.env.PRINT_BASE_URL ?? this.env.WEB_ORIGIN).replace(/\/$/, '');
    const quando = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    let conteudo: Buffer;
    try {
      conteudo = await this.renderer.renderizar(
        `${base}/print/relatorio?token=${token}`,
        `Meta Hospitalar · BI Executivo — gerado por ${u.nome} em ${quando} · uso interno`,
      );
    } catch (e) {
      this.logger.error(`Falha ao gerar PDF: ${(e as Error).message}`);
      throw new ApiException(
        HttpStatus.SERVICE_UNAVAILABLE,
        'INTERNAL',
        'Não foi possível gerar o PDF agora. Tente de novo em instantes.',
      );
    } finally {
      // Se a página não chegou a consumir o token, ele morre aqui.
      this.tokens.descartar(token);
    }
    await this.audit.registrar({
      acao: 'export.pdf',
      usuarioId: u.id,
      detalhes: { filtros: filtrosParaAuditoria({ ...f, ...periodo }) },
      ctx,
    });
    return {
      conteudo,
      nome: `meta-bi-relatorio-${periodo.de}_${periodo.ate}.pdf`,
      tipo: 'application/pdf',
    };
  }

  /** Dados da página de impressão: consome o token (uso único) e aplica o escopo de quem pediu o PDF. */
  async relatorio(token: string): Promise<RelatorioImpressao> {
    const e = this.tokens.consumir(token);
    if (!e) throw Erros.naoAutenticado();
    const { usuario: u, filtros: f } = e;
    const [visaoGeral, gestores, estados, regioes] = await Promise.all([
      this.dashboard.visaoGeral(u, f),
      this.dashboard.ranking(u, f, 'gestores'),
      this.dashboard.ranking(u, f, 'estados'),
      this.dashboard.ranking(u, f, 'regioes'),
    ]);
    return {
      geradoPor: u.nome,
      geradoEm: new Date().toISOString(),
      filtros: f,
      visaoGeral,
      rankings: { gestores, estados, regioes },
    };
  }
}

/** Só os filtros preenchidos (sem ordenação), para o log de auditoria. */
function filtrosParaAuditoria(f: Filtros): Record<string, string | string[]> {
  const r: Record<string, string | string[]> = {};
  for (const k of ['de', 'ate', 'regiao', 'uf', 'gestor', 'segmento', 'status', 'q'] as const) {
    const v = f[k];
    if (Array.isArray(v) ? v.length : v) r[k] = v as string | string[];
  }
  return r;
}
