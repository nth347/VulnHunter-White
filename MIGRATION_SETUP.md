# Database Migration Setup

This guide explains the automatic database migration system implemented using Alembic.

## What Was Added

### 1. Alembic Configuration
- `backend/alembic/` -- Alembic migration directory
- `backend/alembic.ini` -- Alembic configuration
- `backend/alembic/env.py` -- Migration environment setup
- `backend/alembic/versions/` -- Migration files

### 2. Migration Runner
- `backend/app/db_migrations.py` -- Utility to run migrations automatically
- Updated `backend/app/main.py` -- Calls migrations on startup
- `backend/requirements.txt` -- Added `alembic>=1.13.0`

## How It Works

### On Application Startup
1. App calls `run_migrations()` before `init_db()`
2. Alembic scans `alembic/versions/` for pending migrations
3. Applies all unapplied migrations in order
4. Database schema is updated without data loss
5. App continues normally

### Example: Adding a New Column
When you add a new field to a model:

```python
# In backend/app/models.py
class Project(Base):
    new_field: Mapped[str] = mapped_column(String(128), nullable=True)
```

Then generate and apply migration:

```bash
cd backend

# 1. Generate migration from model changes
.venv/bin/alembic revision --autogenerate -m "Add new_field to projects"

# 2. Review the generated migration (auto-generated, but check it!)
# backend/alembic/versions/xxxxx_add_new_field_to_projects.py

# 3. Apply migration (automatic on next app startup, or manual:)
.venv/bin/alembic upgrade head
```

## Deployment Workflow

### Dev/Production with auto-migration (Recommended)
```bash
# Just deploy new code and restart
cd ~/Tools/VulnHunter-White
sh stop.sh
git pull origin feature/i18n-english-gui
sh start.sh
# Migrations run automatically on startup ✅
```

### Manual Migration (if needed)
```bash
cd ~/Tools/VulnHunter-White/backend
.venv/bin/alembic upgrade head
```

### Check Migration Status
```bash
cd ~/Tools/VulnHunter-White/backend
.venv/bin/alembic current         # Current database revision
.venv/bin/alembic history         # Migration history
```

## Example: Current i18n Migration

The first migration adds the `language` column to `projects` table:

```
Revision ID: ee5f44de351c
- Adds `language` column with default value 'zh'
- Existing projects preserve all data
- Only new column is added
```

## Benefits

✅ **Zero-downtime upgrades** -- No manual SQL needed
✅ **Data preservation** -- All existing data stays intact
✅ **Version control** -- Migrations tracked in git
✅ **Easy rollback** -- Can downgrade if needed
✅ **Auto-apply** -- Runs on startup, no manual steps

## Troubleshooting

### Migration fails on startup
```bash
# Check logs
tail -50 ~/Tools/VulnHunter-White/data/logs/backend.log

# Run migration manually to see detailed error
cd ~/Tools/VulnHunter-White/backend
.venv/bin/alembic upgrade head
```

### Need to rollback
```bash
cd backend
.venv/bin/alembic downgrade -1  # Downgrade one revision
.venv/bin/alembic downgrade ee5f44de351c  # Downgrade to specific revision
```

## For Future Schema Changes

When adding new columns/tables:

1. Update model in `backend/app/models.py`
2. Run: `.venv/bin/alembic revision --autogenerate -m "descriptive message"`
3. Review generated migration file
4. Commit to git
5. On deployment, migrations run automatically on startup
