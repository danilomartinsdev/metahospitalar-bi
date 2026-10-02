import { Global, Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { SenhaService } from './senha.service.js';
import { SessaoService } from './sessao.service.js';
import { TokenService } from './token.service.js';
import { UsuarioLoader } from './usuario-loader.service.js';

@Global()
@Module({
  controllers: [AuthController],
  providers: [AuthService, SenhaService, SessaoService, TokenService, UsuarioLoader],
  exports: [SenhaService, SessaoService, TokenService, UsuarioLoader],
})
export class AuthModule {}
