import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { site_id, config, config_id } = await req.json();
    
    console.log('⚙️ Salvando config de agendamento:', { site_id, config, config_id });

    // Calcular next_run_at baseado na frequência
    const calculateNextRun = (cfg: any): Date => {
      const now = new Date();
      
      switch(cfg.frequency) {
        case 'hourly':
          const nextHour = new Date(now);
          nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
          return nextHour;
          
        case 'daily': {
          const [hours, minutes] = cfg.specific_time.split(':').map(Number);
          const nextDaily = new Date(now);
          nextDaily.setHours(hours, minutes, 0, 0);
          if (nextDaily <= now) {
            nextDaily.setDate(nextDaily.getDate() + 1);
          }
          return nextDaily;
        }
          
        case 'weekly': {
          const [hours, minutes] = cfg.specific_time.split(':').map(Number);
          const nextWeekly = new Date(now);
          nextWeekly.setHours(hours, minutes, 0, 0);
          
          // Encontrar próximo dia da semana especificado
          const currentDay = now.getDay();
          const targetDays = cfg.specific_days || [];
          const sortedDays = targetDays.sort((a: number, b: number) => a - b);
          
          let nextDay = sortedDays.find((d: number) => d > currentDay) || sortedDays[0];
          let daysToAdd = nextDay >= currentDay ? nextDay - currentDay : 7 - currentDay + nextDay;
          
          if (daysToAdd === 0 && nextWeekly <= now) {
            daysToAdd = 7;
          }
          
          nextWeekly.setDate(nextWeekly.getDate() + daysToAdd);
          return nextWeekly;
        }
          
        case 'custom': {
          const nextCustom = new Date(now);
          nextCustom.setHours(nextCustom.getHours() + (cfg.interval_hours || 1));
          return nextCustom;
        }
          
        default:
          return new Date(now.getTime() + 86400000); // 24h
      }
    };

    const nextRun = calculateNextRun(config);

    // Verificar se usuário é dono do site
    const { data: site } = await supabase
      .from('rank_rent_sites')
      .select('owner_user_id')
      .eq('id', site_id)
      .single();

    if (!site) {
      throw new Error('Site não encontrado');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const user_id = user.id;

    // INSERT ou UPDATE baseado em config_id
    let data, upsertError;

    if (config_id) {
      // UPDATE existing schedule
      const result = await supabaseAdmin
        .from('gsc_schedule_config')
        .update({
          ...config,
          next_run_at: nextRun.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', config_id)
        .select()
        .single();
      
      data = result.data;
      upsertError = result.error;
    } else {
      // INSERT new schedule
      const result = await supabaseAdmin
        .from('gsc_schedule_config')
        .insert({
          site_id,
          user_id,
          ...config,
          next_run_at: nextRun.toISOString(),
        })
        .select()
        .single();
      
      data = result.data;
      upsertError = result.error;
    }

    if (upsertError) throw upsertError;

    console.log('✅ Config salva:', data);

    return new Response(
      JSON.stringify({ 
        success: true, 
        config: data,
        next_run_at: nextRun.toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('❌ Erro ao salvar config:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});