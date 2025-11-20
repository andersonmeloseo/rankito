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

    console.log('🤖 Iniciando processamento de automações de trial');

    // Buscar regras ativas de trial
    const { data: rules, error: rulesError } = await supabaseClient
      .from('admin_automation_rules')
      .select('*')
      .eq('rule_type', 'trial_expiration')
      .eq('is_active', true)
      .order('priority', { ascending: false });

    if (rulesError) throw rulesError;
    if (!rules || rules.length === 0) {
      console.log('✅ Nenhuma regra de trial ativa');
      return new Response(JSON.stringify({ processed: 0, message: 'No active rules' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let processedCount = 0;
    const results = [];

    for (const rule of rules) {
      const conditions = rule.conditions || {};
      const actions = rule.actions || {};
      const daysBeforeExpiration = conditions.days_before_expiration || 3;

      // Calcular data de referência
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + daysBeforeExpiration);
      const targetDateStr = targetDate.toISOString().split('T')[0];

      // Buscar trials expirando
      const { data: expiringTrials, error: trialsError } = await supabaseClient
        .from('user_subscriptions')
        .select('id, user_id, trial_end_date, profiles(email, full_name)')
        .eq('status', 'trial')
        .lte('trial_end_date', targetDateStr);

      if (trialsError) throw trialsError;
      if (!expiringTrials || expiringTrials.length === 0) continue;

      console.log(`📋 Regra "${rule.rule_name}": ${expiringTrials.length} trials expirando`);

      for (const subscription of expiringTrials) {
        try {
          const profile = subscription.profiles as any;
          
          const daysRemaining = Math.ceil(
            (new Date(subscription.trial_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );

          // Verificar se já enviou notificação recentemente
          const { data: recentLog } = await supabaseClient
            .from('automation_execution_logs')
            .select('executed_at')
            .eq('rule_id', rule.id)
            .eq('target_user_id', subscription.user_id)
            .eq('execution_status', 'success')
            .gte('executed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .single();

          if (recentLog) {
            console.log(`⏭️ Notificação já enviada nas últimas 24h para ${profile?.email}`);
            continue;
          }

          // Executar ações baseadas no status do trial
          if (daysRemaining > 0) {
            // Trial ainda ativo - enviar notificação de alerta
            if (actions.send_expiration_warning) {
              let message = `Seu período de trial expira em ${daysRemaining} dia(s). `;
              
              if (actions.offer_discount) {
                message += `Assine agora com ${actions.discount_percentage || 20}% de desconto!`;
              } else {
                message += 'Assine um plano para continuar usando a plataforma.';
              }

              await supabaseClient.from('user_notifications').insert({
                user_id: subscription.user_id,
                type: 'trial_expiring',
                title: 'Trial Expirando em Breve',
                message,
                link: '/settings/subscription',
                metadata: {
                  days_remaining: daysRemaining,
                  discount: actions.offer_discount ? actions.discount_percentage : null
                }
              });
            }
          } else {
            // Trial expirado - executar ação de expiração
            if (actions.block_on_expiration) {
              await supabaseClient
                .from('user_subscriptions')
                .update({
                  status: 'expired',
                  canceled_at: new Date().toISOString()
                })
                .eq('id', subscription.id);

              await supabaseClient.from('user_notifications').insert({
                user_id: subscription.user_id,
                type: 'trial_expired',
                title: 'Trial Expirado',
                message: 'Seu período de trial expirou. Assine um plano para continuar usando a plataforma.',
                link: '/settings/subscription'
              });
            } else if (actions.extend_trial_days) {
              const newEndDate = new Date(subscription.trial_end_date);
              newEndDate.setDate(newEndDate.getDate() + actions.extend_trial_days);

              await supabaseClient
                .from('user_subscriptions')
                .update({
                  trial_end_date: newEndDate.toISOString().split('T')[0]
                })
                .eq('id', subscription.id);

              await supabaseClient.from('user_notifications').insert({
                user_id: subscription.user_id,
                type: 'trial_extended',
                title: 'Trial Estendido',
                message: `Seu trial foi estendido por mais ${actions.extend_trial_days} dias!`,
                link: '/dashboard'
              });
            }
          }

          // Log de execução
          await supabaseClient.from('automation_execution_logs').insert({
            rule_id: rule.id,
            target_user_id: subscription.user_id,
            execution_status: 'success',
            execution_details: {
              user_email: profile?.email,
              days_remaining: daysRemaining,
              action: daysRemaining > 0 ? 'warning_sent' : (actions.block_on_expiration ? 'blocked' : 'extended')
            }
          });

          processedCount++;
          results.push({
            user_email: profile?.email,
            rule_name: rule.rule_name,
            days_remaining: daysRemaining,
            status: 'processed'
          });

        } catch (error) {
          console.error(`❌ Erro ao processar trial:`, error);
          
          await supabaseClient.from('automation_execution_logs').insert({
            rule_id: rule.id,
            target_user_id: subscription.user_id,
            execution_status: 'failed',
            error_message: error instanceof Error ? error.message : String(error)
          });
        }
      }
    }

    console.log(`🎉 Automações de trial concluídas: ${processedCount} processados`);

    return new Response(JSON.stringify({
      success: true,
      processed: processedCount,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Erro no processamento de trials:', error);
    return createErrorResponse(error, 'Erro ao processar automações de trial', 500);
  }
});
