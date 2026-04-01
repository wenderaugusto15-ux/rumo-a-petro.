import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const { data, error } = await supabase.from('profiles').select('id').limit(1)

  return new Response(
    JSON.stringify({ 
      success: !error, 
      timestamp: new Date().toISOString(),
      message: 'Keep-alive executado'
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
