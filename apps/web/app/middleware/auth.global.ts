import { useAuthStore } from '~/stores/auth';
import { paginaInicial, visivelNoEscopo } from '~/utils/navegacao';

const PUBLICAS = new Set(['/login', '/esqueci-senha', '/redefinir-senha']);

export default defineNuxtRouteMiddleware(async (to) => {
  // Impressão (PDF): aberta pelo Chromium da API, sem sessão — a credencial é o token de uso único.
  if (to.path.startsWith('/print/')) return;

  const auth = useAuthStore();
  await auth.inicializar();

  const publica = PUBLICAS.has(to.path);

  if (!auth.autenticado) {
    return publica
      ? undefined
      : navigateTo({ path: '/login', query: to.fullPath !== '/' ? { r: to.fullPath } : {} });
  }

  const inicio = paginaInicial(auth.usuario?.escopoTipo);
  if (publica) return navigateTo(inicio);

  // Troca de senha obrigatória (primeiro acesso ou senha redefinida pelo admin).
  if (auth.usuario?.trocarSenha && to.path !== '/trocar-senha') return navigateTo('/trocar-senha');

  const exigida = to.meta.permissao;
  if (exigida && !auth.permissoes.has(exigida)) return navigateTo('/403');

  // Tela feita para outro escopo (ex.: Minhas vendas para a gestão) → página inicial do usuário.
  if (!visivelNoEscopo(to.meta, auth.usuario?.escopoTipo)) return navigateTo(inicio);
});

declare module '#app' {
  interface PageMeta {
    permissao?: import('@meta-bi/shared').Permission;
    somenteEscopo?: readonly import('@meta-bi/shared').EscopoTipo[];
    ocultarEscopo?: readonly import('@meta-bi/shared').EscopoTipo[];
    titulo?: string;
  }
}
