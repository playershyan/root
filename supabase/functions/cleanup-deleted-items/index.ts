import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Check for authorization (can be a secret key or cron job token)
    const authHeader = req.headers.get('Authorization')
    const expectedToken = Deno.env.get('CLEANUP_CRON_SECRET')
    // Require the secret; do not allow public invocation
    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Call the permanent deletion function
    const { data, error } = await supabase.rpc('permanently_delete_old_records')
    
    if (error) {
      console.error('Error during cleanup:', error)
      return new Response(
        JSON.stringify({ 
          error: 'Cleanup failed', 
          details: error.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Log the results
    const result = data?.[0] || { deleted_listings: 0, deleted_wanted_requests: 0 }
    console.log(`Cleanup completed: ${result.deleted_listings} listings and ${result.deleted_wanted_requests} wanted requests deleted`)

    // Send notification if items were deleted (optional)
    if (result.deleted_listings > 0 || result.deleted_wanted_requests > 0) {
      // You can add notification logic here (email, webhook, etc.)
      console.log('Sending cleanup notification...')
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Cleanup completed successfully',
        deleted: {
          listings: result.deleted_listings,
          wanted_requests: result.deleted_wanted_requests
        },
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
