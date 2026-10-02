import { Module } from '@nestjs/common';
import { PapeisController } from './papeis.controller.js';
import { UsuariosController } from './usuarios.controller.js';
import { UsuariosService } from './usuarios.service.js';

@Module({ controllers: [UsuariosController, PapeisController], providers: [UsuariosService] })
export class UsuariosModule {}
