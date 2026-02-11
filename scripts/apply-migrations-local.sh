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
run_sql < db/migrations/001_schema.sql
run_sql < db/migrations/002_fix_search_path.sql
run_sql < db/migrations/003_entities.sql
run_sql < db/migrations/004_auth_encrypted_password.sql
run_sql < db/migrations/005_settings.sql
run_sql < db/migrations/006_user_security.sql
run_sql < db/migrations/007_audit_logs.sql
run_sql < db/migrations/008_listing_indexes.sql
run_sql < db/migrations/009_medical_records.sql
run_sql < db/migrations/010_reminder_jobs.sql
run_sql < db/migrations/011_cashbook_payments.sql
run_sql < scripts/local/02_disable_rls_local.sql
run_sql < db/seed.sql

echo "Migrations e seed aplicados."
