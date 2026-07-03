# Imagem de desenvolvimento/demonstração do backend ATS ASCENDA.
# Usamos a imagem "bookworm" completa (não a slim) porque ela já inclui OpenSSL,
# do qual os engines do Prisma dependem. A slim não traz libssl e causa
# "Schema engine error", e instalar via apt exige rede aos mirrors do Debian.
# Para produção, prefira multi-stage com imagem mínima + openssl instalado.
FROM node:20-bookworm

WORKDIR /app

# Instala dependências (inclui devDeps: ts-node/prisma para bootstrap).
COPY package.json package-lock.json* ./
RUN npm install

# Código-fonte e schema.
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src
COPY scripts ./scripts
COPY docker ./docker

# Gera o Prisma Client e compila o TypeScript.
RUN npx prisma generate && npm run build

RUN chmod +x docker/entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["./docker/entrypoint.sh"]
