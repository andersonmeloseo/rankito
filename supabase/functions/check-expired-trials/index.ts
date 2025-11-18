import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Buscar assinaturas em trial que expiraram hoje
    const today = new Date().toISOString().split('T')[0];
    
    const { data: expiredTrials, error } = await supabaseClient
      .from('user_subscriptions')
      .select('id, user_id, trial_end_date, profiles!inner(email, full_name)')
      .eq('status', 'trial')
      .lte('trial_end_date', today);

    if (error) throw error;

    console.log(`Encontradas ${expiredTrials?.length || 0} assinaturas trial expiradas`);

    // Atualizar status para 'expired' e bloquear acesso
    for (const subscription of expiredTrials || []) {
      const { error: updateError } = await supabaseClient
        .from('user_subscriptions')
        .update({ status: 'expired', canceled_at: new Date().toISOString() })
        .eq('id', subscription.id);

      if (updateError) {
        console.error(`Erro ao expirar trial ${subscription.id}:`, updateError);
        continue;
      }

      // Criar notificação para o usuário
      await supabaseClient
        .from('user_notifications')
        .insert({
          user_id: subscription.user_id,
          type: 'trial_expired',
          title: 'Trial Expirado',
          message: 'Seu período de trial expirou. Assine um plano para continuar usando a plataforma.',
          link: '/settings/subscription',
        });

      console.log(`Trial expirado para usuário ${subscription.user_id}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        expired: expiredTrials?.length || 0 
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
