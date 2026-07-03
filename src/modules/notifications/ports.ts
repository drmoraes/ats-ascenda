import type { NotificationChannel } from './domain/templates';

export interface OutboundMessage {
  /** Destino: e-mail ou telefone E.164, conforme o canal. */
  readonly to: string;
  readonly subject: string;
  readonly body: string;
}

/**
 * Porta de envio por canal (arquitetura hexagonal). Cada adapter concreto
 * declara o canal que atende. Trocar de provedor = novo adapter.
 */
export interface MessageSenderPort {
  readonly channel: NotificationChannel;
  send(message: OutboundMessage): Promise<void>;
}

export const EMAIL_SENDER = Symbol('EMAIL_SENDER');
export const WHATSAPP_SENDER = Symbol('WHATSAPP_SENDER');
