import {
  renderApplicationReceived,
  renderRejection,
  renderStageAdvanced,
} from '../../src/modules/notifications/domain/templates';

describe('templates de notificação', () => {
  it('candidatura recebida usa o primeiro nome e a vaga', () => {
    const msg = renderApplicationReceived('Ana Ribeiro', 'Data Engineer');
    expect(msg.subject).toContain('Data Engineer');
    expect(msg.body).toContain('Ana');
    expect(msg.body).not.toContain('Ribeiro');
  });

  it('avanço de etapa cita o estágio', () => {
    const msg = renderStageAdvanced('Bruno Costa', 'BI Developer', 'Entrevista RH');
    expect(msg.body).toContain('Entrevista RH');
    expect(msg.body).toContain('BI Developer');
  });

  it('reprovação mantém tom respeitoso e cita banco de talentos', () => {
    const msg = renderRejection('Carla Dias', 'Analista');
    expect(msg.body).toContain('Carla');
    expect(msg.body.toLowerCase()).toContain('banco de talentos');
  });
});
