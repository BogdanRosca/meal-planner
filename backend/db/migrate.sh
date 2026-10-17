#!/usr/bin/env bash
# Apply pending SQL migrations from db/migrations in filename order, each exactly once.
# Applied files are recorded in schema_migrations; each file runs in its own transaction
# together with its bookkeeping row, so a failure leaves nothing half-applied.
#
# Connection: DATABASE_URL if set, otherwise the standard PG* env vars (PGHOST, PGUSER, ...).
#   DATABASE_URL=postgresql://user:pass@host:5432/db backend/db/migrate.sh
#   PGUSER=bogdan.rosca PGDATABASE=mealplanner backend/db/migrate.sh
set -euo pipefail

MIGRATIONS_DIR="$(cd "$(dirname "$0")/migrations" && pwd)"
PSQL=(psql -X -q -v ON_ERROR_STOP=1)
if [ -n "${DATABASE_URL:-}" ]; then
  PSQL+=("$DATABASE_URL")
fi

"${PSQL[@]}" -c "CREATE TABLE IF NOT EXISTS schema_migrations (
  filename TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);"

applied_count=0
for file in "$MIGRATIONS_DIR"/*.sql; do
  name="$(basename "$file")"
  # Names are interpolated into SQL below, so only allow plain file names
  if [[ ! "$name" =~ ^[A-Za-z0-9_.-]+$ ]]; then
    echo "Refusing migration with unexpected file name: $name" >&2
    exit 1
  fi

  if [ -n "$("${PSQL[@]}" -tA -c "SELECT 1 FROM schema_migrations WHERE filename = '$name';")" ]; then
    echo "Already applied: $name"
    continue
  fi

  echo "Applying: $name"
  "${PSQL[@]}" --single-transaction \
    -f "$file" \
    -c "INSERT INTO schema_migrations (filename) VALUES ('$name');"
  applied_count=$((applied_count + 1))
done

echo "Done. $applied_count migration(s) applied."
