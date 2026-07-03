#!/usr/bin/env bash
#
# deploy-fix-and-push.sh
# ----------------------
# Conserta o repositório git corrompido (branch `main` aponta para um commit
# inexistente) e publica o projeto no GitHub, deixando-o pronto para o Render.
#
# RODE ESTE SCRIPT NO SEU TERMINAL (macOS), na raiz do projeto — não no Cowork.
# Lá você tem permissão total de escrita/exclusão; o ambiente do Cowork não.
#
# Uso:
#   cd "/Users/danielmoraes/Documents/Claude/Projects/ATS  ASCENDA"
#   bash scripts/deploy-fix-and-push.sh
#
# O script é conservador: ele NÃO apaga o .git antigo, apenas o renomeia para
# .git.corrupted-backup (preserva os objetos soltos para eventual perícia).
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"
echo "==> Projeto: $PROJECT_DIR"

# 1) Sanidade: confirma que estamos no projeto certo.
if [ ! -f "package.json" ] || ! grep -q "ats-ascenda-backend" package.json; then
  echo "ERRO: não parece ser a raiz do projeto ATS ASCENDA. Abortando." >&2
  exit 1
fi

# 2) Backup do .git corrompido (não destrutivo).
if [ -d ".git" ]; then
  BACKUP=".git.corrupted-backup-$(date +%Y%m%d%H%M%S)"
  echo "==> Movendo .git corrompido para $BACKUP"
  mv .git "$BACKUP"
fi

# 3) Repositório limpo.
echo "==> Inicializando repositório git limpo"
git init -q
git branch -M main

# 4) Guard: garante que segredos não vão para o commit.
if [ ! -f ".gitignore" ]; then
  echo "ERRO: .gitignore ausente — abortando para não commitar segredos." >&2
  exit 1
fi
# Falha se algum .env real (fora o .example) estiver rastreável.
if git ls-files --others --exclude-standard | grep -E '(^|/)\.env($|\.)' | grep -v '\.env\.example' >/dev/null 2>&1; then
  echo "ATENÇÃO: há arquivos .env não ignorados. Verifique o .gitignore antes de prosseguir." >&2
  exit 1
fi

echo "==> Adicionando arquivos e criando commit inicial"
git add -A
git commit -q -m "chore: baseline ATS ASCENDA (backend, Sprint 2) — história reinicializada"
echo "==> Commit criado:"
git log --oneline -1

# 5) Push para o GitHub.
echo ""
echo "==> Publicando no GitHub"
if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
  # Caminho automático: GitHub CLI autenticado.
  REPO_NAME="ats-ascenda"
  echo "    GitHub CLI detectado. Criando repositório privado '$REPO_NAME' e dando push..."
  gh repo create "$REPO_NAME" --private --source=. --remote=origin --push
  echo "==> Pronto. Repositório publicado via gh."
else
  cat <<'MANUAL'
    GitHub CLI (gh) não está instalado/autenticado. Faça o push manualmente:

      1. Crie um repositório VAZIO em https://github.com/new
         (sem README, sem .gitignore, sem licença) — ex.: ats-ascenda

      2. Conecte e dê push (troque SEU_USUARIO):

         git remote add origin https://github.com/SEU_USUARIO/ats-ascenda.git
         git push -u origin main

    Depois disso, siga o runbook: DEPLOY-AGORA.md
MANUAL
fi

echo ""
echo "==> Concluído. Próximo passo: DEPLOY-AGORA.md (deploy no Render)."
