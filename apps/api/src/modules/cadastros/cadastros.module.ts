import { Module } from '@nestjs/common';
import { MetasController } from '../metas/metas.controller.js';
import { CadastrosController } from './cadastros.controller.js';
import { CadastrosService } from './cadastros.service.js';

@Module({ controllers: [CadastrosController, MetasController], providers: [CadastrosService] })
export class CadastrosModule {}
