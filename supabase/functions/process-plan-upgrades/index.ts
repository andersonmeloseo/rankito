import { createClient } from 'npm:@supabase/supabase-js@2';
import { createErrorResponse } from '../_shared/error-responses.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🤖 Iniciando processamento de upgrades de planos');

    // Buscar regras ativas de upgrade
    const { data: rules, error: rulesError } = await supabaseClient
      .from('admin_automation_rules')
      .select('*')
      .eq('rule_type', 'plan_upgrade')
      .eq('is_active', true)
      .order('priority', { ascending: false });

    if (rulesError) throw rulesError;
    if (!rules || rules.length === 0) {
      console.log('✅ Nenhuma regra de upgrade ativa');
      return new Response(JSON.stringify({ processed: 0, message: 'No active rules' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Buscar usuários com subscriptions ativas
      const { data: activeUsers, error: usersError } = await supabaseClient
      .from('user_subscriptions')
      .select(`
        id,
        user_id,
        plan_id,
        subscription_plans(slug, max_sites, max_pages_per_site, max_gsc_integrations),
        profiles(email, full_name)
      `)
      .eq('status', 'active');

    if (usersError) throw usersError;
    if (!activeUsers || activeUsers.length === 0) {
      console.log('✅ Nenhum usuário ativo para análise');
      return new Response(JSON.stringify({ processed: 0, message: 'No active users' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let suggestionsCount = 0;
    const results = [];

    for (const user of activeUsers) {
      try {
        // Obter uso atual do usuário
        const { data: sites } = await supabaseClient
          .from('rank_rent_sites')
          .select('id')
          .eq('owner_user_id', user.user_id);

        const { data: pages } = await supabaseClient
          .from('rank_rent_pages')
          .select('id, site_id')
          .in('site_id', sites?.map(s => s.id) || []);

        const { data: gscIntegrations } = await supabaseClient
          .from('google_search_console_integrations')
          .select('id')
          .eq('user_id', user.user_id)
          .eq('is_active', true);

        const plan = user.subscription_plans as any;
        const profile = user.profiles as any;

        const usage = {
          sites: sites?.length || 0,
          pages: pages?.length || 0,
          gsc_integrations: gscIntegrations?.length || 0
        };

        const limits = {
          sites: plan?.max_sites || 999999,
          pages: plan?.max_pages_per_site || 999999,
          gsc_integrations: plan?.max_gsc_integrations || 999999
        };

        // Verificar contra cada regra
        for (const rule of rules) {
          const conditions = rule.conditions || {};
          const actions = rule.actions || {};

          // Calcular percentuais de uso
          const sitesUsagePercent = (usage.sites / limits.sites) * 100;
          const pagesUsagePercent = (usage.pages / limits.pages) * 100;
          const gscUsagePercent = (usage.gsc_integrations / limits.gsc_integrations) * 100;

          const thresholdPercent = conditions.usage_threshold_percent || 80;

          // Verificar se usuário atingiu threshold
          const shouldSuggestUpgrade = 
            sitesUsagePercent >= thresholdPercent ||
            pagesUsagePercent >= thresholdPercent ||
            gscUsagePercent >= thresholdPercent;

          if (!shouldSuggestUpgrade) continue;

          // Verificar se já sugeriu recentemente
          const { data: recentLog } = await supabaseClient
            .from('automation_execution_logs')
            .select('executed_at')
            .eq('rule_id', rule.id)
            .eq('target_user_id', user.user_id)
            .eq('execution_status', 'success')
            .gte('executed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
            .single();

          if (recentLog) {
            console.log(`⏭️ Sugestão já enviada nos últimos 7 dias para ${profile?.email}`);
            continue;
          }

          // Determinar recurso mais próximo do limite
          let limitingResource = 'sites';
          let maxUsagePercent = sitesUsagePercent;
          
          if (pagesUsagePercent > maxUsagePercent) {
            limitingResource = 'páginas';
            maxUsagePercent = pagesUsagePercent;
          }
          if (gscUsagePercent > maxUsagePercent) {
            limitingResource = 'integrações GSC';
            maxUsagePercent = gscUsagePercent;
          }

          // Criar notificação de sugestão
          const message = `Você está usando ${Math.round(maxUsagePercent)}% do seu limite de ${limitingResource}. ${actions.suggest_plan ? `Considere fazer upgrade para o plano ${actions.suggest_plan} para continuar crescendo!` : 'Considere fazer upgrade do seu plano.'}`;

          await supabaseClient.from('user_notifications').insert({
            user_id: user.user_id,
            type: 'plan_upgrade_suggestion',
            title: 'Sugestão de Upgrade de Plano',
            message,
            link: '/settings/subscription',
            metadata: {
              current_plan: plan?.slug,
              suggested_plan: actions.suggest_plan,
              usage: {
                sites: `${usage.sites}/${limits.sites}`,
                pages: `${usage.pages}/${limits.pages}`,
                gsc: `${usage.gsc_integrations}/${limits.gsc_integrations}`
              }
            }
          });

          // Log de execução
          await supabaseClient.from('automation_execution_logs').insert({
            rule_id: rule.id,
            target_user_id: user.user_id,
            execution_status: 'success',
            execution_details: {
              user_email: profile?.email,
              current_plan: plan?.slug,
              suggested_plan: actions.suggest_plan,
              usage_percent: Math.round(maxUsagePercent),
              limiting_resource: limitingResource
            }
          });

          suggestionsCount++;
          results.push({
            user_email: profile?.email,
            rule_name: rule.rule_name,
            usage_percent: Math.round(maxUsagePercent),
            status: 'suggested'
          });

          break; // Uma sugestão por usuário é suficiente
        }

      } catch (error) {
        console.error(`❌ Erro ao processar usuário:`, error);
      }
    }

    console.log(`🎉 Sugestões de upgrade concluídas: ${suggestionsCount} enviadas`);

    return new Response(JSON.stringify({
      success: true,
      suggestions_sent: suggestionsCount,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Erro no processamento de upgrades:', error);
    return createErrorResponse(error, 'Erro ao processar upgrades de planos', 500);
  }
});
