# Deploy em produção (AWS)

Infraestrutura como código (Terraform) para o ATS ASCENDA na AWS: VPC,
RDS Postgres, ElastiCache Redis, S3+KMS, ECR, Secrets Manager, ECS Fargate + ALB.

> Região padrão: `sa-east-1` (São Paulo) — residência de dados no Brasil, LGPD.

## Pré-requisitos

- Conta AWS com permissões de administrador.
- `terraform >= 1.6`, `aws` CLI configurado, `docker`.

## ⚠️ Antes do go-live: 2 pendências conhecidas

Estas precisam ser fechadas antes de um deploy real (estão documentadas e são
os próximos incrementos):

1. **Entrypoint de produção + migrations.** O entrypoint atual do container
   (`docker/entrypoint.sh`) roda `prisma db push` + **seed de dados demo** a
   cada start — apropriado para o ambiente local, NÃO para produção. Para
   produção é preciso: (a) migrations versionadas (`prisma migrate deploy`),
   (b) rodar RLS/grants como migração, (c) **remover o seed**, e (d) executar a
   migração como tarefa única (não em toda task, para evitar corrida com
   `desired_count > 1`).
2. **Keycloak.** Não é provisionado aqui — deve rodar como serviço próprio
   (outro serviço ECS, ou uma instância gerenciada) e ter backup do realm.
   Aponte `keycloak_issuer`/`keycloak_jwks_url` nas variáveis. Alternativa:
   avaliar Amazon Cognito.

## Passo a passo

### 1. Estado remoto (recomendado)

Crie um bucket S3 + tabela DynamoDB para o state e descomente o bloco `backend`
em `versions.tf`.

### 2. Inicializar e criar o registry primeiro

```bash
cd deploy/terraform
cp terraform.tfvars.example terraform.tfvars   # edite os valores
terraform init
terraform apply -target=aws_ecr_repository.api
```

### 3. Build e push da imagem

```bash
ECR=$(terraform output -raw ecr_repository_url)
aws ecr get-login-password --region sa-east-1 \
  | docker login --username AWS --password-stdin "$ECR"
# a partir da raiz do projeto:
docker build -t "$ECR:latest" .
docker push "$ECR:latest"
```

### 4. Provisionar o restante

Preencha `api_image = "<ECR>:latest"` no `terraform.tfvars` e:

```bash
terraform apply
```

Isso cria RDS, Redis, S3, ALB, ECS e os segredos (DATABASE_URL, REDIS_URL e
CANDIDATE_JWT_SECRET já entram cifrados automaticamente).

### 5. Completar os segredos externos

No AWS Secrets Manager, edite `ats-ascenda-prod/app-env` e preencha
`AI_PARSER_API_KEY` (e e-mail/WhatsApp se for usar). Force um novo deploy:

```bash
aws ecs update-service --cluster $(terraform output -raw ecs_cluster_name) \
  --service $(terraform output -raw ecs_service_name) --force-new-deployment
```

### 6. Domínio + HTTPS

Aponte seu domínio para o `alb_dns_name` (output), crie um certificado no ACM,
e defina `certificate_arn` no tfvars + `terraform apply` para habilitar HTTPS.

### 7. Deploy contínuo

Configure os secrets do GitHub Actions (`AWS_ROLE_ARN` = output
`github_deploy_role_arn`, `ECR_REPOSITORY`, `ECS_CLUSTER`, `ECS_SERVICE`,
`AWS_REGION`) — o workflow `.github/workflows/deploy.yml` publica a cada tag.

## Custo

Defaults conscientes (t4g.micro, single-AZ, 1 NAT). Para produção séria,
suba `db_multi_az = true`, `api_desired_count >= 2` e um node type maior de
Redis — isso aumenta o custo. Os créditos do AWS Free Tier cobrem a validação
inicial.

## Destruir

```bash
terraform destroy
```

(O RDS tem `deletion_protection = true` e snapshot final — ajuste se for mesmo
descartar.)
