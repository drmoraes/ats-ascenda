import { Module } from '@nestjs/common';
import { AI_RESUME_PARSER, TEXT_EXTRACTOR } from './ports';
import { TextExtractorAdapter } from './text-extractor.adapter';
import { LlmResumeParserAdapter } from './llm-resume-parser.adapter';

/**
 * Vincula as portas de IA aos adapters concretos.
 * Trocar de provedor futuramente = alterar apenas o useClass aqui.
 */
@Module({
  providers: [
    { provide: TEXT_EXTRACTOR, useClass: TextExtractorAdapter },
    { provide: AI_RESUME_PARSER, useClass: LlmResumeParserAdapter },
  ],
  exports: [TEXT_EXTRACTOR, AI_RESUME_PARSER],
})
export class AiModule {}
