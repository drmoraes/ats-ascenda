import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { loadEnv, type AppEnv } from '../../common/config/env';
import { ResumeParsingError } from '../../common/errors/domain-error';

export interface PresignedUpload {
  readonly storageKey: string;
  readonly uploadUrl: string;
  readonly expiresInSeconds: number;
}

/**
 * Armazenamento de currículos em S3 com upload direto via URL pré-assinada
 * (o arquivo não trafega pelo backend) e criptografia server-side (KMS).
 * A chave é namespaced por tenant para rastreabilidade.
 */
@Injectable()
export class ResumeStorageService {
  private readonly logger = new Logger(ResumeStorageService.name);
  private readonly env: AppEnv;
  private readonly client: S3Client;
  private static readonly UPLOAD_TTL_SECONDS = 300;

  public constructor() {
    this.env = loadEnv();
    this.client = new S3Client({
      region: this.env.AWS_REGION,
      // MinIO/local: endpoint custom + path-style. Em produção fica indefinido.
      ...(this.env.AWS_ENDPOINT_URL
        ? { endpoint: this.env.AWS_ENDPOINT_URL, forcePathStyle: true }
        : {}),
    });
  }

  public buildStorageKey(tenantId: string, candidateId: string): string {
    return `tenants/${tenantId}/candidates/${candidateId}/resumes/${randomUUID()}`;
  }

  public async createPresignedUpload(
    storageKey: string,
    mimeType: string,
  ): Promise<PresignedUpload> {
    const command = new PutObjectCommand({
      Bucket: this.env.S3_RESUMES_BUCKET,
      Key: storageKey,
      ContentType: mimeType,
      ServerSideEncryption: 'aws:kms',
    });
    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn: ResumeStorageService.UPLOAD_TTL_SECONDS,
    });
    return {
      storageKey,
      uploadUrl,
      expiresInSeconds: ResumeStorageService.UPLOAD_TTL_SECONDS,
    };
  }

  public async download(storageKey: string): Promise<Buffer> {
    try {
      const output = await this.client.send(
        new GetObjectCommand({
          Bucket: this.env.S3_RESUMES_BUCKET,
          Key: storageKey,
        }),
      );
      if (!output.Body) {
        throw new ResumeParsingError('objeto S3 vazio');
      }
      const bytes = await output.Body.transformToByteArray();
      return Buffer.from(bytes);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'erro desconhecido';
      this.logger.error(`Falha ao baixar ${storageKey}: ${message}`);
      throw new ResumeParsingError(`download do curriculo: ${message}`);
    }
  }
}
