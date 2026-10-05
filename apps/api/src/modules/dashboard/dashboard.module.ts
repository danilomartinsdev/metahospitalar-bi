import { Module } from '@nestjs/common';
import { PedidosModule } from '../pedidos/pedidos.module.js';
import { DashboardController } from './dashboard.controller.js';
import { DashboardService } from './dashboard.service.js';

@Module({ imports: [PedidosModule], controllers: [DashboardController], providers: [DashboardService], exports: [DashboardService] })
export class DashboardModule {}
