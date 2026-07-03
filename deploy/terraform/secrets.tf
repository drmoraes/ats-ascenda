# Segredo do candidato (JWT) gerado automaticamente.
resource "random_password" "candidate_jwt" {
  length  = 48
  special = false
}

locals {
  database_url = "postgresql://${var.db_username}:${random_password.db.result}@${aws_db_instance.postgres.address}:5432/${var.db_name}?schema=public&sslmode=require"
  redis_url    = "redis://${aws_elasticache_replication_group.redis.primary_endpoint_address}:6379"
}

# Um único secret JSON com as variáveis sensíveis da aplicação. A task ECS
# injeta cada chave como variável de ambiente (ver ecs.tf).
resource "aws_secretsmanager_secret" "app" {
  name       = "${local.name}/app-env"
  kms_key_id = aws_kms_key.main.arn
  tags       = { Name = "${local.name}-app-env" }
}

resource "aws_secretsmanager_secret_version" "app" {
  secret_id = aws_secretsmanager_secret.app.id
  secret_string = jsonencode({
    DATABASE_URL         = local.database_url
    REDIS_URL            = local.redis_url
    CANDIDATE_JWT_SECRET = random_password.candidate_jwt.result
    # Preencha os demais segredos externos após provisionar (ou via console):
    AI_PARSER_API_KEY  = "REPLACE_ME"
    EMAIL_API_KEY      = ""
    WHATSAPP_API_TOKEN = ""
  })

  lifecycle {
    # Evita sobrescrever segredos editados manualmente no console.
    ignore_changes = [secret_string]
  }
}
