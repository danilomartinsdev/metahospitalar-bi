import { Controller, Get, Header, Param, Query, Req, Res } from '@nestjs/common';
import {
  EXPORT_XLSX_TIPOS,
  type ExportXlsxQuery,
  type ExportXlsxTipo,
  exportXlsxQuerySchema,
  type Filtros,
  filtrosSchema,
  printTokenSchema,
} from '@meta-bi/shared';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { CurrentUser, Public, RequirePermission } from '../../common/auth/decorators.js';
import type { ContextoRequisicao, UsuarioAutenticado } from '../../common/auth/types.js';
import { ZodPipe } from '../../common/zod-validation.pipe.js';
import { type Arquivo, ExportService } from './export.service.js';

const tipoXlsx = z.enum(EXPORT_XLSX_TIPOS);
const contexto = (req: FastifyRequest): ContextoRequisicao => ({
  ip: req.ip,
  userAgent: req.headers['user-agent'],
});

function enviar(reply: FastifyReply, a: Arquivo) {
  void reply
    .header('content-type', a.tipo)
    .header('content-disposition', `attachment; filename="${a.nome}"`)
    .header('cache-control', 'no-store')
    .send(a.conteudo);
}

@Controller()
export class ExportController {
  constructor(private readonly service: ExportService) {}

  @RequirePermission('export.xlsx')
  @Get('export/xlsx/:tipo')
  async xlsx(
    @CurrentUser() u: UsuarioAutenticado,
    @Param('tipo', new ZodPipe(tipoXlsx)) tipo: ExportXlsxTipo,
    @Query(new ZodPipe(exportXlsxQuerySchema)) q: ExportXlsxQuery,
    @Req() req: FastifyRequest,
    @Res() reply: FastifyReply,
  ) {
    enviar(reply, await this.service.xlsx(u, tipo, q, contexto(req)));
  }

  @RequirePermission('export.pdf')
  @Get('export/pdf')
  async pdf(
    @CurrentUser() u: UsuarioAutenticado,
    @Query(new ZodPipe(filtrosSchema)) f: Filtros,
    @Req() req: FastifyRequest,
    @Res() reply: FastifyReply,
  ) {
    enviar(reply, await this.service.pdf(u, f, contexto(req)));
  }

  /** Lido pela página /print/relatorio aberta pelo Chromium da API. O token é a credencial (uso único). */
  @Public()
  @Get('print/relatorio')
  @Header('cache-control', 'no-store')
  relatorio(@Query(new ZodPipe(printTokenSchema)) q: { token: string }) {
    return this.service.relatorio(q.token);
  }
}
