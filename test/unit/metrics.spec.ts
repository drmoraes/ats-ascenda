import {
  computeChannelRoi,
  computeDiversity,
  computeSlaMetrics,
  daysBetween,
} from '../../src/modules/analytics/domain/metrics';

describe('daysBetween', () => {
  it('conta dias inteiros e nunca negativo', () => {
    expect(daysBetween(new Date('2026-01-01'), new Date('2026-01-11'))).toBe(10);
    expect(daysBetween(new Date('2026-02-01'), new Date('2026-01-01'))).toBe(0);
  });
});

describe('computeSlaMetrics', () => {
  const now = new Date('2026-07-01');
  it('separa vagas abertas e fechadas e calcula médias', () => {
    const rows = [
      { status: 'OPEN', openedAt: new Date('2026-06-21'), closedAt: null },
      { status: 'OPEN', openedAt: new Date('2026-06-11'), closedAt: null },
      { status: 'CLOSED', openedAt: new Date('2026-05-01'), closedAt: new Date('2026-05-31') },
      { status: 'DRAFT', openedAt: null, closedAt: null },
    ];
    const m = computeSlaMetrics(rows, now);
    expect(m.openJobs).toBe(2);
    expect(m.avgDaysOpen).toBe(15); // (10 + 20) / 2
    expect(m.closedJobs).toBe(1);
    expect(m.avgDaysToClose).toBe(30);
  });
});

describe('computeChannelRoi', () => {
  it('agrupa por canal e calcula taxa de conversão', () => {
    const rows = [
      { source: 'LinkedIn', status: 'HIRED' },
      { source: 'LinkedIn', status: 'IN_PROGRESS' },
      { source: 'LinkedIn', status: 'REJECTED' },
      { source: 'Indeed', status: 'IN_PROGRESS' },
      { source: null, status: 'HIRED' },
    ];
    const roi = computeChannelRoi(rows);
    const linkedin = roi.find((r) => r.source === 'LinkedIn');
    expect(linkedin).toEqual({
      source: 'LinkedIn',
      applications: 3,
      hires: 1,
      conversionRate: 0.333,
    });
    expect(roi.find((r) => r.source === 'Desconhecido')?.applications).toBe(1);
  });
});

describe('computeDiversity (supressão de células pequenas)', () => {
  it('suprime categorias com menos de minCellSize e calcula percentuais', () => {
    const labels = [
      ...Array(6).fill('MULHER'),
      ...Array(3).fill('HOMEM'), // < 5 -> suprimido
      ...Array(1).fill('NAO_BINARIO'), // < 5 -> suprimido
    ];
    const result = computeDiversity(labels, 5);
    const mulher = result.find((r) => r.label === 'MULHER');
    const homem = result.find((r) => r.label === 'HOMEM');

    expect(mulher?.count).toBe(6);
    expect(mulher?.percentage).toBe(60);
    expect(homem?.suppressed).toBe(true);
    expect(homem?.count).toBeNull();
    expect(homem?.percentage).toBeNull();
  });
});
