import { Injectable } from '@nestjs/common';
import argon2 from 'argon2';

// Parâmetros argon2id (OWASP 2024+): 19 MiB, 2 iterações, paralelismo 1.
const OPCOES = { type: argon2.argon2id, memoryCost: 19_456, timeCost: 2, parallelism: 1 } as const;

@Injectable()
export class SenhaService {
  /** Hash usado quando o e-mail não existe, para o tempo de resposta não revelar contas. */
  private dummy: Promise<string> = argon2.hash('senha-inexistente-para-tempo-constante', OPCOES);

  hash(senha: string): Promise<string> {
    return argon2.hash(senha, OPCOES);
  }

  async verificar(hash: string | null, senha: string): Promise<boolean> {
    try {
      return await argon2.verify(hash ?? (await this.dummy), senha);
    } catch {
      return false;
    }
  }
}
