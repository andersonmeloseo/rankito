import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailPayload {
  leadId: string;
  email: string;
  fullName: string;
  leadNumber: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY não configurada');
    }

    const { leadId, email, fullName, leadNumber }: EmailPayload = await req.json();

    console.log('Enviando email de confirmação para:', email);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bem-vindo ao Rankito CRM</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); padding: 40px 30px; text-align: center;">
            <div style="width: 60px; height: 60px; background: white; border-radius: 12px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 32px; font-weight: bold; color: #2563eb;">R</span>
            </div>
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">
              🎉 Vaga Garantida!
            </h1>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <p style="font-size: 18px; color: #111827; margin: 0 0 20px;">
              Olá <strong>${fullName}</strong>,
            </p>
            
            <p style="font-size: 16px; color: #374151; line-height: 1.6; margin: 0 0 20px;">
              Parabéns! Você é o inscrito <strong style="color: #2563eb;">#${leadNumber}</strong> na lista de espera do Rankito CRM.
            </p>
            
            <div style="background: #eff6ff; border-left: 4px solid #2563eb; padding: 20px; margin: 30px 0; border-radius: 8px;">
              <p style="margin: 0 0 15px; font-weight: 600; color: #1e40af; font-size: 16px;">
                ✨ O que você ganhou:
              </p>
              <ul style="margin: 0; padding-left: 20px; color: #374151; line-height: 1.8;">
                <li>50% de desconto <strong>vitalício</strong> em qualquer plano</li>
                <li>Setup call gratuita de 30min com especialista</li>
                <li>Acesso antecipado a novos recursos</li>
                <li>Suporte prioritário nos primeiros 3 meses</li>
                <li>Comunidade exclusiva de early adopters</li>
                <li>Trial de 14 dias sem cartão de crédito</li>
              </ul>
            </div>
            
            <p style="font-size: 16px; color: #374151; line-height: 1.6; margin: 0 0 20px;">
              <strong>Próximos passos:</strong>
            </p>
            
            <ol style="margin: 0 0 30px; padding-left: 20px; color: #374151; line-height: 1.8;">
              <li>Vamos te notificar por email assim que o acesso estiver disponível</li>
              <li>Você receberá um código promocional exclusivo com 50% OFF</li>
              <li>Nossa equipe entrará em contato para agendar sua setup call</li>
            </ol>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${Deno.env.get('VITE_APP_URL') || 'https://app.rankitocrm.com'}" 
                 style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                Visitar Rankito CRM
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin: 30px 0 0; padding-top: 30px; border-top: 1px solid #e5e7eb;">
              Se tiver dúvidas, responda este email. Estamos aqui para ajudar!
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; font-size: 14px; color: #6b7280;">
              © ${new Date().getFullYear()} Rankito CRM - Sistema de Gestão de Sites
            </p>
            <p style="margin: 10px 0 0; font-size: 12px; color: #9ca3af;">
              Analytics Simplificado para Profissionais que Gerenciam Sites
            </p>
          </div>
          
        </div>
      </body>
      </html>
    `;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Rankito CRM <noreply@app.rankitocrm.com>',
        to: [email],
        subject: `🎉 Vaga Garantida! Você é o inscrito #${leadNumber}`,
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro ao enviar email via Resend:', errorData);
      throw new Error(`Falha ao enviar email: ${errorData.message || response.statusText}`);
    }

    const result = await response.json();
    console.log('Email enviado com sucesso:', result);

    return new Response(
      JSON.stringify({ success: true, emailId: result.id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Erro na função send-early-access-confirmation:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Erro ao enviar email de confirmação',
        message: error instanceof Error ? error.message : String(error),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});