# DB Migrations

## How to apply

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Paste and run each `.sql` file in order

## add_addons.sql

Adds addon/extra services support:

- Adds `is_addon` and `addon_per_nail` boolean columns to `services`
- Adds `extras` JSONB column to `appointments`
- Seeds the 5 addon services (uña rota, decoración por uña, full deco, extracción otro estudio, extracción DB)

This migration is safe to run multiple times — it uses `IF NOT EXISTS` and `ON CONFLICT DO NOTHING`.
