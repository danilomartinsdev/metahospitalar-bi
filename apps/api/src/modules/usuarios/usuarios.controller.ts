import { Controller, HttpCode, Param, ParseUUIDPipe, Post, Req } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { CurrentUser, RequirePermission } from '../../common/auth/decorators.js';
import type { UsuarioAutenticado } from '../../common/auth/types.js';
import { UsuariosService } from './usuarios.service.js';

/** Ações administrativas de sessão. As telas completas de usuários chegam na Fase 4. */
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuarios: UsuariosService) {}

  @RequirePermission('users.manage')
  @Post(':id/desativar')
  @HttpCode(204)
  async desativar(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() admin: UsuarioAutenticado,
    @Req() req: FastifyRequest,
  ) {
    await this.usuarios.desativar(id, admin, { ip: req.ip, userAgent: req.headers['user-agent'] });
  }

  @RequirePermission('users.manage')
  @Post(':id/reativar')
  @HttpCode(204)
  async reativar(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() admin: UsuarioAutenticado,
    @Req() req: FastifyRequest,
  ) {
    await this.usuarios.reativar(id, admin, { ip: req.ip, userAgent: req.headers['user-agent'] });
  }

  @RequirePermission('users.manage')
  @Post(':id/derrubar-sessoes')
  @HttpCode(204)
  async derrubarSessoes(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() admin: UsuarioAutenticado,
    @Req() req: FastifyRequest,
  ) {
    await this.usuarios.derrubarSessoes(id, admin, { ip: req.ip, userAgent: req.headers['user-agent'] });
  }
}
