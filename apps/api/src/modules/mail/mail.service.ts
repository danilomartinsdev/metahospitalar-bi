import { Inject, Injectable, Logger } from '@nestjs/common';
import nodemailer, { type Transporter } from 'nodemailer';
import { ENV, type Env } from '../../config/env.js';

export interface Email {
  para: string;
  assunto: string;
  texto: string;
  html: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;

  constructor(@Inject(ENV) private readonly env: Env) {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
    });
  }

  async enviar(email: Email): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.env.SMTP_FROM,
        to: email.para,
        subject: email.assunto,
        text: email.texto,
        html: email.html,
      });
    } catch (e) {
      // Não logar o conteúdo (pode conter link com token).
      this.logger.error(`Falha ao enviar e-mail "${email.assunto}": ${(e as Error).message}`);
    }
  }
}
