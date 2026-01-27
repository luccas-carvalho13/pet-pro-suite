#!/usr/bin/env bash
# Aplica as migrations no Postgres local (Docker).
# Uso: ./scripts/apply-migrations-local.sh   ou   npm run db:migrate:local
# Requer: container petpro-postgres rodando (docker compose up -d).

set -e
cd "$(dirname "$0")/.."

CONTAINER="${PG_CONTAINER:-petpro-postgres}"
USER="${PGUSER:-petpro}"
DB="${PGDATABASE:-petpro_dev}"

echo "Aplicando migrations em $USER@$DB (container $CONTAINER) ..."

run_sql() {
  docker exec -i "$CONTAINER" psql -U "$USER" -d "$DB" "$@"
}

run_sql < scripts/local/01_auth_stub.sql
run_sql < supabase/migrations/20251118165030_76db8e99-fb51-4f20-8e9d-64c306df6d98.sql
run_sql < supabase/migrations/20251118165110_821a1243-9d02-465e-826b-dcf69344ec42.sql
run_sql < scripts/local/02_disable_rls_local.sql

echo "Migrations aplicadas."
