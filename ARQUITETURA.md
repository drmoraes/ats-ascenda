# ATS ASCENDA — Documento de Arquitetura (System Design)

> Versão 1.0 — Baseline aprovada. SaaS B2B multitenant para recrutamento com parseamento de currículos, gestão de funil, avaliações de liderança e matching preditivo com IA.

---

## 1. Decisões de Arquitetura (ADR resumido)

| # | Decisão | Escolha | Justificativa |
|---|---------|---------|---------------|
| ADR-01 | Cloud | **AWS** | Maturidade de RDS/KMS/SES, ecossistema de compliance, custo previsível em mid-market. |
| ADR-02 | Multitenancy | **Shared DB + Shared Schema + `tenant_id` + Row-Level Security (RLS)** | Melhor custo por tenant; isolamento reforçado no nível do banco (defesa em profundidade). Comporta híbrido com schema dedicado para clientes enterprise. |
| ADR-03 | IA (parsing/matching) | **API gerenciada com abstração `AIProvider`** | Velocidade de entrega no MVP; troca de provedor sem tocar no domínio. |
| ADR-04 | Backend | **NestJS (TypeScript estrito)** | Modularidade nativa, DI, tipagem forte, testabilidade. |
| ADR-05 | Frontend | **Next.js 14 (React + TS)** | SSR para SEO de vagas + SPA autenticada para recrutador. |
| ADR-06 | ORM | **Prisma + camada de Repositório** | Migrations versionadas; Prisma Client não vaza para os Services. |

---

## 2. Princípios Transversais

1. **Clean / Hexagonal Architecture** — domínio isolado de framework e persistência. Fluxo: `Controller → Service → Repository → (Prisma)`. Regras de negócio puras em `domain/`.
2. **Privacy by Design (LGPD)** — dados sensíveis segregados, criptografados e auditados. Anonimização e exclusão lógica previstas no schema.
3. **Multitenancy desde a linha 1** — `tenant_id` em toda entidade de negócio + RLS.
4. **Idempotência** — toda integração externa (webhooks, filas) tolera reentrega.
5. **Observabilidade** — logs estruturados (JSON), tracing distribuído (OpenTelemetry), métricas.
6. **Zero segredo hardcoded** — AWS Secrets Manager / variáveis de ambiente.

---

## 3. Stack Tecnológica

### Backend
- **NestJS** (Node 20 LTS, TypeScript `strict: true`, `noImplicitAny`).
- Validação: **Zod** / `class-validator` nas bordas (DTOs).
- Testes: **Jest** (unit) + **Supertest** (e2e).

### Frontend
- **Next.js 14** (App Router), **TypeScript**, **TailwindCSS + shadcn/Radix**.
- *Não implementado nesta fase (Sprint 3+).*

### Dados
- **PostgreSQL 16** com extensões `pgvector` (embeddings) e **RLS**.
- **Redis 7** — cache + filas.
- **BullMQ** — jobs assíncronos (parsing, matching, notificações, sync de job boards).
- **OpenSearch** — busca full-text facetada (entra quando o volume exigir).

### IA
- **Parsing** (PDF/DOCX → JSON): extração de texto (Apache Tika / `unstructured`) + LLM com *structured output* validado por Zod.
- **Matching**: embeddings (`pgvector`, similaridade coseno) + reranking ponderado (aderência técnica × fit cultural).
- **Mitigação de viés**: atributos protegidos (etnia, gênero, idade, PCD) são **fisicamente excluídos** do vetor de scoring; usados **somente** em dashboards de diversidade agregados.

### Infraestrutura (AWS)
- Compute: **ECS Fargate** (EKS se optar por Kubernetes).
- Dados: **RDS PostgreSQL Multi-AZ**, **ElastiCache Redis**.
- Storage: **S3** (currículos) com criptografia **KMS**.
- Mensageria: **SES** (e-mail), **SQS** (dead-letter das filas).
- Observabilidade: **CloudWatch + OpenTelemetry**.
- IaC: **Terraform**. CI/CD: **GitHub Actions**.

### Autenticação & Autorização
- **Keycloak** (OIDC self-hosted) ou **Auth0** (gerenciado) — a definir no Sprint 1.5.
- RBAC: `SUPERADMIN` (SaaS) → `TENANT_ADMIN` → `RECRUITER` → `HIRING_MANAGER` → `CANDIDATE`.

---

## 4. Multitenancy

Estratégia **Shared Schema + RLS**:
- Toda tabela de negócio possui `tenant_id UUID NOT NULL`.
- Sessão do banco define `SET app.current_tenant = '<uuid>'`.
- Policies RLS filtram automaticamente por `tenant_id`, impedindo vazamento cruzado mesmo em caso de bug na aplicação.
- Caminho de evolução: clientes enterprise com exigência de isolamento físico migram para *schema dedicado* — o design suporta o híbrido.

---

## 5. LGPD / Segurança por Design

- **Segregação**: PII sensível (etnia, gênero, PCD, avaliações) em tabela dedicada, criptografia a nível de campo (KMS/`pgcrypto`), acesso auditado.
- **Consentimento**: tabela `consent` com base legal, finalidade, versão do termo e timestamp.
- **Exclusão lógica + anonimização**: candidato não é apagado fisicamente durante processo ativo. No direito de exclusão, PII é substituída por hash irreversível preservando integridade estatística.
- **Audit log imutável** de todo acesso/alteração a dado sensível.
- **Retenção**: política de expurgo por finalidade (job configurável).

---

## 6. Plano de Ação — 5 Sprints

| Sprint | Foco | Entregáveis-chave |
|--------|------|-------------------|
| **1** | Fundação de Dados & Segurança | Schema multitenant (Prisma), RLS, migrations, entidades de domínio, camada de repositório, base RBAC, audit log, anonimização. |
| **2** | Portal do Candidato & Parsing | Cadastro, upload seguro (S3), pipeline assíncrono de parsing (Tika + LLM → JSON validado), acompanhamento de funil. |
| **3** | Portal do Recrutador | CRUD de vagas, Kanban do funil, triagem em massa, automação de feedbacks. |
| **4** | Motor de IA & People Analytics | Embeddings, ranqueamento com mitigação de viés, dashboards (SLA, tempo de fechamento, diversidade, ROI de canais). |
| **5** | Integrações & Hardening | WhatsApp API, SES/SendGrid, job boards (LinkedIn/Indeed), webhooks idempotentes (ERP/folha — ex.: LG), observabilidade, testes de carga. |

---

## 7. Estrutura de Diretórios (Backend)

```
src/
├── main.ts
├── app.module.ts
├── common/
│   ├── prisma/            # PrismaService + middleware de tenant
│   ├── rbac/              # guards e decorators de papéis
│   ├── audit/             # interceptor de audit log
│   └── errors/            # exceções de domínio + filtro global
├── modules/
│   ├── tenancy/
│   ├── identity/          # users, auth, roles
│   ├── candidates/
│   │   ├── domain/        # entidades e regras puras
│   │   ├── candidates.controller.ts
│   │   ├── candidates.service.ts
│   │   └── candidates.repository.ts
│   ├── jobs/
│   ├── applications/      # funil / pipeline
│   ├── consent/
│   └── ...
prisma/
├── schema.prisma
└── migrations/
    └── 0001_init_rls/
        └── rls_policies.sql
```

---

*Documento vivo. Alterações estruturais exigem novo ADR.*
