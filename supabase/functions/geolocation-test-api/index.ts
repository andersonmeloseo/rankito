import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { provider, apiKey } = await req.json();
    const testIp = '8.8.8.8'; // Google DNS para teste
    
    let result: any;
    let success = false;
    let message = '';
    
    switch(provider) {
      case 'ipgeolocation':
        const resGeo = await fetch(`https://api.ipgeolocation.io/ipgeo?apiKey=${apiKey}&ip=${testIp}`);
        result = await resGeo.json();
        
        // Detectar erros específicos da API
        if (result.message) {
          if (result.message.includes('API key is invalid') || result.message.includes('Invalid API key')) {
            throw new Error('❌ API Key inválida para IPGeolocation.io');
          }
          if (result.message.includes('You have exceeded') || result.message.includes('exceeded')) {
            throw new Error('❌ Limite de requisições excedido no IPGeolocation.io');
          }
          throw new Error(`❌ Erro IPGeolocation: ${result.message}`);
        }
        
        success = resGeo.ok && result.city;
        message = success 
          ? `✅ API validada com sucesso! Localização: ${result.city}, ${result.country_name}` 
          : 'Resposta inválida da API';
        break;
        
      case 'ipapi':
        const resApi = await fetch(`http://ip-api.com/json/${testIp}?fields=status,city,regionName,country,countryCode`);
        result = await resApi.json();
        success = result.status === 'success';
        message = success ? 'API validada com sucesso' : 'Resposta inválida';
        break;
        
      case 'ipstack':
        const resStack = await fetch(`http://api.ipstack.com/${testIp}?access_key=${apiKey}`);
        result = await resStack.json();
        success = !result.error && result.city;
        message = success ? 'API validada com sucesso' : result.error?.info || 'Resposta inválida';
        break;
        
      case 'ipinfo':
        const resInfo = await fetch(`https://ipinfo.io/${testIp}/json?token=${apiKey}`);
        result = await resInfo.json();
        success = resInfo.ok && result.city;
        message = success ? 'API validada com sucesso' : 'Resposta inválida';
        break;
        
      default:
        throw new Error('Provider não suportado');
    }
    
    return new Response(
      JSON.stringify({ 
        success,
        message,
        testData: success ? {
          city: result.city,
          country: result.country || result.country_name,
          ip: testIp
        } : null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error: any) {
    return new Response(
      JSON.stringify({ 
        success: false,
        message: error?.message || 'Erro ao testar API'
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
