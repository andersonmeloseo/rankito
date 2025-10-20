import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface ConversionEvent {
  id: string;
  site_id: string;
  page_id: string | null;
  event_type: string;
  page_url: string;
  page_path: string;
  cta_text: string | null;
  metadata: Record<string, any>;
  created_at: string;
  ip_address: string | null;
  user_agent: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  country_code: string | null;
}

interface AutoConversionSettings {
  enabled: boolean;
  whatsapp_click_enabled: boolean;
  phone_click_enabled: boolean;
  form_submit_enabled: boolean;
  email_click_enabled: boolean;
  whatsapp_score: number;
  phone_score: number;
  form_score: number;
  email_score: number;
  default_stage: string;
}

interface Site {
  id: string;
  site_name: string;
  site_url: string;
  niche: string;
  location: string;
  owner_user_id: string;
  client_id: string | null;
}

Deno.serve(async (req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔄 Starting auto-conversion process...');

    // Buscar conversões dos últimos 5 minutos que podem gerar leads
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data: conversions, error: conversionsError } = await supabase
      .from('rank_rent_conversions')
      .select('*')
      .in('event_type', ['whatsapp_click', 'phone_click', 'form_submit', 'email_click'])
      .gte('created_at', fiveMinutesAgo)
      .order('created_at', { ascending: false });

    if (conversionsError) {
      console.error('Error fetching conversions:', conversionsError);
      return new Response(JSON.stringify({ error: conversionsError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!conversions || conversions.length === 0) {
      console.log('✅ No new conversions to process');
      return new Response(JSON.stringify({ message: 'No conversions to process', processed: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`📊 Found ${conversions.length} conversions to analyze`);

    // Buscar sites únicos envolvidos
    const siteIds = [...new Set(conversions.map(c => c.site_id))];
    const { data: sites, error: sitesError } = await supabase
      .from('rank_rent_sites')
      .select('id, site_name, site_url, niche, location, owner_user_id, client_id')
      .in('id', siteIds);

    if (sitesError) {
      console.error('Error fetching sites:', sitesError);
      return new Response(JSON.stringify({ error: sitesError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Mapear sites por ID
    const sitesMap = new Map<string, Site>();
    sites?.forEach(site => sitesMap.set(site.id, site));

    // Buscar configurações de auto-conversão por usuário
    const userIds = [...new Set(sites?.map(s => s.owner_user_id) || [])];
    const { data: settings, error: settingsError } = await supabase
      .from('auto_conversion_settings')
      .select('*')
      .in('user_id', userIds);

    if (settingsError) {
      console.error('Error fetching settings:', settingsError);
    }

    // Mapear configurações por user_id
    const settingsMap = new Map<string, AutoConversionSettings>();
    settings?.forEach(s => settingsMap.set(s.user_id, s));

    let processed = 0;
    let created = 0;
    let skipped = 0;

    // Processar cada conversão
    for (const conversion of conversions as ConversionEvent[]) {
      const site = sitesMap.get(conversion.site_id);
      if (!site) {
        console.log(`⚠️ Site ${conversion.site_id} not found, skipping`);
        skipped++;
        continue;
      }

      const userSettings = settingsMap.get(site.owner_user_id);
      
      // Se usuário não tem configurações, usar defaults
      const config: AutoConversionSettings = userSettings || {
        enabled: true,
        whatsapp_click_enabled: true,
        phone_click_enabled: true,
        form_submit_enabled: true,
        email_click_enabled: false,
        whatsapp_score: 80,
        phone_score: 70,
        form_score: 90,
        email_score: 50,
        default_stage: 'lead',
      };

      // Verificar se auto-conversão está habilitada
      if (!config.enabled) {
        console.log(`⚠️ Auto-conversion disabled for user ${site.owner_user_id}, skipping`);
        skipped++;
        continue;
      }

      // Verificar se tipo de evento está habilitado
      const eventEnabled = {
        whatsapp_click: config.whatsapp_click_enabled,
        phone_click: config.phone_click_enabled,
        form_submit: config.form_submit_enabled,
        email_click: config.email_click_enabled,
      }[conversion.event_type];

      if (!eventEnabled) {
        console.log(`⚠️ Event type ${conversion.event_type} disabled, skipping`);
        skipped++;
        continue;
      }

      // Verificar se já existe deal para este site nas últimas 24h
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: existingDeals } = await supabase
        .from('crm_deals')
        .select('id')
        .eq('user_id', site.owner_user_id)
        .eq('site_id', site.id)
        .gte('created_at', oneDayAgo)
        .limit(1);

      if (existingDeals && existingDeals.length > 0) {
        console.log(`⚠️ Deal already exists for site ${site.site_name}, skipping`);
        skipped++;
        continue;
      }

      // Calcular lead score
      const baseScore = {
        whatsapp_click: config.whatsapp_score,
        phone_click: config.phone_score,
        form_submit: config.form_score,
        email_click: config.email_score,
      }[conversion.event_type] || 50;

      // Bônus por device mobile (+10)
      const isMobile = conversion.user_agent?.toLowerCase().includes('mobile') || false;
      const deviceBonus = isMobile ? 10 : 0;

      const leadScore = Math.min(100, baseScore + deviceBonus);

      // Determinar qualidade do lead
      const leadQuality = leadScore >= 80 ? 'hot' : leadScore >= 60 ? 'warm' : 'cold';

      // Criar título do deal
      const eventLabels = {
        whatsapp_click: 'WhatsApp',
        phone_click: 'Telefone',
        form_submit: 'Formulário',
        email_click: 'Email',
      };
      const eventLabel = eventLabels[conversion.event_type as keyof typeof eventLabels] || 'Contato';
      const title = `${leadQuality === 'hot' ? '🔥' : leadQuality === 'warm' ? '⚡' : '❄️'} Lead via ${eventLabel} - ${site.site_name}`;

      // Criar descrição
      const location = [conversion.city, conversion.region, conversion.country]
        .filter(Boolean)
        .join(', ') || 'Local não identificado';
      
      const description = `Lead capturado automaticamente do site ${site.site_name}.\n\n` +
        `📍 Localização: ${location}\n` +
        `📄 Página: ${conversion.page_path}\n` +
        `🎯 Ação: ${eventLabel}${conversion.cta_text ? ` - "${conversion.cta_text}"` : ''}\n` +
        `📱 Device: ${isMobile ? 'Mobile' : 'Desktop'}\n` +
        `⭐ Score: ${leadScore}/100`;

      // Criar deal
      const { data: newDeal, error: dealError } = await supabase
        .from('crm_deals')
        .insert({
          user_id: site.owner_user_id,
          site_id: site.id,
          client_id: site.client_id,
          title,
          description,
          stage: config.default_stage,
          lead_score: leadScore,
          source: 'auto_conversion',
          external_source: conversion.event_type,
          target_niche: site.niche,
          target_location: site.location,
          source_metadata: {
            conversion_id: conversion.id,
            event_type: conversion.event_type,
            page_url: conversion.page_url,
            cta_text: conversion.cta_text,
            location: {
              city: conversion.city,
              region: conversion.region,
              country: conversion.country,
              country_code: conversion.country_code,
            },
            device: {
              user_agent: conversion.user_agent,
              is_mobile: isMobile,
            },
            quality: leadQuality,
            auto_converted: true,
            converted_at: new Date().toISOString(),
          },
        })
        .select()
        .single();

      if (dealError) {
        console.error(`❌ Error creating deal for ${site.site_name}:`, dealError);
        continue;
      }

      console.log(`✅ Created deal: ${title} (ID: ${newDeal.id})`);

      // Criar atividade
      await supabase.from('crm_activities').insert({
        user_id: site.owner_user_id,
        deal_id: newDeal.id,
        activity_type: 'deal_created',
        title: 'Lead capturado automaticamente',
        description: `Conversão do tipo "${eventLabel}" foi detectada e convertida em lead automaticamente. Score: ${leadScore}/100`,
        metadata: {
          conversion_id: conversion.id,
          event_type: conversion.event_type,
          lead_score: leadScore,
          lead_quality: leadQuality,
        },
      });

      created++;
      processed++;
    }

    console.log(`✨ Auto-conversion completed: ${created} deals created, ${skipped} skipped, ${processed}/${conversions.length} processed`);

    return new Response(
      JSON.stringify({
        success: true,
        processed,
        created,
        skipped,
        total: conversions.length,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Fatal error in auto-convert-hot-leads:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
