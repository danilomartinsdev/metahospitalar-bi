# ADR 0003 — JWT de acesso curto + refresh token rotativo em cookie

**Status:** aceito (2026-10-02)

## Contexto
SPA precisa de autenticação segura sem guardar tokens em localStorage (XSS), com sessão que
expira por inatividade e possibilidade de o admin derrubar sessões.

## Decisão
- Access token JWT de 15 min, mantido só em memória no front.
- Refresh token opaco aleatório em cookie `httpOnly; Secure; SameSite=Strict; Path=/api/auth`,
  armazenado como hash na tabela `Sessao`, **rotacionado a cada uso**, com detecção de reuso
  (revoga a família inteira).
- Inatividade = refresh não usado dentro de `SESSION_IDLE_TIMEOUT_MIN`.
- Senhas com argon2id.

## Consequências
- Revogação imediata possível (derrubar sessões) com no máximo 15 min de access token residual.
- Recarregar a página faz um refresh silencioso.
- SameSite=Strict + mesma origem via Caddy dispensam token CSRF para o refresh.
