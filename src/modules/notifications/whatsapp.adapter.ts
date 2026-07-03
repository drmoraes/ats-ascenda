import { Injectable, Logger } from '@nestjs/common';
import { loadEnv, type AppEnv } from '../../common/config/env';
import { ValidationError } from '../../common/errors/domain-error';
import type { MessageSenderPort, OutboundMessage } from './ports';
import type { NotificationChannel } from './domain/templates';

/**
 * Adapter de WhatsApp via API (padrão WhatsApp Cloud API). O destino deve ser
 * um telefone E.164. Config lida do ambiente; falha alto ao ENVIAR se ausente.
 */
@Injectable()
export class WhatsappSenderAdapter implements MessageSenderPort {
  public readonly channel: NotificationChannel = 'WHATSAPP';
  private readonly logger = new Logger(WhatsappSenderAdapter.name);
  private readonly env: AppEnv;

  public constructor() {
    this.env = loadEnv();
  }

  public async send(message: OutboundMessage): Promise<void> {
    const baseUrl = this.env.WHATSAPP_API_BASE_URL;
    const token = this.env.WHATSAPP_API_TOKEN;
    const phoneId = this.env.WHATSAPP_PHONE_ID;
    if (!baseUrl || !token || !phoneId) {
      throw new ValidationError('Canal de WhatsApp não configurado no ambiente');
    }

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.env.NOTIFICATION_TIMEOUT_MS,
    );
    try {
      const response = await fetch(`${baseUrl}/${phoneId}/messages`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: message.to,
          type: 'text',
          text: { body: message.body },
        }),
      });
      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new ValidationError(
          `provedor de WhatsApp respondeu ${response.status}: ${detail.slice(0, 200)}`,
        );
      }
    } catch (err) {
      if (err instanceof ValidationError) {
        throw err;
      }
      if (err instanceof Error && err.name === 'AbortError') {
        throw new ValidationError('timeout ao enviar WhatsApp');
      }
      const msg = err instanceof Error ? err.message : 'erro desconhecido';
      this.logger.error(`Falha ao enviar WhatsApp: ${msg}`);
      throw new ValidationError(`envio de WhatsApp: ${msg}`);
    } finally {
      clearTimeout(timeout);
    }
  }
}
