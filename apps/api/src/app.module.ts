import { randomUUID } from 'node:crypto';
import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { AuthGuard } from './common/auth/auth.guard.js';
import { HttpExceptionFilter } from './common/http-exception.filter.js';
import { ConfigModule } from './config/config.module.js';
import { AuditModule } from './modules/audit/audit.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { HealthController } from './modules/health/health.controller.js';
import { MailModule } from './modules/mail/mail.module.js';
import { UsuariosModule } from './modules/usuarios/usuarios.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

const dev = process.env.NODE_ENV !== 'production';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'test' ? 'silent' : dev ? 'debug' : 'info',
        genReqId: (req, res) => {
          const id = (req.headers['x-request-id'] as string | undefined)?.slice(0, 64) ?? randomUUID();
          res.setHeader('x-request-id', id);
          return id;
        },
        // Nunca logar credenciais, tokens ou cookies.
        redact: {
          paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
          censor: '[oculto]',
        },
        transport:
          dev && process.env.NODE_ENV !== 'test'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
      },
    }),
    ConfigModule,
    PrismaModule,
    AuditModule,
    MailModule,
    AuthModule,
    UsuariosModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule {}
