#!/bin/bash
# Prestart script for Railway/Render
echo "Running database migrations..."
alembic upgrade head
echo "Migrations complete."
