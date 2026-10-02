import type { TypedSchema, TypedSchemaError } from 'vee-validate';
import type { z } from 'zod';

/**
 * Adapta um schema Zod 4 para o VeeValidate.
 * (@vee-validate/zod ainda exige Zod 3 — ver ADR 0006.)
 */
export function toTypedSchema<S extends z.ZodType>(schema: S): TypedSchema<z.input<S>, z.output<S>> {
  return {
    __type: 'VVTypedSchema',
    async parse(values) {
      const r = await schema.safeParseAsync(values);
      if (r.success) return { value: r.data, errors: [] };
      const byPath = new Map<string, string[]>();
      for (const issue of r.error.issues) {
        const path = issue.path.join('.');
        byPath.set(path, [...(byPath.get(path) ?? []), issue.message]);
      }
      const errors: TypedSchemaError[] = [...byPath].map(([path, errs]) => ({ path, errors: errs }));
      return { errors };
    },
    // Sem coerção: os valores iniciais do formulário já têm o formato de entrada do schema.
    cast(values) {
      return values as z.input<S>;
    },
  };
}
