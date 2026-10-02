import { Module } from '@nestjs/common';
import { ScopedPedidosRepository } from './scoped-pedidos.repository.js';

/** Só exporta o repositório COM escopo. A escrita sem escopo é provida apenas pelo ImportModule. */
@Module({ providers: [ScopedPedidosRepository], exports: [ScopedPedidosRepository] })
export class PedidosModule {}
