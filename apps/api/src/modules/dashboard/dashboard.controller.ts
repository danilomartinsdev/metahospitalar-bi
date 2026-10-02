import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  DIMENSOES_RANKING,
  type DimensaoRanking,
  type Filtros,
  filtrosSchema,
  type PedidosQuery,
  pedidosQuerySchema,
} from '@meta-bi/shared';
import { z } from 'zod';
import { CurrentUser, RequirePermission } from '../../common/auth/decorators.js';
import type { UsuarioAutenticado } from '../../common/auth/types.js';
import { ZodPipe } from '../../common/zod-validation.pipe.js';
import { DashboardService } from './dashboard.service.js';

const dimensao = z.enum(DIMENSOES_RANKING);

@Controller()
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @RequirePermission('dashboard.view')
  @Get('dashboard/visao-geral')
  visaoGeral(@CurrentUser() u: UsuarioAutenticado, @Query(new ZodPipe(filtrosSchema)) f: Filtros) {
    return this.service.visaoGeral(u, f);
  }

  @RequirePermission('dashboard.view')
  @Get('dashboard/ranking/:dim')
  ranking(
    @CurrentUser() u: UsuarioAutenticado,
    @Param('dim', new ZodPipe(dimensao)) dim: DimensaoRanking,
    @Query(new ZodPipe(filtrosSchema)) f: Filtros,
  ) {
    return this.service.ranking(u, f, dim);
  }

  @RequirePermission('dashboard.view')
  @Get('dashboard/clientes')
  clientes(@CurrentUser() u: UsuarioAutenticado, @Query(new ZodPipe(filtrosSchema)) f: Filtros) {
    return this.service.clientes(u, f);
  }

  @RequirePermission('dashboard.view')
  @Get('dashboard/meses')
  meses(@CurrentUser() u: UsuarioAutenticado) {
    return this.service.mesesDisponiveis(u);
  }

  @RequirePermission('pedidos.view')
  @Get('pedidos')
  pedidos(@CurrentUser() u: UsuarioAutenticado, @Query(new ZodPipe(pedidosQuerySchema)) q: PedidosQuery) {
    return this.service.listarPedidos(u, q);
  }
}
