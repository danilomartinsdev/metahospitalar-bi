import { Module } from '@nestjs/common';
import { FaturamentoController } from './faturamento.controller.js';
import { FaturamentoService } from './faturamento.service.js';

@Module({ controllers: [FaturamentoController], providers: [FaturamentoService] })
export class FaturamentoModule {}
