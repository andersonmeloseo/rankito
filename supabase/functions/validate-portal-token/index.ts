import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { token } = await req.json()
    
    console.log('[Validate Portal Token] 🔍 Validando token:', token?.substring(0, 10) + '...')
    
    if (!token) {
      throw new Error('Token não fornecido')
    }

    // Usa service_role_key para bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    console.log('[Validate Portal Token] 📡 Buscando dados no banco...')

    const { data: portalData, error: portalError } = await supabaseAdmin
      .from('client_portal_analytics')
      .select(`
        *,
        rank_rent_clients (
          id,
          name,
          company,
          niche,
          email,
          phone
        )
      `)
      .eq('portal_token', token)
      .eq('enabled', true)
      .single()

    console.log('[Validate Portal Token] 📦 Resultado da query:', {
      hasData: !!portalData,
      hasError: !!portalError,
      errorCode: portalError?.code,
      errorMessage: portalError?.message,
      clientId: portalData?.client_id,
      clientName: portalData?.rank_rent_clients?.name
    })

    if (portalError) {
      console.error('[Validate Portal Token] ❌ Erro ao buscar portal:', portalError)
      throw new Error('Token inválido ou portal desativado')
    }

    if (!portalData) {
      console.warn('[Validate Portal Token] ⚠️ Portal não encontrado para token')
      throw new Error('Portal não encontrado')
    }

    console.log('[Validate Portal Token] ✅ Token válido! Cliente:', portalData.rank_rent_clients?.name)
    console.log('[Validate Portal Token] 🔍 CLIENT_ID RETORNADO:', portalData.client_id)

    return new Response(
      JSON.stringify({
        portalData,
        clientData: portalData.rank_rent_clients,
        clientId: portalData.client_id,
        isValid: true,
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0'
        } 
      }
    )
  } catch (error) {
    console.error('[Validate Portal Token] 💥 Erro na validação:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
