import { Global, Module } from '@nestjs/common';
import { ArquivosTemporariosService } from './arquivos-temporarios.service.js';

@Global()
@Module({ providers: [ArquivosTemporariosService], exports: [ArquivosTemporariosService] })
export class ArquivosModule {}
