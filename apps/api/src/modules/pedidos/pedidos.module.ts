import { Module } from '@nestjs/common';
import { PedidosEscritaRepository, ScopedPedidosRepository } from './scoped-pedidos.repository.js';

@Module({
  providers: [ScopedPedidosRepository, PedidosEscritaRepository],
  exports: [ScopedPedidosRepository, PedidosEscritaRepository],
})
export class PedidosModule {}
