import { Module } from '@nestjs/common';
import { PedidosModule } from '../pedidos/pedidos.module.js';
import { ImportController } from './import.controller.js';
import { ImportService } from './import.service.js';

@Module({ imports: [PedidosModule], controllers: [ImportController], providers: [ImportService] })
export class ImportModule {}
