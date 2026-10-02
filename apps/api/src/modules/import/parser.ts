import { COLUNAS_FOCCO, normalizarNome } from '@meta-bi/shared';
import * as XLSX from 'xlsx';

export type Formato = 'html' | 'xls' | 'xlsx' | 'csv';
export type LinhaBruta = Record<keyof typeof COLUNAS_FOCCO, string> & { numeroLinha: number };

export class ArquivoInvalidoError extends Error {}

const MAX_LINHAS = 50_000;

/** Detecta o formato pelo conteúdo (nunca pela extensão). */
export function detectarFormato(buf: Buffer): Formato {
  if (buf.subarray(0, 8).equals(Buffer.from('d0cf11e0a1b11ae1', 'hex'))) return 'xls';
  if (buf.subarray(0, 4).equals(Buffer.from('504b0304', 'hex'))) {
    if (buf.includes('[Content_Types].xml')) return 'xlsx';
    throw new ArquivoInvalidoError('Arquivo compactado não é uma planilha .xlsx.');
  }
  const inicio = buf.subarray(0, 4096).toString('latin1').trimStart().toLowerCase();
  if (inicio.startsWith('<') && /<table|<html/.test(buf.subarray(0, 65536).toString('latin1').toLowerCase()))
    return 'html';
  if (/[;\t,]/.test(inicio) && !buf.subarray(0, 4096).includes(0)) return 'csv';
  throw new ArquivoInvalidoError(
    'Formato não reconhecido. Envie o relatório do Focco (.xls, .xlsx ou .csv).',
  );
}

/** Texto em UTF-8; se houver bytes inválidos, Windows-1252 (padrão dos relatórios do Focco). */
function decodificar(buf: Buffer): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buf);
  } catch {
    return new TextDecoder('windows-1252').decode(buf);
  }
}

/** Lê o arquivo e devolve as linhas da tabela como strings, já localizando o cabeçalho. */
export function lerRelatorio(buf: Buffer): { formato: Formato; linhas: LinhaBruta[] } {
  const formato = detectarFormato(buf);
  // raw: true mantém "05/01/26" e "83575,749" como texto (sem conversão para data/float).
  const opts: XLSX.ParsingOptions = { raw: true, cellFormula: false, cellHTML: false, dense: true };
  const wb =
    formato === 'xls' || formato === 'xlsx'
      ? XLSX.read(buf, { ...opts, type: 'buffer' })
      : XLSX.read(decodificar(buf), { ...opts, type: 'string' });

  const ws = wb.Sheets[wb.SheetNames[0]!];
  if (!ws) throw new ArquivoInvalidoError('A planilha está vazia.');
  const matriz = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    raw: false,
    defval: '',
    blankrows: false,
  });
  if (matriz.length > MAX_LINHAS) throw new ArquivoInvalidoError(`Arquivo com mais de ${MAX_LINHAS} linhas.`);

  // Pula as linhas de título até achar o cabeçalho com todas as colunas obrigatórias.
  const obrigatorias = Object.values(COLUNAS_FOCCO);
  const iCab = matriz.findIndex((l) => {
    const nomes = l.map((c) => normalizarNome(String(c)));
    return obrigatorias.every((o) => nomes.includes(o));
  });
  if (iCab === -1) {
    throw new ArquivoInvalidoError(
      `Cabeçalho não encontrado. Colunas esperadas: ${obrigatorias.join(', ')}.`,
    );
  }
  const cab = matriz[iCab]!.map((c) => normalizarNome(String(c)));
  const pos = Object.fromEntries(
    Object.entries(COLUNAS_FOCCO).map(([campo, nome]) => [campo, cab.indexOf(nome)]),
  ) as Record<keyof typeof COLUNAS_FOCCO, number>;

  const linhas: LinhaBruta[] = [];
  matriz.slice(iCab + 1).forEach((l, i) => {
    const valores = Object.fromEntries(
      Object.entries(pos).map(([campo, p]) => [campo, String(l[p] ?? '').trim()]),
    ) as Record<keyof typeof COLUNAS_FOCCO, string>;
    if (Object.values(valores).every((v) => !v)) return;
    linhas.push({ ...valores, numeroLinha: iCab + i + 2 });
  });
  return { formato, linhas };
}
