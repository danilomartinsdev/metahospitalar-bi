import type { Permission } from '@meta-bi/shared';
import type { Component } from 'vue';
import {
  BarChart3,
  ClipboardList,
  FileUp,
  LayoutDashboard,
  MapPinned,
  ScrollText,
  Shield,
  Target,
  Trophy,
  Users,
  UserSquare2,
  Building2,
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
      { label: 'Gestores', to: '/dashboard/gestores', icon: Trophy, permissao: 'dashboard.view', fase: 3 },
      {
        label: 'Estados e regiões',
        to: '/dashboard/estados',
        icon: MapPinned,
        permissao: 'dashboard.view',
        fase: 3,
      },
      { label: 'Clientes', to: '/dashboard/clientes', icon: Building2, permissao: 'dashboard.view', fase: 3 },
      { label: 'Pedidos', to: '/pedidos', icon: ClipboardList, permissao: 'pedidos.view', fase: 3 },
    ],
  },
  {
    titulo: 'Administração',
    itens: [
      { label: 'Importações', to: '/admin/importacoes', icon: FileUp, permissao: 'import.run', fase: 2 },
      { label: 'Metas', to: '/admin/metas', icon: Target, permissao: 'metas.edit', fase: 2 },
      {
        label: 'Representantes',
        to: '/admin/representantes',
        icon: UserSquare2,
        permissao: 'cadastros.edit',
        fase: 2,
      },
      { label: 'Usuários', to: '/admin/usuarios', icon: Users, permissao: 'users.manage', fase: 4 },
      { label: 'Papéis', to: '/admin/papeis', icon: Shield, permissao: 'users.manage', fase: 4 },
      { label: 'Auditoria', to: '/admin/auditoria', icon: ScrollText, permissao: 'audit.view', fase: 4 },
    ],
  },
];

export const NAV_ICONE_PADRAO = BarChart3;
