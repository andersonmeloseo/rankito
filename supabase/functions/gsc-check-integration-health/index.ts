import { createClient } from 'npm:@supabase/supabase-js@2';
import { getIntegrationWithValidToken, markIntegrationHealthy } from '../_shared/gsc-helpers.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Invalid authentication token');
    }

    const { integration_id } = await req.json();

    if (!integration_id) {
      return new Response(
        JSON.stringify({ error: 'integration_id é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔍 Verificando saúde da integração:', integration_id);

    // Buscar integração
    const { data: integration, error: fetchError } = await supabase
      .from('google_search_console_integrations')
      .select('*')
      .eq('id', integration_id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !integration) {
      return new Response(
        JSON.stringify({ error: 'Integração não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Se está healthy, retornar status atual
    if (integration.health_status === 'healthy') {
      console.log('✅ Integração já está saudável');
      return new Response(
        JSON.stringify({
          success: true,
          health_status: 'healthy',
          message: 'Integração já está operacional',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se cooldown ainda está ativo
    if (integration.health_check_at) {
      const cooldownEnd = new Date(integration.health_check_at);
      const now = new Date();
      
      if (cooldownEnd > now) {
        const minutesRemaining = Math.ceil((cooldownEnd.getTime() - now.getTime()) / 60000);
        console.log(`⏳ Cooldown ainda ativo: ${minutesRemaining} minutos restantes`);
        
        return new Response(
          JSON.stringify({
            success: false,
            health_status: 'unhealthy',
            message: `Aguarde ${minutesRemaining} minuto(s) antes de verificar novamente`,
            cooldown_end: cooldownEnd.toISOString(),
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Tentar obter token de acesso (isso valida a conexão com a API do Google)
    console.log('🔄 Testando conectividade com API do Google...');
    try {
      await getIntegrationWithValidToken(integration_id);
      
      // Se conseguiu obter token, marcar como healthy
      await markIntegrationHealthy(integration_id);
      
      console.log('✅ Integração recuperada com sucesso');
      
      return new Response(
        JSON.stringify({
          success: true,
          health_status: 'healthy',
          message: 'Integração verificada e recuperada com sucesso',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
      
    } catch (apiError: any) {
      console.error('❌ Erro ao verificar API:', apiError);
      
      // Se falhou, manter como unhealthy
      return new Response(
        JSON.stringify({
          success: false,
          health_status: 'unhealthy',
          message: 'Integração ainda indisponível. Verifique as credenciais.',
          error: apiError?.message || 'Erro desconhecido',
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: any) {
    console.error('❌ Erro ao verificar saúde da integração:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
