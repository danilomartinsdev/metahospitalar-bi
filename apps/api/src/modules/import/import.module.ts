import { Module } from '@nestjs/common';
import { PedidosEscritaRepository } from '../pedidos/scoped-pedidos.repository.js';
import { ImportController } from './import.controller.js';
import { ImportService } from './import.service.js';

@Module({ controllers: [ImportController], providers: [ImportService, PedidosEscritaRepository] })
export class ImportModule {}
