# Keycloak para o Render, com o realm 'ats' embutido (importado no boot).
# Escuta na porta que o Render injeta via $PORT. Deriva o issuer dos headers
# de proxy (X-Forwarded), então o issuer fica sendo a URL pública do serviço.
FROM quay.io/keycloak/keycloak:25.0

COPY docker/keycloak-realm.json /opt/keycloak/data/import/ats-realm.json

ENTRYPOINT ["/bin/sh", "-c", "exec /opt/keycloak/bin/kc.sh start-dev --import-realm --http-port ${PORT:-8080}"]
