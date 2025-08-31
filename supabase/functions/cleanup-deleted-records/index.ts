import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key for admin access
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Call the cleanup function
    const { data, error } = await supabaseClient.rpc('cleanup_old_deleted_records')

    if (error) {
      throw error
    }

    // Log cleanup activity
    console.log(`Cleanup completed at ${new Date().toISOString()}`)

    // Optionally, get counts of deleted records for logging
    const { count: deletedListingsCount } = await supabaseClient
      .from('deleted_listings')
      .select('*', { count: 'exact', head: true })
      .lt('deleted_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    const { count: deletedWantedCount } = await supabaseClient
      .from('deleted_wanted_requests')
      .select('*', { count: 'exact', head: true })
      .lt('deleted_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Cleanup completed successfully',
        stats: {
          listings_to_delete: deletedListingsCount || 0,
          wanted_requests_to_delete: deletedWantedCount || 0,
          executed_at: new Date().toISOString()
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Cleanup error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

// This function can be triggered:
// 1. Via Supabase Cron Jobs (scheduled)
// 2. Via webhook from external cron service
// 3. Manually via API call
// 
// To schedule via Supabase:
// Go to Supabase Dashboard > Edge Functions > cleanup-deleted-records > Schedule
// Set to run daily at your preferred time