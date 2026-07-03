import { Global, Module } from '@nestjs/common';
import { TokenService } from './token.service';

/**
 * Módulo de autenticação. Exporta o TokenService (usado pelo AuthMiddleware
 * e pelo cadastro de candidato para emitir o token de sessão).
 * Global: o middleware de auth é registrado no AppModule.
 */
@Global()
@Module({
  providers: [TokenService],
  exports: [TokenService],
})
export class AuthModule {}
