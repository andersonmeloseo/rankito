import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    const { email, password, full_name, client_id } = await req.json();

    console.log('Creating end-client user:', { email, full_name, client_id, parent_user_id: user.id });

    // Verificar se o cliente pertence ao usuário atual
    const { data: client, error: clientError } = await supabaseClient
      .from('rank_rent_clients')
      .select('id, user_id, end_client_user_id')
      .eq('id', client_id)
      .eq('user_id', user.id)
      .single();

    if (clientError || !client) {
      throw new Error('Cliente não encontrado ou não pertence a você');
    }

    // Verificar se já existe end_client vinculado a este cliente
    if (client.end_client_user_id) {
      throw new Error('Este cliente já possui um usuário end_client vinculado');
    }

    // Verificar se já existe um end-client para este cliente
    const { data: existingProfile } = await supabaseClient
      .from('profiles')
      .select('id, email')
      .eq('parent_user_id', user.id)
      .eq('email', email)
      .maybeSingle();

    if (existingProfile) {
      throw new Error('Já existe um usuário com este email');
    }

    // Criar usuário via Admin API
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
      },
    });

    if (createError) {
      console.error('Error creating user:', createError);
      throw createError;
    }

    console.log('User created successfully:', newUser.user.id);

    // Atualizar profile com parent_user_id
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        parent_user_id: user.id,
        full_name,
      })
      .eq('id', newUser.user.id);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      // Tentar deletar o usuário criado
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      throw profileError;
    }

    console.log('Profile updated with parent_user_id');

    // Atualizar role para end_client
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .update({ role: 'end_client' })
      .eq('user_id', newUser.user.id);

    if (roleError) {
      console.error('Error updating role:', roleError);
      // Tentar deletar o usuário criado
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      throw roleError;
    }

    console.log('Role updated to end_client');

    // Vincular end_client ao cliente específico
    const { error: linkError } = await supabaseAdmin
      .from('rank_rent_clients')
      .update({ end_client_user_id: newUser.user.id })
      .eq('id', client_id)
      .eq('user_id', user.id); // Garantir que pertence ao SaaS user

    if (linkError) {
      console.error('Error linking end_client to client:', linkError);
      // Tentar deletar o usuário criado
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      throw new Error(`Failed to link end_client: ${linkError.message}`);
    }

    console.log('End-client successfully linked to client');

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: newUser.user.id,
          email: newUser.user.email,
          full_name,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in create-end-client:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
