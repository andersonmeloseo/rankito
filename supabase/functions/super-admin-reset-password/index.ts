import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, new_password, admin_secret } = await req.json();

    console.log('Reset password request for:', email);

    // Validação de segurança
    const SUPER_ADMIN_SECRET = Deno.env.get('SUPER_ADMIN_SECRET');
    if (admin_secret !== SUPER_ADMIN_SECRET) {
      console.error('Invalid admin secret');
      throw new Error('Unauthorized: Invalid admin secret');
    }

    if (!email || !new_password) {
      throw new Error('Email e senha são obrigatórios');
    }

    if (new_password.length < 6) {
      throw new Error('Senha deve ter pelo menos 6 caracteres');
    }

    // Criar cliente admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Buscar usuário por email
    const { data: { users }, error: listError } = 
      await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      throw listError;
    }
    
    const user = users.find(u => u.email === email);
    if (!user) {
      console.error('User not found:', email);
      throw new Error('Usuário não encontrado');
    }

    console.log('User found:', user.id);

    // Resetar senha
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: new_password }
    );

    if (updateError) {
      console.error('Error updating password:', updateError);
      throw updateError;
    }

    console.log('Password reset successful for:', email);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Senha resetada com sucesso para ${email}`,
        user_id: user.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in super-admin-reset-password:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
