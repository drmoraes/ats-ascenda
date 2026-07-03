.PHONY: up down logs smoke test rebuild

# Sobe todo o stack (Postgres, Redis, MinIO, Keycloak, API) em background.
up:
	docker compose up -d --build
	@echo "Stack subindo. Acompanhe com 'make logs'. Depois rode 'make smoke'."

# Encerra e remove os containers.
down:
	docker compose down

# Logs da API em tempo real.
logs:
	docker compose logs -f api

# Exercita o fluxo ponta a ponta (precisa do stack no ar + curl e jq).
smoke:
	bash scripts/smoke-test.sh

# Testes unitários (não precisam de infra).
test:
	npm test

# Recria do zero (apaga volumes/dados).
rebuild:
	docker compose down -v
	docker compose up -d --build
