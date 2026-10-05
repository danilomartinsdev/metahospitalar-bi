import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  COLUNAS_FATURAMENTO,
  type ErroLinha,
  type FaturamentoQuery,
  type FaturamentoResumo,
  type LinhaFaturamento,
  type LoteFaturamento,
  linhaFaturamentoSchema,
  type PreviaFaturamento,
  type TotaisFaturamento,
} from '@meta-bi/shared';
import type { ContextoRequisicao, UsuarioAutenticado } from '../../common/auth/types.js';
import { ApiException } from '../../common/errors.js';
import { ENV, type Env } from '../../config/env.js';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { deslocarMes, mesesEntre, variacao } from '../dashboard/metricas.js';
import { ArquivoInvalidoError, extrairLinhas, lerMatriz } from '../import/parser.js';

const D = Prisma.Decimal;
type Decimal = Prisma.Decimal;
const CAMPOS = ['bruto', 'antecipado', 'remessa', 'devolucao', 'dre'] as const;
type Campo = (typeof CAMPOS)[number];
type Somas = Record<Campo, Decimal>;

const zeros = (): Somas => ({
  bruto: new D(0),
  antecipado: new D(0),
  remessa: new D(0),
  devolucao: new D(0),
  dre: new D(0),
});
const somar = (a: Somas, l: Record<Campo, Decimal | string>) => {
  for (const c of CAMPOS) a[c] = a[c].plus(l[c]);
  return a;
};
const texto = (s: Somas): TotaisFaturamento =>
  Object.fromEntries(CAMPOS.map((c) => [c, s[c].toFixed(2)])) as unknown as TotaisFaturamento;
const isoDia = (d: Date) => d.toISOString().slice(0, 10);
const mesDe = (d: Date) => d.toISOString().slice(0, 7);
const dataMes = (m: string) => new Date(`${m}-01T00:00:00Z`);
/** Último dia do mês "AAAA-MM" (UTC). */
const fimMes = (m: string) => new Date(Date.UTC(Number(m.slice(0, 4)), Number(m.slice(5, 7)), 0));

interface Analise {
  previa: PreviaFaturamento;
  validas: LinhaFaturamento[];
}

/**
 * Faturamento diário da empresa (relatório do Focco). Domínio separado dos pedidos: não usa o escopo de
 * representantes — o controller exige escopo "todos" (é um número da empresa inteira).
 */
@Injectable()
export class FaturamentoService {
  constructor(
    @Inject(ENV) private readonly env: Env,
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private pasta() {
    return path.resolve(this.env.UPLOAD_DIR, 'faturamento');
  }

  /** Lê, valida e resume o arquivo. Guarda o original (fora do webroot) para o confirmar. */
  async previa(buf: Buffer, arquivoNome: string, usuarioId: string): Promise<PreviaFaturamento> {
    const hash = createHash('sha256').update(buf).digest('hex');
    const { previa } = await this.analisar(buf, hash, arquivoNome);
    await fs.mkdir(this.pasta(), { recursive: true });
    await fs.writeFile(path.join(this.pasta(), `${hash}.bin`), buf, { mode: 0o600 });
    // A prévia pertence a quem enviou: o confirmar só aceita o mesmo usuário.
    await fs.writeFile(
      path.join(this.pasta(), `${hash}.${usuarioId}.json`),
      JSON.stringify({ arquivoNome }),
      {
        mode: 0o600,
      },
    );
    return previa;
  }

  private async analisar(buf: Buffer, hash: string, arquivoNome: string): Promise<Analise> {
    let brutas;
    try {
      brutas = extrairLinhas(lerMatriz(buf).matriz, COLUNAS_FATURAMENTO);
    } catch (e) {
      const msg = e instanceof ArquivoInvalidoError ? e.message : 'Não foi possível ler o arquivo.';
      throw new ApiException(HttpStatus.BAD_REQUEST, 'VALIDATION', msg);
    }

    const erros: ErroLinha[] = [];
    const validas: LinhaFaturamento[] = [];
    const datas = new Set<string>();
    for (const b of brutas) {
      // Linhas de total/rodapé (sem empresa e sem data) são ignoradas, não são erro.
      if (!b.empresa && !b.data) continue;
      const r = linhaFaturamentoSchema.safeParse(b);
      if (!r.success) {
        erros.push({ linha: b.numeroLinha, mensagens: r.error.issues.map((i) => i.message) });
        continue;
      }
      if (datas.has(r.data.data)) {
        erros.push({ linha: b.numeroLinha, mensagens: [`Dia ${r.data.data} repetido no arquivo`] });
        continue;
      }
      datas.add(r.data.data);
      validas.push(r.data);
    }

    const anos = [...new Set(validas.map((l) => l.ano))];
    if (anos.length > 1) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        'VALIDATION',
        `O arquivo tem dias de mais de um ano (${anos.sort().join(', ')}). Envie um arquivo por ano.`,
      );
    }
    const ano = anos[0] ?? null;

    const porMes = new Map<number, { dias: number; dre: Decimal }>();
    const totais = zeros();
    for (const l of validas) {
      somar(totais, l);
      const m = porMes.get(l.mes) ?? { dias: 0, dre: new D(0) };
      m.dias++;
      m.dre = m.dre.plus(l.dre);
      porMes.set(l.mes, m);
    }
    const diasSubstituidos = ano === null ? 0 : await this.prisma.faturamentoDia.count({ where: { ano } });

    return {
      validas,
      previa: {
        hash,
        arquivoNome,
        ano,
        dias: validas.length,
        meses: [...porMes]
          .sort(([a], [b]) => a - b)
          .map(([mes, v]) => ({ mes, dias: v.dias, dre: v.dre.toFixed(2) })),
        totais: texto(totais),
        diasSubstituidos,
        erros,
      },
    };
  }

  /** Grava o arquivo da prévia: substitui todos os dias do ano dele (decisão do usuário). */
  async confirmar(hash: string, usuario: UsuarioAutenticado, ctx: ContextoRequisicao) {
    const meta = await fs
      .readFile(path.join(this.pasta(), `${hash}.${usuario.id}.json`), 'utf8')
      .then((t) => JSON.parse(t) as { arquivoNome: string })
      .catch(() => {
        throw new ApiException(
          HttpStatus.NOT_FOUND,
          'NOT_FOUND',
          'Prévia não encontrada. Envie o arquivo de novo.',
        );
      });
    const buf = await fs.readFile(path.join(this.pasta(), `${hash}.bin`)).catch(() => {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'Prévia expirada. Envie o arquivo de novo.');
    });
    const { previa, validas } = await this.analisar(buf, hash, meta.arquivoNome);
    if (!validas.length || previa.ano === null) {
      throw new ApiException(HttpStatus.BAD_REQUEST, 'VALIDATION', 'Nenhuma linha válida.');
    }
    if (previa.erros.length) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        'VALIDATION',
        `O arquivo tem ${previa.erros.length} linha(s) com erro. Corrija e envie de novo.`,
      );
    }
    const ano = previa.ano;

    const lote = await this.prisma.$transaction(async (tx) => {
      const novo = await tx.faturamentoLote.create({
        data: {
          ano,
          arquivoNome: meta.arquivoNome,
          arquivoHash: hash,
          dias: validas.length,
          totalDre: new D(previa.totais.dre),
          usuarioId: usuario.id,
        },
      });
      const apagados = await tx.faturamentoDia.deleteMany({ where: { ano } });
      await tx.faturamentoDia.createMany({
        data: validas.map((l) => ({
          empresa: l.empresa,
          data: new Date(`${l.data}T00:00:00Z`),
          ano: l.ano,
          mes: l.mes,
          semana: l.semana,
          bruto: new D(l.bruto),
          antecipado: new D(l.antecipado),
          remessa: new D(l.remessa),
          devolucao: new D(l.devolucao),
          dre: new D(l.dre),
          loteId: novo.id,
        })),
      });
      return { ...novo, substituidos: apagados.count };
    });

    await this.audit.registrar({
      acao: 'faturamento.importado',
      usuarioId: usuario.id,
      entidade: 'FaturamentoLote',
      entidadeId: lote.id,
      detalhes: { ano, dias: validas.length, substituidos: lote.substituidos, totalDre: previa.totais.dre },
      ctx,
    });
    await fs.rm(path.join(this.pasta(), `${hash}.${usuario.id}.json`), { force: true });
    return { loteId: lote.id, ano, dias: validas.length, substituidos: lote.substituidos };
  }

  async lotes(): Promise<LoteFaturamento[]> {
    const ls = await this.prisma.faturamentoLote.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { usuario: { select: { nome: true } } },
    });
    return ls.map((l) => ({
      id: l.id,
      ano: l.ano,
      arquivoNome: l.arquivoNome,
      dias: l.dias,
      totalDre: l.totalDre.toFixed(2),
      usuario: l.usuario?.nome ?? null,
      createdAt: l.createdAt.toISOString(),
    }));
  }

  /** Página de Faturamento: cards, evolução mensal, tabela mês a mês e séries diária/semanal. */
  async resumo(q: FaturamentoQuery): Promise<FaturamentoResumo> {
    const ultimo = await this.prisma.faturamentoDia.findFirst({
      orderBy: { data: 'desc' },
      select: { data: true },
    });
    const ate = q.ate ?? (ultimo ? mesDe(ultimo.data) : new Date().toISOString().slice(0, 7));
    const de0 = q.de ?? `${ate.slice(0, 4)}-01`;
    const de = de0 > ate ? ate : de0;
    const ano = Number(ate.slice(0, 4));

    // Uma consulta cobre o período, o mesmo período do ano anterior e os dois anos da evolução mensal.
    const inicio = [deslocarMes(de, -12), `${ano - 1}-01`].sort()[0]!;
    const dias = await this.prisma.faturamentoDia.findMany({
      where: { data: { gte: dataMes(inicio), lte: fimMes(ate) } },
      orderBy: { data: 'asc' },
    });
    const noPeriodo = (a: string, b: string) => dias.filter((d) => mesDe(d.data) >= a && mesDe(d.data) <= b);
    const somaDe = (ls: typeof dias) => ls.reduce((s, l) => somar(s, l), zeros());

    const atual = somaDe(noPeriodo(de, ate));
    const anterior = somaDe(noPeriodo(deslocarMes(de, -12), deslocarMes(ate, -12)));
    const kpis = Object.fromEntries(
      CAMPOS.map((c) => [
        c,
        {
          valor: atual[c].toFixed(2),
          anterior: anterior[c].toFixed(2),
          pct: variacao(atual[c], anterior[c]),
        },
      ]),
    ) as FaturamentoResumo['kpis'];

    const mesesAno = mesesEntre(`${ano}-01`, ate);
    const meses = mesesAno.map((m) => {
      const s = somaDe(noPeriodo(m, m));
      const ant = somaDe(noPeriodo(deslocarMes(m, -12), deslocarMes(m, -12)));
      return { mes: Number(m.slice(5, 7)), ...texto(s), dreAnoAnterior: ant.dre.toFixed(2) };
    });

    const doPeriodo = noPeriodo(de, ate);
    const semanas = new Map<string, { ano: number; semana: number; inicio: string; dre: Decimal }>();
    for (const d of doPeriodo) {
      const k = `${d.ano}-${String(d.semana).padStart(2, '0')}`;
      const s = semanas.get(k) ?? { ano: d.ano, semana: d.semana, inicio: isoDia(d.data), dre: new D(0) };
      s.dre = s.dre.plus(d.dre);
      semanas.set(k, s);
    }

    return {
      periodo: { de, ate },
      temDados: !!ultimo,
      kpis,
      mensal: { ano, meses, total: texto(somaDe(noPeriodo(`${ano}-01`, ate))) },
      diario: doPeriodo.map((d) => ({ data: isoDia(d.data), ano: d.ano, semana: d.semana, dre: d.dre.toFixed(2) })),
      semanal: [...semanas.values()].map((s) => ({ ...s, dre: s.dre.toFixed(2) })),
    };
  }
}
