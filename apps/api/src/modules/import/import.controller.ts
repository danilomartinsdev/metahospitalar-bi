import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Req } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { z } from 'zod';
import { CurrentUser, RequirePermission } from '../../common/auth/decorators.js';
import { exigirEscopoTodos } from '../../common/auth/privilegios.js';
import type { UsuarioAutenticado } from '../../common/auth/types.js';
import { ApiException } from '../../common/errors.js';
import { ZodPipe } from '../../common/zod-validation.pipe.js';
import { ImportService } from './import.service.js';

/** O nome do arquivo vem da prévia guardada no servidor (o do cliente é ignorado). */
const confirmarSchema = z.object({
  hash: z.string().regex(/^[a-f0-9]{64}$/),
  arquivoNome: z.string().max(200).optional(),
});

const ctx = (req: FastifyRequest) => ({ ip: req.ip, userAgent: req.headers['user-agent'] });

/** Importação grava pedidos da base inteira: além da permissão, exige escopo "todos". */
@Controller('import')
export class ImportController {
  constructor(private readonly service: ImportService) {}

  @RequirePermission('import.run')
  @Post('previa')
  @HttpCode(200)
  async previa(@Req() req: FastifyRequest, @CurrentUser() usuario: UsuarioAutenticado) {
    exigirEscopoTodos(usuario);
    const arquivo = await req.file().catch(() => undefined);
    if (!arquivo) throw new ApiException(HttpStatus.BAD_REQUEST, 'VALIDATION', 'Envie um arquivo.');
    const buf = await arquivo.toBuffer().catch(() => {
      throw new ApiException(
        HttpStatus.PAYLOAD_TOO_LARGE,
        'VALIDATION',
        'Arquivo maior que o limite permitido.',
      );
    });
    return this.service.previa(buf, arquivo.filename.slice(0, 200), usuario.id);
  }

  @RequirePermission('import.run')
  @Post('confirmar')
  @HttpCode(200)
  confirmar(
    @Body(new ZodPipe(confirmarSchema)) dados: z.infer<typeof confirmarSchema>,
    @CurrentUser() usuario: UsuarioAutenticado,
    @Req() req: FastifyRequest,
  ) {
    exigirEscopoTodos(usuario);
    return this.service.confirmar(dados.hash, usuario, ctx(req));
  }

  @RequirePermission('import.run')
  @Get('lotes')
  lotes(@CurrentUser() usuario: UsuarioAutenticado) {
    exigirEscopoTodos(usuario);
    return this.service.listarLotes();
  }

  @RequirePermission('import.rollback')
  @Post('lotes/:id/reverter')
  @HttpCode(204)
  async reverter(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() usuario: UsuarioAutenticado,
    @Req() req: FastifyRequest,
  ) {
    exigirEscopoTodos(usuario);
    await this.service.reverter(id, usuario, ctx(req));
  }
}
