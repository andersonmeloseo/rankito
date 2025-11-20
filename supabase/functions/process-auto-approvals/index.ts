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

    console.log('🤖 Iniciando processamento de aprovações automáticas');

    // Buscar regras ativas de auto-aprovação
    const { data: rules, error: rulesError } = await supabaseClient
      .from('admin_automation_rules')
      .select('*')
      .eq('rule_type', 'auto_approval')
      .eq('is_active', true)
      .order('priority', { ascending: false });

    if (rulesError) throw rulesError;
    if (!rules || rules.length === 0) {
      console.log('✅ Nenhuma regra de auto-aprovação ativa');
      return new Response(JSON.stringify({ processed: 0, message: 'No active rules' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Buscar usuários pendentes
    const { data: pendingUsers, error: usersError } = await supabaseClient
      .from('profiles')
      .select('id, email, full_name, selected_plan_slug, website, company')
      .eq('is_active', false)
      .is('approved_at', null)
      .is('rejection_reason', null);

    if (usersError) throw usersError;
    if (!pendingUsers || pendingUsers.length === 0) {
      console.log('✅ Nenhum usuário pendente de aprovação');
      return new Response(JSON.stringify({ processed: 0, message: 'No pending users' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`📋 Encontrados ${pendingUsers.length} usuários pendentes`);

    let approvedCount = 0;
    const results = [];

    // Processar cada usuário contra cada regra
    for (const user of pendingUsers) {
      let wasApproved = false;

      for (const rule of rules) {
        if (wasApproved) break;

        const conditions = rule.conditions || {};
        const actions = rule.actions || {};

        // Verificar condições
        let meetsConditions = true;

        // Verificar domínios de email permitidos
        if (conditions.allowed_email_domains && conditions.allowed_email_domains.length > 0) {
          const emailDomain = user.email.split('@')[1];
          if (!conditions.allowed_email_domains.includes(emailDomain)) {
            meetsConditions = false;
          }
        }

        // Verificar planos específicos
        if (conditions.allowed_plans && conditions.allowed_plans.length > 0) {
          if (!conditions.allowed_plans.includes(user.selected_plan_slug)) {
            meetsConditions = false;
          }
        }

        // Verificar campos obrigatórios
        if (conditions.require_website && !user.website) {
          meetsConditions = false;
        }
        if (conditions.require_company && !user.company) {
          meetsConditions = false;
        }

        if (!meetsConditions) {
          console.log(`❌ Usuário ${user.email} não atende condições da regra ${rule.rule_name}`);
          
          // Log de execução pulada
          await supabaseClient.from('automation_execution_logs').insert({
            rule_id: rule.id,
            target_user_id: user.id,
            execution_status: 'skipped',
            execution_details: { reason: 'Conditions not met', user_email: user.email }
          });
          
          continue;
        }

        // Usuário atende condições - aprovar automaticamente
        console.log(`✅ Aprovando automaticamente usuário ${user.email} via regra ${rule.rule_name}`);

        try {
          // Ativar conta
          const { error: updateError } = await supabaseClient
            .from('profiles')
            .update({
              is_active: true,
              approved_at: new Date().toISOString(),
              approved_by: 'system_automation'
            })
            .eq('id', user.id);

          if (updateError) throw updateError;

          // Criar subscription se configurado nas ações
          if (actions.assign_plan) {
            const { data: plan } = await supabaseClient
              .from('subscription_plans')
              .select('id, trial_days')
              .eq('slug', actions.assign_plan)
              .single();

            if (plan) {
              const trialDays = actions.trial_days || plan.trial_days || 0;
              const startDate = new Date();
              const endDate = new Date();
              endDate.setDate(endDate.getDate() + (trialDays > 0 ? trialDays : 30));
              
              const trialEndDate = trialDays > 0 ? new Date(startDate.getTime() + trialDays * 24 * 60 * 60 * 1000) : null;

              await supabaseClient.from('user_subscriptions').insert({
                user_id: user.id,
                plan_id: plan.id,
                status: trialDays > 0 ? 'trial' : 'active',
                current_period_start: startDate.toISOString().split('T')[0],
                current_period_end: endDate.toISOString().split('T')[0],
                trial_end_date: trialEndDate?.toISOString().split('T')[0]
              });
            }
          }

          // Criar notificação
          await supabaseClient.from('user_notifications').insert({
            user_id: user.id,
            type: 'account_approved',
            title: 'Conta Aprovada Automaticamente',
            message: 'Sua conta foi aprovada automaticamente. Bem-vindo ao Rankito CRM!',
            link: '/dashboard'
          });

          // Enviar email se configurado
          if (actions.send_welcome_email) {
            await supabaseClient.functions.invoke('send-account-status-email', {
              body: {
                userId: user.id,
                status: 'approved',
                planSlug: actions.assign_plan,
                trialDays: actions.trial_days
              }
            });
          }

          // Registrar log de auditoria
          await supabaseClient.from('admin_audit_logs').insert({
            admin_user_id: 'system',
            action: 'user_auto_approved',
            target_user_id: user.id,
            details: {
              rule_id: rule.id,
              rule_name: rule.rule_name,
              user_email: user.email,
              assigned_plan: actions.assign_plan
            }
          });

          // Log de execução bem-sucedida
          await supabaseClient.from('automation_execution_logs').insert({
            rule_id: rule.id,
            target_user_id: user.id,
            execution_status: 'success',
            execution_details: {
              user_email: user.email,
              assigned_plan: actions.assign_plan,
              trial_days: actions.trial_days
            }
          });

          approvedCount++;
          wasApproved = true;

          results.push({
            user_email: user.email,
            rule_name: rule.rule_name,
            status: 'approved'
          });

        } catch (error) {
          console.error(`❌ Erro ao aprovar usuário ${user.email}:`, error);
          
          // Log de erro
          await supabaseClient.from('automation_execution_logs').insert({
            rule_id: rule.id,
            target_user_id: user.id,
            execution_status: 'failed',
            execution_details: { user_email: user.email },
            error_message: error instanceof Error ? error.message : String(error)
          });

          results.push({
            user_email: user.email,
            rule_name: rule.rule_name,
            status: 'failed',
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
    }

    console.log(`🎉 Aprovações automáticas concluídas: ${approvedCount} usuários aprovados`);

    return new Response(JSON.stringify({
      success: true,
      approved: approvedCount,
      total_pending: pendingUsers.length,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Erro no processamento de aprovações:', error);
    return createErrorResponse(error, 'Erro ao processar aprovações automáticas', 500);
  }
});
