/**
 * Templates de notificação do funil — funções PURAS (testáveis sem infra).
 * Produzem assunto + corpo em português. Sem dados sensíveis; apenas o nome
 * do candidato e o contexto da vaga/estágio.
 */

export type NotificationChannel = 'EMAIL' | 'WHATSAPP';

export interface RenderedMessage {
  readonly subject: string;
  readonly body: string;
}

function firstName(fullName: string): string {
  const trimmed = fullName.trim();
  return trimmed.split(/\s+/)[0] || trimmed;
}

export function renderApplicationReceived(
  candidateName: string,
  jobTitle: string,
): RenderedMessage {
  return {
    subject: `Recebemos a sua candidatura — ${jobTitle}`,
    body:
      `Olá, ${firstName(candidateName)}! Recebemos a sua candidatura para a vaga ` +
      `"${jobTitle}". Nossa equipe vai avaliar o seu perfil e retornaremos com os ` +
      `próximos passos. Obrigado pelo interesse.`,
  };
}

export function renderStageAdvanced(
  candidateName: string,
  jobTitle: string,
  stageName: string,
): RenderedMessage {
  return {
    subject: `Novidade no seu processo — ${jobTitle}`,
    body:
      `Olá, ${firstName(candidateName)}! Você avançou para a etapa "${stageName}" ` +
      `no processo seletivo da vaga "${jobTitle}". Em breve enviaremos os detalhes ` +
      `desta fase.`,
  };
}

export function renderRejection(
  candidateName: string,
  jobTitle: string,
): RenderedMessage {
  return {
    subject: `Atualização sobre o processo — ${jobTitle}`,
    body:
      `Olá, ${firstName(candidateName)}. Agradecemos a sua participação no processo ` +
      `seletivo da vaga "${jobTitle}". Nesta oportunidade seguiremos com outros ` +
      `candidatos, mas o seu perfil ficará em nosso banco de talentos. Desejamos ` +
      `sucesso na sua jornada.`,
  };
}
