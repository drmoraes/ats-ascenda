import { Injectable, Logger } from '@nestjs/common';
import { loadEnv, type AppEnv } from '../../common/config/env';
import { ValidationError } from '../../common/errors/domain-error';
import type { EmbeddingPort } from './ports';

interface EmbeddingApiResponse {
  readonly data?: ReadonlyArray<{ readonly embedding?: readonly number[] }>;
}

/**
 * Adapter concreto de embeddings via API gerenciada (OpenAI-compatível).
 * Timeout, erros de rede e formato inesperado são tratados explicitamente.
 * Reaproveita a base de configuração de IA já validada no boot.
 */
@Injectable()
export class EmbeddingAdapter implements EmbeddingPort {
  private readonly logger = new Logger(EmbeddingAdapter.name);
  private readonly env: AppEnv;

  public constructor() {
    this.env = loadEnv();
  }

  public async embed(text: string): Promise<readonly number[]> {
    const input = text.trim();
    if (input.length === 0) {
      // Vetor nulo é tratado como "sem sinal" pelo scoring (cosine=0).
      return [];
    }

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.env.AI_PARSER_TIMEOUT_MS,
    );
    try {
      const response = await fetch(
        `${this.env.AI_PARSER_API_BASE_URL}/embeddings`,
        {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${this.env.AI_PARSER_API_KEY}`,
          },
          body: JSON.stringify({ model: this.env.AI_PARSER_MODEL, input }),
        },
      );
      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new ValidationError(
          `provedor de embeddings respondeu ${response.status}: ${detail.slice(0, 200)}`,
        );
      }
      const payload = (await response.json()) as EmbeddingApiResponse;
      const vector = payload.data?.[0]?.embedding;
      if (!vector || vector.length === 0) {
        throw new ValidationError('resposta de embeddings vazia');
      }
      return vector;
    } catch (err) {
      if (err instanceof ValidationError) {
        throw err;
      }
      if (err instanceof Error && err.name === 'AbortError') {
        throw new ValidationError('timeout ao gerar embeddings');
      }
      const message = err instanceof Error ? err.message : 'erro desconhecido';
      this.logger.error(`Falha ao gerar embeddings: ${message}`);
      throw new ValidationError(`geração de embeddings: ${message}`);
    } finally {
      clearTimeout(timeout);
    }
  }
}
