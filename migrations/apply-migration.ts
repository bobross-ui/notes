// Migration Script
// This script will apply the SQL migrations to the Supabase database

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read environment variables or set defaults for local development
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables for Supabase connection.');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  try {
    // Read the SQL file
    const migrationFile = path.join(__dirname, '01_add_summary_column.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');
    
    console.log('Applying migration: 01_add_summary_column.sql');
    
    // Execute the SQL directly
    const { error } = await supabase.from('notes')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Error connecting to Supabase:', error);
      process.exit(1);
    }

    // Since we don't have direct SQL execution via the JS client,
    // we need to log instructions for manual execution
    console.log('\n=== MANUAL EXECUTION REQUIRED ===');
    console.log('Please run the following SQL in your Supabase SQL Editor:');
    console.log('\n' + sql + '\n');
    console.log('After running the SQL, your application should work correctly.');
    
  } catch (error) {
    console.error('Error preparing migration:', error);
  }
}

// Run the migration
applyMigration(); 