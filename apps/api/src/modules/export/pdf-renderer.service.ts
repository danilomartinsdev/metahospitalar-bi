import { Inject, Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import { type Browser, chromium } from 'playwright-core';
import { ENV, type Env } from '../../config/env.js';

/** Abre uma URL da SPA em Chromium headless e devolve o PDF A4 (ADR 0004). Substituível em testes. */
export abstract class PdfRenderer {
  abstract renderizar(url: string, rodape: string): Promise<Buffer>;
}

const MAX_SIMULTANEOS = 2;
const TIMEOUT_MS = 45_000;

@Injectable()
export class ChromiumPdfRenderer extends PdfRenderer implements OnModuleDestroy {
  private readonly logger = new Logger(ChromiumPdfRenderer.name);
  private browser: Promise<Browser> | null = null;
  private ativos = 0;
  private readonly fila: (() => void)[] = [];

  constructor(@Inject(ENV) private readonly env: Env) {
    super();
  }

  private navegador(): Promise<Browser> {
    this.browser ??= chromium
      .launch({ headless: true, executablePath: this.env.PDF_CHROMIUM_PATH || undefined, args: ['--no-sandbox'] })
      .catch((e: unknown) => {
        this.browser = null;
        throw e;
      });
    return this.browser;
  }

  private async vaga(): Promise<void> {
    if (this.ativos < MAX_SIMULTANEOS) {
      this.ativos++;
      return;
    }
    await new Promise<void>((ok) => this.fila.push(ok));
  }

  private liberar() {
    const proximo = this.fila.shift();
    if (proximo) proximo();
    else this.ativos--;
  }

  async renderizar(url: string, rodape: string): Promise<Buffer> {
    await this.vaga();
    const ctx = await (await this.navegador()).newContext({ locale: 'pt-BR', timezoneId: 'America/Sao_Paulo' });
    try {
      const page = await ctx.newPage();
      await page.emulateMedia({ media: 'print', colorScheme: 'light' });
      await page.goto(url, { waitUntil: 'networkidle', timeout: TIMEOUT_MS });
      // A página sinaliza quando dados e gráficos terminaram de desenhar (ou que deu erro).
      await page.waitForFunction(() => (window as { __relatorio?: string }).__relatorio, null, {
        timeout: TIMEOUT_MS,
      });
      const estado = await page.evaluate(() => (window as { __relatorio?: string }).__relatorio);
      if (estado !== 'pronto') throw new Error(`Página de impressão sinalizou "${estado}"`);
      const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
      return await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '14mm', bottom: '16mm', left: '10mm', right: '10mm' },
        displayHeaderFooter: true,
        headerTemplate: '<span></span>',
        footerTemplate: `<div style="font-size:8px;width:100%;padding:0 10mm;color:#64748b;display:flex;justify-content:space-between;font-family:Inter,system-ui,sans-serif"><span>${esc(rodape)}</span><span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span></div>`,
      });
    } finally {
      await ctx.close().catch(() => undefined);
      this.liberar();
    }
  }

  async onModuleDestroy() {
    if (!this.browser) return;
    try {
      await (await this.browser).close();
    } catch (e) {
      this.logger.warn(`Falha ao fechar o Chromium: ${(e as Error).message}`);
    }
  }
}
