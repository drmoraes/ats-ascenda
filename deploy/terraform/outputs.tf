output "alb_dns_name" {
  description = "DNS público do load balancer (aponte seu domínio para cá)."
  value       = aws_lb.main.dns_name
}

output "ecr_repository_url" {
  description = "URL do repositório ECR (use para tag/push da imagem)."
  value       = aws_ecr_repository.api.repository_url
}

output "rds_endpoint" {
  description = "Endpoint do Postgres (privado)."
  value       = aws_db_instance.postgres.address
}

output "redis_endpoint" {
  description = "Endpoint primário do Redis (privado)."
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
}

output "s3_resumes_bucket" {
  description = "Nome do bucket de currículos."
  value       = aws_s3_bucket.resumes.bucket
}

output "app_secret_arn" {
  description = "ARN do secret com as variáveis sensíveis da aplicação."
  value       = aws_secretsmanager_secret.app.arn
}

output "ecs_cluster_name" {
  description = "Nome do cluster ECS (para o pipeline de deploy)."
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "Nome do serviço ECS (para o pipeline de deploy)."
  value       = aws_ecs_service.api.name
}

output "github_deploy_role_arn" {
  description = "ARN do role assumível pelo GitHub Actions (OIDC), se configurado."
  value       = var.github_repository == "" ? null : aws_iam_role.github_deploy[0].arn
}
