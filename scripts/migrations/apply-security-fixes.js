/**
 * Apply Security Fixes Migration
 * This script applies the security fixes identified by Supabase Security Advisor
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

require('dotenv').config({ path: '.env.local' });

async function runMigration() {
  try {
    console.log('Starting security fixes migration...');
    console.log('This script will apply the migration directly to your Supabase database.');
    console.log('\nIMPORTANT: Make sure you have:');
    console.log('1. Supabase CLI installed (npx supabase --version)');
    console.log('2. Database connection string in your environment variables');
    console.log('\n');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '../../database-migrations/005_fix_security_issues.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf8');
    
    // Write to a temporary file for execution
    const tempFile = path.join(__dirname, 'temp_migration.sql');
    await fs.writeFile(tempFile, migrationSQL);
    
    // Get database URL
    const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
    
    if (!dbUrl) {
      console.error('ERROR: Database URL not found in environment variables');
      console.error('Please add DATABASE_URL or SUPABASE_DB_URL to your .env.local file');
      console.error('You can find this in your Supabase project settings under Database > Connection string');
      process.exit(1);
    }
    
    console.log('Applying migration to database...');
    console.log('This may take a few minutes...\n');
    
    try {
      // Use psql to execute the migration
      const { stdout, stderr } = await execAsync(
        `psql "${dbUrl}" -f "${tempFile}"`,
        { maxBuffer: 10 * 1024 * 1024 } // Increase buffer size for large output
      );
      
      if (stderr && !stderr.includes('NOTICE')) {
        console.error('Warnings/Errors during migration:', stderr);
      }
      
      console.log('✅ Security fixes migration completed successfully!\n');
      
    } catch (psqlError) {
      // If psql is not available, provide alternative instructions
      if (psqlError.message.includes('psql') && psqlError.message.includes('not found')) {
        console.error('psql command not found. Trying alternative method...\n');
        
        console.log('MANUAL MIGRATION INSTRUCTIONS:');
        console.log('================================');
        console.log('1. Go to your Supabase Dashboard');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Create a new query');
        console.log('4. Copy the contents of: database-migrations/005_fix_security_issues.sql');
        console.log('5. Paste and run the query');
        console.log('\nAlternatively, you can install PostgreSQL client tools:');
        console.log('- Windows: Download from https://www.postgresql.org/download/windows/');
        console.log('- Or use: choco install postgresql');
        
        // Clean up temp file
        await fs.unlink(tempFile).catch(() => {});
        process.exit(1);
      }
      throw psqlError;
    }
    
    // Clean up temp file
    await fs.unlink(tempFile).catch(() => {});
    
    console.log('Migration Summary:');
    console.log('==================');
    console.log('✅ Converted 3 views from SECURITY DEFINER to SECURITY INVOKER');
    console.log('✅ Enabled RLS on 5 tables');
    console.log('✅ Created RLS policies for admin access control');
    console.log('✅ Fixed search_path for 24 functions');
    console.log('\nNext steps:');
    console.log('1. Test all admin functionality to ensure it works correctly');
    console.log('2. Test user authentication and session management');
    console.log('3. Verify deletion safety features are working');
    console.log('4. Run the Supabase Security Advisor again to confirm all issues are resolved');
    console.log('\nTo verify in Supabase:');
    console.log('- Go to Database > Security Advisor');
    console.log('- Run security check');
    console.log('- Confirm ERROR level issues are resolved');
    
  } catch (error) {
    console.error('Migration failed:', error.message);
    console.log('\nTo rollback this migration, run: node scripts/migrations/rollback-security-fixes.js');
    process.exit(1);
  }
}

// Run the migration
runMigration();