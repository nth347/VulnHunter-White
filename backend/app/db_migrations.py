"""Database migration utilities for auto-applying schema changes."""

import logging
from pathlib import Path

logger = logging.getLogger(__name__)


def run_migrations() -> None:
    """Run Alembic migrations to upgrade database schema."""
    try:
        from alembic.config import Config
        from alembic import command

        alembic_dir = Path(__file__).parent.parent / "alembic"
        alembic_ini = alembic_dir.parent / "alembic.ini"

        if not alembic_ini.exists():
            logger.debug("No alembic.ini found, skipping migrations")
            return

        config = Config(str(alembic_ini))
        command.upgrade(config, "head")
        logger.info("Database migrations completed successfully")

    except Exception as e:
        logger.error(f"Database migration failed: {e}", exc_info=True)
        raise
