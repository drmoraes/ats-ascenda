/**
 * Porta de embeddings (arquitetura hexagonal). O motor de matching depende
 * desta abstração — não de um provedor específico. Troca de modelo = novo
 * adapter, sem tocar no domínio.
 */
export interface EmbeddingPort {
  /** Gera o vetor de embedding para um texto. */
  embed(text: string): Promise<readonly number[]>;
}

export const EMBEDDING_PROVIDER = Symbol('EMBEDDING_PROVIDER');
