import { Injectable, Logger } from '@nestjs/common';
import { ZodError } from 'zod';
import { loadEnv, type AppEnv } from '../../common/config/env';
import { ResumeParsingError } from '../../common/errors/domain-error';
import {
  parseResumeParsedData,
  type ResumeParsedData,
} from '../candidates/domain/resume-parsed-data.schema';
import type { AiResumeParserPort } from './ports';

interface AnthropicContentBlock {
  readonly type: string;
  readonly text?: string;
}
interface AnthropicResponse {
  readonly content?: readonly AnthropicContentBlock[];
}

/**
 * Adapter concreto do parser via LLM gerenciado (API Anthropic-compatível).
 * Emite instrução de saída estruturada e valida o retorno contra o
 * contrato Zod antes de devolver. Timeout, erros de rede e JSON inválido
 * são tratados e convertidos em ResumeParsingError.
 *
 * Anti-viés: o prompt proíbe explicitamente inferir/retornar atributos
 * protegidos (etnia, gênero, idade, foto, estado civil).
 */
@Injectable()
export class LlmResumeParserAdapter implements AiResumeParserPort {
  private readonly logger = new Logger(LlmResumeParserAdapter.name);
  private readonly env: AppEnv;

  public constructor() {
    this.env = loadEnv();
  }

  public async parse(text: string): Promise<ResumeParsedData> {
    const raw = await this.callModel(text);
    try {
      return parseResumeParsedData(raw);
    } catch (err) {
      if (err instanceof ZodError) {
        this.logger.warn(
          `Saída do LLM fora do contrato: ${JSON.stringify(err.issues)}`,
        );
        throw new ResumeParsingError('saida do modelo nao satisfaz o contrato');
      }
      throw err;
    }
  }

  private async callModel(resumeText: string): Promise<unknown> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.env.AI_PARSER_TIMEOUT_MS,
    );

    try {
      const response = await fetch(
        `${this.env.AI_PARSER_API_BASE_URL}/messages`,
        {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'content-type': 'application/json',
            'x-api-key': this.env.AI_PARSER_API_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: this.env.AI_PARSER_MODEL,
            max_tokens: 4096,
            temperature: 0,
            system: this.systemPrompt(),
            messages: [{ role: 'user', content: resumeText }],
          }),
        },
      );

      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new ResumeParsingError(
          `provedor de IA respondeu ${response.status}: ${detail.slice(0, 200)}`,
        );
      }

      const payload = (await response.json()) as AnthropicResponse;
      const jsonText = payload.content?.find((b) => b.type === 'text')?.text;
      if (!jsonText) {
        throw new ResumeParsingError('resposta do provedor sem conteúdo textual');
      }
      return this.extractJson(jsonText);
    } catch (err) {
      if (err instanceof ResumeParsingError) {
        throw err;
      }
      if (err instanceof Error && err.name === 'AbortError') {
        throw new ResumeParsingError('timeout ao chamar o provedor de IA');
      }
      const message = err instanceof Error ? err.message : 'erro desconhecido';
      throw new ResumeParsingError(`chamada ao provedor de IA: ${message}`);
    } finally {
      clearTimeout(timeout);
    }
  }

  /** Remove eventuais cercas markdown e faz o parse de JSON. */
  private extractJson(content: string): unknown {
    const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    const candidate = (fenced ? fenced[1] : content).trim();
    try {
      return JSON.parse(candidate);
    } catch {
      throw new ResumeParsingError('resposta do modelo não é JSON válido');
    }
  }

  private systemPrompt(): string {
    return [
      'Você extrai dados estruturados de currículos.',
      'Responda APENAS com um objeto JSON válido, sem texto fora do JSON.',
      'O JSON deve seguir exatamente este contrato:',
      '{',
      '  "schemaVersion": "1.0",',
      '  "headline": string|null,',
      '  "summary": string|null,',
      '  "totalYearsOfExperience": number|null,',
      '  "skills": [{ "name": string, "category": "TECNICA"|"COMPORTAMENTAL"|"FERRAMENTA"|"OUTRO", "yearsOfExperience": number|null }],',
      '  "experiences": [{ "company": string, "role": string, "startDate": "YYYY-MM", "endDate": "YYYY-MM"|null, "isCurrent": boolean, "description": string|null, "technologies": string[] }],',
      '  "education": [{ "institution": string, "degree": string, "fieldOfStudy": string|null, "startDate": "YYYY-MM"|null, "endDate": "YYYY-MM"|null, "isCompleted": boolean }],',
      '  "languages": [{ "language": string, "proficiency": "BASICO"|"INTERMEDIARIO"|"AVANCADO"|"FLUENTE"|"NATIVO" }],',
      '  "certifications": string[],',
      '  "parseConfidence": number entre 0 e 1',
      '}',
      'NUNCA infira ou inclua etnia, cor, raça, gênero, idade, data de nascimento, foto, religião ou estado civil.',
      'Use null quando a informação não estiver presente. Não invente dados.',
    ].join('\n');
  }
}
