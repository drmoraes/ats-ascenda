import { Inject, Injectable } from '@nestjs/common';
import { ValidationError } from '../../common/errors/domain-error';
import type { NotificationChannel } from './domain/templates';
import {
  EMAIL_SENDER,
  WHATSAPP_SENDER,
  type MessageSenderPort,
  type OutboundMessage,
} from './ports';

/**
 * Seleciona o adapter correto pelo canal e delega o envio. Ponto único de
 * roteamento — novos canais entram registrando mais senders.
 */
@Injectable()
export class NotificationDispatcher {
  private readonly senders: Map<NotificationChannel, MessageSenderPort>;

  public constructor(
    @Inject(EMAIL_SENDER) emailSender: MessageSenderPort,
    @Inject(WHATSAPP_SENDER) whatsappSender: MessageSenderPort,
  ) {
    this.senders = new Map<NotificationChannel, MessageSenderPort>([
      [emailSender.channel, emailSender],
      [whatsappSender.channel, whatsappSender],
    ]);
  }

  public async dispatch(
    channel: NotificationChannel,
    message: OutboundMessage,
  ): Promise<void> {
    const sender = this.senders.get(channel);
    if (!sender) {
      throw new ValidationError(`Canal de notificação não suportado: ${channel}`);
    }
    await sender.send(message);
  }
}
