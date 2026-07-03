import type { ResumeParsedData } from '../candidates/domain/resume-parsed-data.schema';

/**
 * Portas (interfaces) da arquitetura hexagonal para IA.
 * O domínio depende destas abstrações — nunca de um SDK específico.
 * Trocar de provedor = novo adapter, zero mudança na regra de negócio.
 */

export interface ExtractedText {
  readonly text: string;
  readonly pageCount: number | null;
}

/** Extrai texto puro de um arquivo de currículo (PDF/DOCX). */
export interface TextExtractorPort {
  extract(buffer: Buffer, mimeType: string): Promise<ExtractedText>;
}

/** Converte texto de currículo em JSON estruturado validado. */
export interface AiResumeParserPort {
  parse(text: string): Promise<ResumeParsedData>;
}

// Tokens de injeção (Nest usa símbolos/strings p/ interfaces).
export const TEXT_EXTRACTOR = Symbol('TEXT_EXTRACTOR');
export const AI_RESUME_PARSER = Symbol('AI_RESUME_PARSER');

/** MIME types aceitos pelo extrator. */
export const SUPPORTED_RESUME_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
] as const;

export type SupportedResumeMimeType =
  (typeof SUPPORTED_RESUME_MIME_TYPES)[number];

export function isSupportedResumeMimeType(
  mime: string,
): mime is SupportedResumeMimeType {
  return (SUPPORTED_RESUME_MIME_TYPES as readonly string[]).includes(mime);
}
