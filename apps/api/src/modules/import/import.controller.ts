import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Req } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { z } from 'zod';
import { CurrentUser, RequirePermission } from '../../common/auth/decorators.js';
import type { UsuarioAutenticado } from '../../common/auth/types.js';
import { ApiException } from '../../common/errors.js';
import { ZodPipe } from '../../common/zod-validation.pipe.js';
import { ImportService } from './import.service.js';

const confirmarSchema = z.object({
  hash: z.string().regex(/^[a-f0-9]{64}$/),
  arquivoNome: z.string().trim().min(1).max(200),
});

const ctx = (req: FastifyRequest) => ({ ip: req.ip, userAgent: req.headers['user-agent'] });

@Controller('import')
export class ImportController {
  constructor(private readonly service: ImportService) {}

  @RequirePermission('import.run')
  @Post('previa')
  @HttpCode(200)
  async previa(@Req() req: FastifyRequest) {
    const arquivo = await req.file().catch(() => undefined);
    if (!arquivo) throw new ApiException(HttpStatus.BAD_REQUEST, 'VALIDATION', 'Envie um arquivo.');
    const buf = await arquivo.toBuffer().catch(() => {
      throw new ApiException(
        HttpStatus.PAYLOAD_TOO_LARGE,
        'VALIDATION',
        'Arquivo maior que o limite permitido.',
      );
    });
    return this.service.previa(buf, arquivo.filename.slice(0, 200));
  }

  @RequirePermission('import.run')
  @Post('confirmar')
  @HttpCode(200)
  confirmar(
    @Body(new ZodPipe(confirmarSchema)) dados: z.infer<typeof confirmarSchema>,
    @CurrentUser() usuario: UsuarioAutenticado,
    @Req() req: FastifyRequest,
  ) {
    return this.service.confirmar(dados.hash, dados.arquivoNome, usuario, ctx(req));
  }

  @RequirePermission('import.run')
  @Get('lotes')
  lotes() {
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
    await this.service.reverter(id, usuario, ctx(req));
  }
}
