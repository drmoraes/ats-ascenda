import { Injectable, Logger } from '@nestjs/common';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import {
  UnsupportedFileTypeError,
  ResumeParsingError,
} from '../../common/errors/domain-error';
import {
  ExtractedText,
  TextExtractorPort,
  isSupportedResumeMimeType,
} from './ports';

/**
 * Adapter concreto de extração de texto.
 * PDF -> pdf-parse; DOCX -> mammoth. Erros de biblioteca são
 * encapsulados em ResumeParsingError (nada de falha silenciosa).
 */
@Injectable()
export class TextExtractorAdapter implements TextExtractorPort {
  private readonly logger = new Logger(TextExtractorAdapter.name);

  public async extract(
    buffer: Buffer,
    mimeType: string,
  ): Promise<ExtractedText> {
    if (!isSupportedResumeMimeType(mimeType)) {
      throw new UnsupportedFileTypeError(mimeType);
    }

    try {
      if (mimeType === 'application/pdf') {
        const result = await pdfParse(buffer);
        return {
          text: this.normalize(result.text),
          pageCount: result.numpages ?? null,
        };
      }

      // DOCX
      const result = await mammoth.extractRawText({ buffer });
      return { text: this.normalize(result.value), pageCount: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'erro desconhecido';
      this.logger.error(`Falha ao extrair texto (${mimeType}): ${message}`);
      throw new ResumeParsingError(`extracao de texto: ${message}`);
    }
  }

  private normalize(text: string): string {
    const cleaned = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    if (cleaned.length === 0) {
      throw new ResumeParsingError('documento sem texto extraível');
    }
    return cleaned;
  }
}
