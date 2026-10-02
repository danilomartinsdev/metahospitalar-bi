import { HttpStatus, type PipeTransform } from '@nestjs/common';
import type { z } from 'zod';
import { ApiException } from './errors.js';

/**
 * Valida body/query/params com um schema Zod de packages/shared.
 * (nestjs-zod ainda não suporta Nest 12 — ver ADR 0006.)
 * Uso: @Body(new ZodPipe(loginSchema)) dados: LoginInput
 */
export class ZodPipe<S extends z.ZodType> implements PipeTransform<unknown, z.output<S>> {
  constructor(private readonly schema: S) {}

  transform(value: unknown): z.output<S> {
    const r = this.schema.safeParse(value);
    if (r.success) return r.data;
    throw new ApiException(
      HttpStatus.BAD_REQUEST,
      'VALIDATION',
      'Dados inválidos.',
      r.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    );
  }
}
