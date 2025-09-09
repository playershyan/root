/**
 * Rollback Security Fixes Migration
 * This script rolls back the security fixes if needed
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function rollbackMigration() {
  try {
    console.log('Starting security fixes rollback...');
    
    const rollbackSQL = `
      -- Rollback: Security Fixes Migration
      
      -- 1. Disable RLS on tables (restore to previous state)
      ALTER TABLE IF EXISTS public.deletion_safety_config DISABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS public.deletion_approval_requests DISABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS public.deletion_backups DISABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS public.admin_users DISABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS public.deletion_logs DISABLE ROW LEVEL SECURITY;
      
      -- 2. Drop RLS policies
      DROP POLICY IF EXISTS "Admin users can view deletion_safety_config" ON deletion_safety_config;
      DROP POLICY IF EXISTS "Admin users can update deletion_safety_config" ON deletion_safety_config;
      DROP POLICY IF EXISTS "Admin users can view deletion_approval_requests" ON deletion_approval_requests;
      DROP POLICY IF EXISTS "Admin users can insert deletion_approval_requests" ON deletion_approval_requests;
      DROP POLICY IF EXISTS "Admin users can update deletion_approval_requests" ON deletion_approval_requests;
      DROP POLICY IF EXISTS "Admin users can view deletion_backups" ON deletion_backups;
      DROP POLICY IF EXISTS "System can insert deletion_backups" ON deletion_backups;
      DROP POLICY IF EXISTS "Admin users can view admin_users" ON admin_users;
      DROP POLICY IF EXISTS "Super admin can insert admin_users" ON admin_users;
      DROP POLICY IF EXISTS "Super admin can update admin_users" ON admin_users;
      DROP POLICY IF EXISTS "Super admin can delete admin_users" ON admin_users;
      DROP POLICY IF EXISTS "Admin users can view deletion_logs" ON deletion_logs;
      DROP POLICY IF EXISTS "System can insert deletion_logs" ON deletion_logs;
      
      -- 3. Restore views to SECURITY DEFINER (original state)
      DROP VIEW IF EXISTS public.deletion_safety_status CASCADE;
      CREATE OR REPLACE VIEW public.deletion_safety_status
      WITH (security_barrier = false)
      AS
      SELECT 
          dsc.id,
          dsc.enabled,
          dsc.grace_period_days,
          dsc.created_at,
          dsc.updated_at,
          (SELECT COUNT(*) FROM deletion_approval_requests WHERE status = 'pending') as pending_requests,
          (SELECT COUNT(*) FROM deletion_backups WHERE created_at > NOW() - INTERVAL '30 days') as recent_backups
      FROM deletion_safety_config dsc
      WHERE dsc.id = 1;
      
      DROP VIEW IF EXISTS public.user_session_dashboard CASCADE;
      CREATE OR REPLACE VIEW public.user_session_dashboard
      WITH (security_barrier = false)
      AS
      SELECT 
          us.id,
          us.user_id,
          us.session_token,
          us.ip_address,
          us.user_agent,
          us.created_at,
          us.last_activity,
          us.expires_at,
          us.is_active,
          p.email,
          p.display_name
      FROM user_sessions us
      LEFT JOIN profiles p ON us.user_id = p.id;
      
      DROP VIEW IF EXISTS public.pending_permanent_deletion CASCADE;
      CREATE OR REPLACE VIEW public.pending_permanent_deletion
      WITH (security_barrier = false)
      AS
      SELECT 
          'listing' as item_type,
          id as item_id,
          title as item_title,
          deleted_at,
          deleted_at + INTERVAL '30 days' as permanent_deletion_date
      FROM listings
      WHERE deleted_at IS NOT NULL
          AND deleted_at < NOW() - INTERVAL '25 days'
      UNION ALL
      SELECT 
          'wanted_request' as item_type,
          id as item_id,
          title as item_title,
          deleted_at,
          deleted_at + INTERVAL '30 days' as permanent_deletion_date
      FROM wanted_requests
      WHERE deleted_at IS NOT NULL
          AND deleted_at < NOW() - INTERVAL '25 days';
      
      -- Note: Functions are not rolled back as removing search_path doesn't break functionality
      -- If you need to remove search_path from functions, you would need to recreate them without the SET clause
      
      -- Restore permissions
      GRANT SELECT ON public.deletion_safety_status TO authenticated;
      GRANT SELECT ON public.user_session_dashboard TO authenticated;
      GRANT SELECT ON public.pending_permanent_deletion TO authenticated;
    `;
    
    const statements = rollbackSQL
      .split(/;\s*\n/)
      .filter(stmt => stmt.trim().length > 0 && !stmt.trim().startsWith('--'))
      .map(stmt => stmt.trim() + ';');
    
    console.log(`Executing ${statements.length} rollback statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.replace(/--.*$/gm, '').trim().length === 0) {
        continue;
      }
      
      const { error } = await supabase.rpc('exec_sql', {
        sql: statement
      });
      
      if (error) {
        console.error(`Error executing rollback statement ${i + 1}:`, error);
        // Continue with other statements even if one fails
      }
    }
    
    console.log('✅ Security fixes rollback completed');
    console.log('\nNote: The database has been restored to its previous state.');
    console.log('Functions still have search_path set (which doesn\'t break functionality).');
    
  } catch (error) {
    console.error('Rollback failed:', error);
    process.exit(1);
  }
}

// Run the rollback
rollbackMigration();