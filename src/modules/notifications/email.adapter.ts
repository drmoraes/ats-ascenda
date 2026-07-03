import { Injectable, Logger } from '@nestjs/common';
import { loadEnv, type AppEnv } from '../../common/config/env';
import { ValidationError } from '../../common/errors/domain-error';
import type { MessageSenderPort, OutboundMessage } from './ports';
import type { NotificationChannel } from './domain/templates';

/**
 * Adapter de e-mail via provedor HTTP (ex.: SendGrid/SES API). Config é lida
 * do ambiente; se ausente, falha alto ao ENVIAR (não no boot), pois o canal
 * pode não estar habilitado em todos os ambientes.
 */
@Injectable()
export class EmailSenderAdapter implements MessageSenderPort {
  public readonly channel: NotificationChannel = 'EMAIL';
  private readonly logger = new Logger(EmailSenderAdapter.name);
  private readonly env: AppEnv;

  public constructor() {
    this.env = loadEnv();
  }

  public async send(message: OutboundMessage): Promise<void> {
    const baseUrl = this.env.EMAIL_API_BASE_URL;
    const apiKey = this.env.EMAIL_API_KEY;
    const from = this.env.EMAIL_FROM;
    if (!baseUrl || !apiKey || !from) {
      throw new ValidationError('Canal de e-mail não configurado no ambiente');
    }

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.env.NOTIFICATION_TIMEOUT_MS,
    );
    try {
      const response = await fetch(`${baseUrl}/mail/send`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from,
          to: message.to,
          subject: message.subject,
          text: message.body,
        }),
      });
      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new ValidationError(
          `provedor de e-mail respondeu ${response.status}: ${detail.slice(0, 200)}`,
        );
      }
    } catch (err) {
      if (err instanceof ValidationError) {
        throw err;
      }
      if (err instanceof Error && err.name === 'AbortError') {
        throw new ValidationError('timeout ao enviar e-mail');
      }
      const msg = err instanceof Error ? err.message : 'erro desconhecido';
      this.logger.error(`Falha ao enviar e-mail: ${msg}`);
      throw new ValidationError(`envio de e-mail: ${msg}`);
    } finally {
      clearTimeout(timeout);
    }
  }
}
