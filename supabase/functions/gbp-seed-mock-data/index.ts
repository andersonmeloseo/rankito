import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MockProfile {
  name: string;
  niche: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  lat: number;
  lng: number;
  categories: string[];
  attributes: Record<string, boolean>;
}

const MOCK_PROFILES: MockProfile[] = [
  {
    name: 'La Bella Vita Ristorante',
    niche: 'Restaurante Italiano',
    description: 'Autêntica cozinha italiana com massas artesanais e ambiente acolhedor. Perfeito para um jantar romântico ou reunião em família.',
    address: 'Rua Augusta, 2450 - Cerqueira César, São Paulo - SP',
    phone: '(11) 3062-4567',
    email: 'contato@labellavita.com.br',
    website: 'https://labellavita.com.br',
    lat: -23.5629,
    lng: -46.6544,
    categories: ['Restaurante Italiano', 'Pizzaria', 'Delivery'],
    attributes: {
      wifi_gratuito: true,
      estacionamento: true,
      acessivel_cadeira_rodas: true,
      aceita_reservas: true,
      delivery: true,
      pagamento_cartao: true,
    },
  },
  {
    name: 'Sorriso Perfeito Odontologia',
    niche: 'Clínica Odontológica',
    description: 'Clínica odontológica moderna com equipamentos de última geração. Especialistas em implantes, ortodontia e estética dental.',
    address: 'Av. Paulista, 1842 - Bela Vista, São Paulo - SP',
    phone: '(11) 3287-8901',
    email: 'atendimento@sorrisoperfeito.com.br',
    website: 'https://sorrisoperfeito.com.br',
    lat: -23.5640,
    lng: -46.6553,
    categories: ['Dentista', 'Clínica Odontológica', 'Ortodontista'],
    attributes: {
      wifi_gratuito: true,
      estacionamento: true,
      acessivel_cadeira_rodas: true,
      aceita_convenios: true,
      pagamento_cartao: true,
      agendamento_online: true,
    },
  },
  {
    name: 'FitLife Academia',
    niche: 'Academia de Ginástica',
    description: 'Academia completa com musculação, aulas coletivas, personal trainer e nutricionista. Ambiente motivador e equipamentos modernos.',
    address: 'Rua Oscar Freire, 1234 - Jardins, São Paulo - SP',
    phone: '(11) 3068-2345',
    email: 'contato@fitlifeacademia.com.br',
    website: 'https://fitlifeacademia.com.br',
    lat: -23.5615,
    lng: -46.6708,
    categories: ['Academia', 'Personal Trainer', 'Nutricionista'],
    attributes: {
      wifi_gratuito: true,
      estacionamento: true,
      vestiario: true,
      chuveiro: true,
      armarios: true,
      aulas_grupo: true,
    },
  },
  {
    name: 'Estilo & Charme Salão',
    niche: 'Salão de Beleza',
    description: 'Salão de beleza completo com cabelereiro, manicure, pedicure, maquiagem e design de sobrancelhas. Produtos premium e profissionais experientes.',
    address: 'Rua Haddock Lobo, 567 - Cerqueira César, São Paulo - SP',
    phone: '(11) 3061-7890',
    email: 'contato@estiloecharme.com.br',
    website: 'https://estiloecharme.com.br',
    lat: -23.5602,
    lng: -46.6656,
    categories: ['Salão de Beleza', 'Barbearia', 'Estética'],
    attributes: {
      wifi_gratuito: true,
      estacionamento: false,
      aceita_agendamento: true,
      produtos_venda: true,
      pagamento_cartao: true,
      ar_condicionado: true,
    },
  },
  {
    name: 'Mundo Pet Shop',
    niche: 'Pet Shop',
    description: 'Pet shop completo com banho, tosa, veterinário, produtos e rações de qualidade. Cuidamos do seu pet com carinho e profissionalismo.',
    address: 'Av. Brigadeiro Faria Lima, 2789 - Jardim Paulistano, São Paulo - SP',
    phone: '(11) 3815-4567',
    email: 'contato@mundopet.com.br',
    website: 'https://mundopet.com.br',
    lat: -23.5779,
    lng: -46.6870,
    categories: ['Pet Shop', 'Veterinário', 'Banho e Tosa'],
    attributes: {
      wifi_gratuito: true,
      estacionamento: true,
      aceita_todas_especies: true,
      veterinario_24h: false,
      delivery: true,
      pagamento_cartao: true,
    },
  },
];

const BUSINESS_HOURS = {
  monday: { open: '09:00', close: '18:00', closed: false },
  tuesday: { open: '09:00', close: '18:00', closed: false },
  wednesday: { open: '09:00', close: '18:00', closed: false },
  thursday: { open: '09:00', close: '18:00', closed: false },
  friday: { open: '09:00', close: '18:00', closed: false },
  saturday: { open: '10:00', close: '14:00', closed: false },
  sunday: { open: '', close: '', closed: true },
};

function generateReviewText(rating: number, niche: string): string {
  const positiveReviews = [
    'Excelente atendimento! Superou todas as minhas expectativas.',
    'Adorei o serviço, muito profissional e atencioso. Recomendo!',
    'Ambiente incrível e equipe muito competente. Nota 10!',
    'Recomendo de olhos fechados! Experiência perfeita do início ao fim.',
    'Melhor da região, sem dúvidas. Voltarei sempre que precisar!',
    'Serviço impecável! Equipe super atenciosa e dedicada.',
    'Fiquei impressionado com a qualidade! Superou o que esperava.',
    'Atendimento de primeira, ambiente agradável. Perfeito!',
    'Profissionais excelentes! Me senti muito bem cuidado.',
    'Simplesmente maravilhoso! Vale muito a pena conhecer.',
    'Qualidade excepcional e preço justo. Muito satisfeito!',
    'Melhor experiência que já tive! Voltarei com certeza.',
    'Equipe fantástica, atendimento rápido e eficiente.',
    'Adorei cada detalhe! Ambiente acolhedor e profissional.',
    'Serviço de altíssima qualidade! Recomendo muito.',
    'Fantástico! Atendimento personalizado e cuidadoso.',
    'Superou minhas expectativas! Voltarei sempre.',
    'Profissionalismo e qualidade em cada detalhe. Nota mil!',
    'Melhor escolha que fiz! Serviço impecável.',
    'Experiência incrível! Equipe muito preparada e atenciosa.',
    'Simplesmente perfeito! Não tenho palavras para descrever.',
    'Atendimento excepcional! Me senti muito bem recebido.',
  ];
  
  const neutralReviews = [
    'Bom atendimento, mas acho que pode melhorar em alguns aspectos.',
    'Serviço ok, cumpre o que promete mas esperava um pouco mais.',
    'Nada de excepcional, mas atende bem. É uma opção razoável.',
    'Atendimento bom, mas o tempo de espera foi um pouco longo.',
    'Serviço correto, sem grandes surpresas. Preço justo.',
    'Boa experiência no geral, alguns detalhes poderiam ser melhores.',
    'Atenderam bem, mas senti falta de mais atenção aos detalhes.',
    'Serviço adequado, nada que me impressionou muito.',
    'Razoável. Tem pontos positivos e negativos.',
    'Bom custo-benefício, mas não foi uma experiência marcante.',
    'Serviço dentro do esperado. Não decepcionou, mas não surpreendeu.',
  ];
  
  const negativeReviews = [
    'Atendimento demorado e pouco atencioso. Decepcionante.',
    'Não gostei da experiência. Esperava muito mais qualidade.',
    'Deixou muito a desejar. Não voltarei e não recomendo.',
    'Péssimo atendimento! Fui mal recebido e mal atendido.',
    'Muito desorganizado. Esperei demais e o serviço foi fraco.',
    'Qualidade ruim e preço alto. Não vale a pena.',
    'Experiência frustrante. Falta de profissionalismo evidente.',
    'Decepcionante do início ao fim. Não recomendo.',
    'Atendimento grosseiro e serviço de baixa qualidade.',
    'Pior experiência que já tive. Totalmente insatisfeito.',
    'Não voltaria nem se me pagassem. Péssimo em todos os aspectos.',
    'Falta de respeito com o cliente. Muito desapontado.',
  ];
  
  if (rating >= 4) return positiveReviews[Math.floor(Math.random() * positiveReviews.length)];
  if (rating === 3) return neutralReviews[Math.floor(Math.random() * neutralReviews.length)];
  return negativeReviews[Math.floor(Math.random() * negativeReviews.length)];
}

function generateSentiment(rating: number): string {
  if (rating >= 4) return 'positive';
  if (rating === 3) return 'neutral';
  return 'negative';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    let { site_id, clear_existing = false } = await req.json();

    // Se site_id não for fornecido, criar um site mockado padrão
    if (!site_id) {
      console.log('📦 Criando site mockado padrão...');
      
      // Verificar se já existe um site mockado para este usuário
      const { data: existingSite } = await supabase
        .from('rank_rent_sites')
        .select('id')
        .eq('owner_user_id', user.id)
        .ilike('site_name', '%GBP Demo%')
        .limit(1)
        .single();
      
      if (existingSite) {
        site_id = existingSite.id;
        console.log('✅ Site mockado existente encontrado:', site_id);
      } else {
        // Criar novo site mockado
        const { data: newSite, error: siteError } = await supabase
          .from('rank_rent_sites')
          .insert({
            owner_user_id: user.id,
            created_by_user_id: user.id,
            site_name: 'GBP Demo Site',
            site_url: 'https://demo-gbp.example.com',
            niche: 'Demo / Testes GBP',
            location: 'São Paulo, SP',
            tracking_pixel_installed: true,
          })
          .select('id')
          .single();
        
        if (siteError) {
          console.error('❌ Erro ao criar site mockado:', siteError);
          throw new Error(`Erro ao criar site mockado: ${siteError.message}`);
        }
        
        site_id = newSite.id;
        console.log('✅ Novo site mockado criado:', site_id);
      }
    }

    // Se clear_existing for true, limpar dados mockados existentes
    if (clear_existing) {
      console.log('🗑️ Limpando dados mockados existentes...');
      
      const { data: profilesToDelete } = await supabase
        .from('google_business_profiles')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_mock', true)
        .eq('site_id', site_id);
      
      const profileIds = profilesToDelete?.map(p => p.id) || [];
      
      if (profileIds.length > 0) {
        // Delete associated data first (due to foreign keys)
        await supabase.from('gbp_questions').delete().in('profile_id', profileIds);
        await supabase.from('gbp_photos').delete().in('profile_id', profileIds);
        await supabase.from('gbp_posts').delete().in('profile_id', profileIds);
        await supabase.from('gbp_analytics').delete().in('profile_id', profileIds);
        await supabase.from('gbp_reviews').delete().in('profile_id', profileIds);
      }
      
      // Finally delete the profiles
      await supabase
        .from('google_business_profiles')
        .delete()
        .eq('user_id', user.id)
        .eq('is_mock', true)
        .eq('site_id', site_id);
    }

    console.log('🚀 Gerando perfis mockados com site_id:', site_id);
    const createdProfiles = [];

    // Create mock profiles
    for (const mockProfile of MOCK_PROFILES) {
      // Create profile
      const { data: profile, error: profileError } = await supabase
        .from('google_business_profiles')
        .insert({
          user_id: user.id,
          site_id: site_id,
          connection_name: mockProfile.name,
          business_name: mockProfile.name,
          business_address: mockProfile.address,
          business_phone: mockProfile.phone,
          business_email: mockProfile.email,
          business_website: mockProfile.website,
          business_description: mockProfile.description,
          business_categories: mockProfile.categories,
          business_hours: BUSINESS_HOURS,
          latitude: mockProfile.lat,
          longitude: mockProfile.lng,
          attributes: mockProfile.attributes,
          is_mock: true,
          is_active: true,
          health_status: 'healthy',
          verification_status: 'verified',
          total_reviews: 0,
          average_rating: 0,
          total_photos: 0,
          profile_photo_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(mockProfile.name)}`,
          cover_photo_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=400&fit=crop',
          opening_date: new Date(2020, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
        })
        .select()
        .single();

      if (profileError) {
        console.error('Error creating profile:', profileError);
        continue;
      }

      createdProfiles.push(profile);

      // Generate 30 reviews
      const reviewsToInsert = [];
      let totalRating = 0;
      
      for (let i = 0; i < 30; i++) {
        const random = Math.random();
        let rating: number;
        
        // Distribution: 20% = 5*, 25% = 4*, 30% = 3*, 15% = 2*, 10% = 1*
        if (random < 0.20) rating = 5;
        else if (random < 0.45) rating = 4;
        else if (random < 0.75) rating = 3;
        else if (random < 0.90) rating = 2;
        else rating = 1;
        
        totalRating += rating;
        
        const daysAgo = Math.floor(Math.random() * 180);
        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - daysAgo);
        
        const shouldReply = Math.random() > 0.5; // 50% chance de ter resposta
        const replyDate = new Date(createdAt);
        replyDate.setDate(replyDate.getDate() + Math.floor(Math.random() * 3) + 1);
        
        let replyText = null;
        if (shouldReply) {
          if (rating === 5) {
            replyText = 'Muito obrigado pelo feedback positivo! Ficamos felizes em tê-lo(a) como cliente. Conte sempre conosco!';
          } else if (rating === 4) {
            replyText = 'Agradecemos muito pelo seu feedback! Estamos sempre trabalhando para melhorar. Volte sempre!';
          } else if (rating === 3) {
            replyText = 'Obrigado pelo seu comentário. Vamos analisar seus pontos e trabalhar para melhorar nosso atendimento.';
          } else {
            replyText = 'Lamentamos que sua experiência não tenha sido satisfatória. Gostaríamos de conversar para entender melhor o ocorrido e resolver a situação. Entre em contato conosco.';
          }
        }
        
        reviewsToInsert.push({
          profile_id: profile.id,
          site_id: site_id,
          google_review_id: `mock_review_${profile.id}_${i}`,
          reviewer_name: `Cliente ${i + 1}`,
          reviewer_photo_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`,
          star_rating: rating,
          review_text: generateReviewText(rating, mockProfile.niche),
          sentiment: generateSentiment(rating),
          is_replied: shouldReply,
          review_reply: replyText,
          review_reply_at: shouldReply ? replyDate.toISOString() : null,
          created_at: createdAt.toISOString(),
          synced_at: new Date().toISOString(),
        });
      }
      
      await supabase.from('gbp_reviews').insert(reviewsToInsert);
      
      // Update profile with review stats
      const avgRating = totalRating / 30;
      await supabase
        .from('google_business_profiles')
        .update({ total_reviews: 30, average_rating: avgRating })
        .eq('id', profile.id);

      // Generate 90 days of analytics
      const analyticsToInsert = [];
      for (let i = 0; i < 90; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        analyticsToInsert.push({
          profile_id: profile.id,
          site_id: site_id,
          metric_date: date.toISOString().split('T')[0],
          searches_direct: Math.floor(Math.random() * 100) + 50,
          searches_discovery: Math.floor(Math.random() * 80) + 30,
          searches_branded: Math.floor(Math.random() * 120) + 60,
          actions_website: Math.floor(Math.random() * 40) + 10,
          actions_phone: Math.floor(Math.random() * 30) + 5,
          actions_directions: Math.floor(Math.random() * 50) + 15,
          profile_views: Math.floor(Math.random() * 200) + 100,
          profile_clicks: Math.floor(Math.random() * 80) + 20,
          local_post_views: Math.floor(Math.random() * 60) + 10,
          local_post_actions: Math.floor(Math.random() * 20) + 2,
          queries_chain: Math.floor(Math.random() * 30) + 5,
          queries_direct: Math.floor(Math.random() * 70) + 20,
          booking_clicks: Math.floor(Math.random() * 15) + 2,
        });
      }
      
      await supabase.from('gbp_analytics').insert(analyticsToInsert);

      // Generate 20 posts
      const postsToInsert = [];
      const postTypes = ['update', 'offer', 'event', 'product'];
      
      for (let i = 0; i < 20; i++) {
        const daysAgo = Math.floor(Math.random() * 60);
        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - daysAgo);
        
        let status: string;
        if (i < 10) status = 'published';
        else if (i < 17) status = 'scheduled';
        else status = 'draft';
        
        const postType = postTypes[Math.floor(Math.random() * postTypes.length)];
        
        postsToInsert.push({
          profile_id: profile.id,
          site_id: site_id,
          post_type: postType,
          title: `Novidade ${i + 1}`,
          content: `Confira nossa nova ${postType === 'offer' ? 'promoção' : 'novidade'}! Não perca essa oportunidade especial.`,
          status: status,
          cta_type: postType === 'offer' ? 'BOOK' : 'LEARN_MORE',
          cta_url: mockProfile.website,
          created_at: createdAt.toISOString(),
          published_at: status === 'published' ? createdAt.toISOString() : null,
          scheduled_for: status === 'scheduled' ? new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : null,
          views_count: status === 'published' ? Math.floor(Math.random() * 500) + 100 : 0,
          clicks_count: status === 'published' ? Math.floor(Math.random() * 50) + 10 : 0,
        });
      }
      
      await supabase.from('gbp_posts').insert(postsToInsert);

      // Generate photos
      const photoTypes = ['profile', 'cover', 'interior', 'exterior', 'product'];
      const photosToInsert = [];
      
      for (let i = 0; i < 15; i++) {
        const photoType = photoTypes[Math.floor(Math.random() * photoTypes.length)];
        photosToInsert.push({
          profile_id: profile.id,
          site_id: site_id,
          photo_type: photoType,
          photo_url: `https://images.unsplash.com/photo-${1500000000000 + i}?w=800&h=600&fit=crop`,
          caption: `Foto ${photoType} ${i + 1}`,
          view_count: Math.floor(Math.random() * 1000) + 100,
        });
      }
      
      await supabase.from('gbp_photos').insert(photosToInsert);

      // Update photo count
      await supabase
        .from('google_business_profiles')
        .update({ total_photos: 15 })
        .eq('id', profile.id);

      // Generate questions
      const questionsToInsert = [];
      const questions = [
        'Vocês aceitam cartão?',
        'Qual o horário de funcionamento?',
        'Fazem entrega?',
        'Tem estacionamento?',
        'Precisa agendar?',
        'Aceitam pets?',
        'Tem WiFi gratuito?',
        'Qual o telefone para contato?',
      ];
      
      for (let i = 0; i < 8; i++) {
        const isAnswered = i < 5;
        questionsToInsert.push({
          profile_id: profile.id,
          site_id: site_id,
          question_text: questions[i],
          answer_text: isAnswered ? 'Sim, aceitamos! Entre em contato para mais informações.' : null,
          asked_by: `Usuário ${i + 1}`,
          is_answered: isAnswered,
          answered_at: isAnswered ? new Date().toISOString() : null,
          upvotes: Math.floor(Math.random() * 10),
        });
      }
      
      await supabase.from('gbp_questions').insert(questionsToInsert);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `${createdProfiles.length} perfis mockados criados com sucesso!`,
        profiles: createdProfiles.map(p => ({ id: p.id, name: p.business_name })),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in gbp-seed-mock-data:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
