import type { Permission } from '@meta-bi/shared';
import type { Component } from 'vue';
import {
  BarChart3,
  ClipboardList,
  FileUp,
  LayoutDashboard,
  Map,
  MapPinned,
  ScrollText,
  Shield,
  Target,
  Trophy,
  Users,
  UserSquare2,
  Building2,
  Tags,
  History,
} from 'lucide-vue-next';

export interface NavItem {
  label: string;
  to: string;
  icon: Component;
  permissao: Permission;
  /** Fase em que a tela fica pronta; antes disso aparece como "em breve". */
  fase?: number;
}

export interface NavGroup {
  titulo: string;
  itens: NavItem[];
}

export const NAV: NavGroup[] = [
  {
    titulo: 'Análise',
    itens: [
      { label: 'Visão geral', to: '/dashboard', icon: LayoutDashboard, permissao: 'dashboard.view' },
      { label: 'Representantes', to: '/dashboard/gestores', icon: Trophy, permissao: 'dashboard.view' },
      { label: 'Estados', to: '/dashboard/estados', icon: MapPinned, permissao: 'dashboard.view' },
      { label: 'Regiões', to: '/dashboard/regioes', icon: Map, permissao: 'dashboard.view' },
      { label: 'Clientes', to: '/dashboard/clientes', icon: Building2, permissao: 'dashboard.view' },
      { label: 'Pedidos', to: '/pedidos', icon: ClipboardList, permissao: 'pedidos.view' },
    ],
  },
  {
    titulo: 'Administração',
    itens: [
      { label: 'Importações', to: '/admin/importacoes', icon: FileUp, permissao: 'import.run' },
      { label: 'Metas', to: '/admin/metas', icon: Target, permissao: 'metas.edit' },
      { label: 'Histórico', to: '/admin/historico', icon: History, permissao: 'metas.edit' },
      {
        label: 'Cadastro de representantes',
        to: '/admin/representantes',
        icon: UserSquare2,
        permissao: 'cadastros.edit',
      },
      { label: 'Segmento por cliente', to: '/admin/clientes', icon: Building2, permissao: 'cadastros.edit' },
      { label: 'Status PDV', to: '/admin/status-pdv', icon: Tags, permissao: 'cadastros.edit' },
      { label: 'Usuários', to: '/admin/usuarios', icon: Users, permissao: 'users.manage' },
      { label: 'Papéis', to: '/admin/papeis', icon: Shield, permissao: 'users.manage' },
      { label: 'Auditoria', to: '/admin/auditoria', icon: ScrollText, permissao: 'audit.view' },
    ],
  },
];

export const NAV_ICONE_PADRAO = BarChart3;
