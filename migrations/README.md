# Database Migrations

This directory contains SQL migrations for the Supabase database.

## How to Apply Migrations

### Option 1: Using the Supabase Dashboard

1. Log in to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of the migration file (e.g., `01_add_summary_column.sql`)
4. Paste into the SQL Editor and run the query

### Option 2: Using the Migration Script

If you have the service role key, you can use the migration script:

1. Ensure you have set the following environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key 

2. Run the migration script:
   ```
   npx ts-node migrations/apply-migration.ts
   ```

## Migration Files

- `01_add_summary_column.sql`: Adds the `summary` column to the `notes` table for storing AI-generated summaries.

## After Migration

After applying the migrations, your application should work as expected with the new schema changes. 