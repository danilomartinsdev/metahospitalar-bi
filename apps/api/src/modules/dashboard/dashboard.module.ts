import { Module } from '@nestjs/common';
import { PedidosModule } from '../pedidos/pedidos.module.js';
import { DashboardController } from './dashboard.controller.js';
import { DashboardService } from './dashboard.service.js';
import { HistoricoController } from '../historico/historico.controller.js';

@Module({
  imports: [PedidosModule],
  controllers: [DashboardController, HistoricoController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
