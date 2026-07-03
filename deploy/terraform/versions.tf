terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.50"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # Backend remoto recomendado para produção (state compartilhado + lock).
  # Descomente e ajuste após criar o bucket/tabela:
  # backend "s3" {
  #   bucket         = "ats-ascenda-tfstate"
  #   key            = "prod/terraform.tfstate"
  #   region         = "sa-east-1"
  #   dynamodb_table = "ats-ascenda-tflock"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "ats-ascenda"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}
