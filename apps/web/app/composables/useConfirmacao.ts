import ConfirmacaoModal from '~/components/ui-extra/ConfirmacaoModal.vue';

export interface ConfirmacaoOpcoes {
  titulo: string;
  descricao?: string;
  rotuloConfirmar?: string;
  /** Ação destrutiva: botão de confirmação em vermelho. */
  perigo?: boolean;
  /** Pede um texto antes de confirmar (substitui o prompt() nativo); o texto vai para `acao`. */
  campo?: { rotulo: string; placeholder?: string; inicial?: string };
  /** Executada ao confirmar: o modal mostra carregamento e só fecha se ela der certo. */
  acao?: (texto: string) => Promise<unknown>;
}

/** Substitui confirm()/prompt(): resolve `true` só se o usuário confirmou e a ação deu certo. */
export function useConfirmacao() {
  const modal = useOverlay().create(ConfirmacaoModal, { destroyOnClose: true });
  return (opcoes: ConfirmacaoOpcoes) => modal.open(opcoes).result.then((r) => r === true);
}
