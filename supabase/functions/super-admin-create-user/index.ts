import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUserInput {
  email: string;
  password: string;
  full_name: string;
  role: 'client' | 'end_client' | 'super_admin';
  plan_id?: string;
  company?: string;
  whatsapp?: string;
  website?: string;
  country_code?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get JWT from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Create Supabase client with user JWT
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user is authenticated and is super_admin
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user has super_admin role
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'super_admin')
      .single();

    if (roleError || !userRole) {
      throw new Error('Insufficient permissions - super_admin role required');
    }

    // Parse request body
    const body: CreateUserInput = await req.json();
    const { email, password, full_name, role, plan_id, company, whatsapp, website, country_code } = body;

    // Validate required fields
    if (!email || !password || !full_name || !role) {
      throw new Error('Missing required fields: email, password, full_name, role');
    }

    // Create Supabase Admin client for user creation
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Create user via Admin API
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name,
      }
    });

    if (createError || !newUser.user) {
      throw new Error(`Failed to create user: ${createError?.message}`);
    }

    const userId = newUser.user.id;

    // 2. Activate account and update profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name,
        is_active: true,
        approved_at: new Date().toISOString(),
        approved_by: user.id,
        company: company || null,
        whatsapp: whatsapp || null,
        website: website || null,
        country_code: country_code || null,
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Profile update error:', profileError);
      // Don't throw - profile might already be created by trigger
    }

    // 3. Assign role
    const { error: roleAssignError } = await supabaseAdmin
      .from('user_roles')
      .upsert({
        user_id: userId,
        role,
      });

    if (roleAssignError) {
      throw new Error(`Failed to assign role: ${roleAssignError.message}`);
    }

    // 4. Create subscription if plan_id provided
    let subscriptionCreated = false;
    if (plan_id) {
      // Fetch plan details
      const { data: plan, error: planError } = await supabaseAdmin
        .from('subscription_plans')
        .select('*')
        .eq('id', plan_id)
        .single();

      if (planError) {
        console.error('Plan fetch error:', planError);
      } else if (plan) {
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + (plan.trial_days || 0));

        const { error: subError } = await supabaseAdmin
          .from('user_subscriptions')
          .insert({
            user_id: userId,
            plan_id: plan.id,
            status: plan.trial_days > 0 ? 'trial' : 'active',
            current_period_start: new Date().toISOString().split('T')[0],
            current_period_end: trialEndDate.toISOString().split('T')[0],
            trial_end_date: plan.trial_days > 0 ? trialEndDate.toISOString().split('T')[0] : null,
          });

        if (subError) {
          console.error('Subscription creation error:', subError);
        } else {
          subscriptionCreated = true;
        }
      }
    }

    // 5. Send welcome email (optional - don't block on failure)
    try {
      await supabase.functions.invoke('send-account-status-email', {
        body: {
          email,
          status: 'approved',
          userName: full_name,
          planName: plan_id ? 'Selected Plan' : 'Starter',
        }
      });
      console.log('✅ Welcome email sent');
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError);
      // Don't throw - email failure shouldn't block user creation
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: userId,
          email,
          full_name,
        },
        subscription_created: subscriptionCreated,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in super-admin-create-user:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
