variable "aws_region" {
  description = "Região AWS (São Paulo por padrão — residência de dados no Brasil, LGPD)."
  type        = string
  default     = "sa-east-1"
}

variable "environment" {
  description = "Nome do ambiente (prod, staging)."
  type        = string
  default     = "prod"
}

variable "project_name" {
  description = "Prefixo dos recursos."
  type        = string
  default     = "ats-ascenda"
}

variable "vpc_cidr" {
  description = "CIDR da VPC."
  type        = string
  default     = "10.20.0.0/16"
}

variable "azs" {
  description = "Zonas de disponibilidade (2 para alta disponibilidade)."
  type        = list(string)
  default     = ["sa-east-1a", "sa-east-1c"]
}

# --- Banco de dados ---
variable "db_instance_class" {
  description = "Classe da instância RDS. db.t4g.micro para começar barato."
  type        = string
  default     = "db.t4g.micro"
}

variable "db_allocated_storage" {
  description = "Armazenamento inicial do RDS (GB)."
  type        = number
  default     = 20
}

variable "db_multi_az" {
  description = "Multi-AZ (recomendado em produção; dobra o custo do RDS)."
  type        = bool
  default     = false
}

variable "db_name" {
  description = "Nome do banco."
  type        = string
  default     = "ats"
}

variable "db_username" {
  description = "Usuário administrador do RDS."
  type        = string
  default     = "ats_admin"
}

# --- Redis ---
variable "redis_node_type" {
  description = "Tipo do nó ElastiCache."
  type        = string
  default     = "cache.t4g.micro"
}

# --- API / ECS ---
variable "api_image" {
  description = "Imagem da API no ECR (ex.: <acct>.dkr.ecr.<region>.amazonaws.com/ats-ascenda-api:latest). Preenchida após o primeiro push."
  type        = string
  default     = ""
}

variable "api_cpu" {
  description = "CPU da task Fargate (256 = 0.25 vCPU)."
  type        = number
  default     = 512
}

variable "api_memory" {
  description = "Memória da task Fargate (MB)."
  type        = number
  default     = 1024
}

variable "api_desired_count" {
  description = "Número de tasks da API."
  type        = number
  default     = 2
}

variable "github_repository" {
  description = "Repositório GitHub (org/repo) autorizado a assumir o role de deploy via OIDC."
  type        = string
  default     = ""
}

variable "certificate_arn" {
  description = "ARN do certificado ACM para HTTPS no ALB. Vazio => só HTTP (defina antes do go-live real)."
  type        = string
  default     = ""
}

# --- Auth (Keycloak roda como serviço separado; aponte para ele aqui) ---
variable "keycloak_issuer" {
  description = "Issuer OIDC do Keycloak (ex.: https://auth.seudominio.com/realms/ats)."
  type        = string
  default     = ""
}

variable "keycloak_jwks_url" {
  description = "URL JWKS do Keycloak."
  type        = string
  default     = ""
}

variable "keycloak_audience" {
  description = "Audience esperada nos tokens."
  type        = string
  default     = "ats-backend"
}

# --- IA (parsing/embeddings). A chave é secret; base URL e modelo são env. ---
variable "ai_parser_api_base_url" {
  description = "Base URL do provedor de IA."
  type        = string
  default     = "https://api.anthropic.com/v1"
}

variable "ai_parser_model" {
  description = "Modelo de IA."
  type        = string
  default     = "claude-sonnet-5"
}

variable "cors_allowed_origins" {
  description = "Origens permitidas para CORS (lista separada por vírgula)."
  type        = string
  default     = ""
}
