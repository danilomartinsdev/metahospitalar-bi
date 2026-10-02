import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/auth/decorators.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  async check() {
    // eslint-disable-next-line no-restricted-syntax -- checagem de conectividade, não lê dados
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok' };
  }
}
