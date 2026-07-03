import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { DomainError } from './domain-error';

interface ErrorBody {
  readonly code: string;
  readonly message: string;
  readonly details?: unknown;
  readonly path: string;
  readonly timestamp: string;
}

/**
 * Traduz erros de domínio e HTTP para respostas de API padronizadas.
 * Garante que nenhuma exceção vaze stack trace ao cliente (LGPD/segurança)
 * e que toda falha seja logada de forma estruturada. Nada de falha silenciosa.
 */
@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainExceptionFilter.name);

  public catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const body = this.toErrorBody(exception, request.url);

    this.logger.error(
      JSON.stringify({
        code: body.code,
        message: body.message,
        path: body.path,
        method: request.method,
      }),
      exception instanceof Error ? exception.stack : undefined,
    );

    const status = this.resolveStatus(exception);
    response.status(status).json(body);
  }

  private resolveStatus(exception: unknown): number {
    if (exception instanceof DomainError) {
      return exception.httpStatus;
    }
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }
    return 500;
  }

  private toErrorBody(exception: unknown, path: string): ErrorBody {
    const timestamp = new Date().toISOString();

    if (exception instanceof DomainError) {
      const details =
        'details' in exception
          ? (exception as { details?: unknown }).details
          : undefined;
      return {
        code: exception.code,
        message: exception.message,
        details,
        path,
        timestamp,
      };
    }

    if (exception instanceof HttpException) {
      return {
        code: 'HTTP_EXCEPTION',
        message: exception.message,
        path,
        timestamp,
      };
    }

    // Erro não previsto: não expõe detalhes internos.
    return {
      code: 'INTERNAL_ERROR',
      message: 'Erro interno inesperado',
      path,
      timestamp,
    };
  }
}
