import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { SignJWT, jwtVerify } from 'jose';
import { ENV, type Env } from '../../config/env.js';

export interface AccessPayload {
  sub: string; // id do usuário
  sid: string; // família da sessão
}

const ISSUER = 'meta-bi';
const AUDIENCE = 'meta-bi-web';

@Injectable()
export class TokenService {
  private readonly secret: Uint8Array;

  constructor(@Inject(ENV) private readonly env: Env) {
    this.secret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
  }

  async emitirAccess(p: AccessPayload): Promise<{ token: string; expiraEm: number }> {
    const expiraEm = Math.floor(Date.now() / 1000) + this.env.JWT_ACCESS_TTL_SECONDS;
    const token = await new SignJWT({ sid: p.sid })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(p.sub)
      .setJti(randomUUID())
      .setIssuer(ISSUER)
      .setAudience(AUDIENCE)
      .setIssuedAt()
      .setExpirationTime(expiraEm)
      .sign(this.secret);
    return { token, expiraEm };
  }

  async verificarAccess(token: string): Promise<AccessPayload> {
    const { payload } = await jwtVerify(token, this.secret, {
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithms: ['HS256'],
    });
    if (typeof payload.sub !== 'string' || typeof payload.sid !== 'string')
      throw new Error('payload inválido');
    return { sub: payload.sub, sid: payload.sid };
  }

  /** Token opaco aleatório (refresh, redefinição de senha). Só o hash vai para o banco. */
  gerarOpaco(): { token: string; hash: string } {
    const token = randomBytes(32).toString('base64url');
    return { token, hash: TokenService.hash(token) };
  }

  static hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
