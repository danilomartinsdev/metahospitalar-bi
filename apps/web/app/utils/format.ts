// Formatação pt-BR. Único ponto de formatação de números e datas da interface.
const TZ = 'America/Sao_Paulo';

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const compact = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });
const pct = new Intl.NumberFormat('pt-BR', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const int = new Intl.NumberFormat('pt-BR');
const date = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TZ,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});
const dateTime = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TZ,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const VAZIO = '—';

/** Valores monetários chegam da API como string decimal ("83575.75"). */
type Numero = number | string | null | undefined;

function toNumber(v: Numero): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

export function formatBRL(v: Numero): string {
  const n = toNumber(v);
  return n === null ? VAZIO : brl.format(n);
}

export function formatCompact(v: Numero): string {
  const n = toNumber(v);
  return n === null ? VAZIO : compact.format(n);
}

/** Recebe fração (0.833 → "83,3%"). */
export function formatPct(v: Numero): string {
  const n = toNumber(v);
  return n === null ? VAZIO : pct.format(n);
}

export function formatInt(v: Numero): string {
  const n = toNumber(v);
  return n === null ? VAZIO : int.format(n);
}

/** Datas sem hora ("2026-08-05") são tratadas como dia civil, sem conversão de fuso. */
export function formatDate(v: string | Date | null | undefined): string {
  if (!v) return VAZIO;
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const [y, m, d] = v.split('-');
    return `${d}/${m}/${y}`;
  }
  const d = typeof v === 'string' ? new Date(v) : v;
  return Number.isNaN(d.getTime()) ? VAZIO : date.format(d);
}

export function formatDateTime(v: string | Date | null | undefined): string {
  if (!v) return VAZIO;
  const d = typeof v === 'string' ? new Date(v) : v;
  return Number.isNaN(d.getTime()) ? VAZIO : dateTime.format(d);
}
