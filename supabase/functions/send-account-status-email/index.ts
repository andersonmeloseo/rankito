import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  email: string;
  status: 'approved' | 'rejected';
  userName: string;
  planName?: string;
  rejectionReason?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, status, userName, planName, rejectionReason }: EmailRequest = await req.json();
    
    console.log(`📧 Sending ${status} email to ${email}`);

    // Selecionar template baseado no status
    const template = status === 'approved' 
      ? getApprovedTemplate(userName, planName || 'Starter')
      : getRejectedTemplate(userName, rejectionReason || 'Não especificado');

    const subject = status === 'approved'
      ? "🎉 Sua conta foi aprovada - Rankito CRM"
      : "Status do Cadastro - Rankito CRM";

    // Enviar email via Resend
    const emailResponse = await resend.emails.send({
      from: "Rankito CRM <noreply@rankitocrm.com>",
      to: [email],
      subject,
      html: template,
    });

    console.log("✅ Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("❌ Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

function getApprovedTemplate(userName: string, planName: string): string {
  const template = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Conta Aprovada - Rankito CRM</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, 'system-ui', 'Segoe UI', roboto, 'Helvetica Neue', helvetica, arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          
          <!-- Header com Gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #0066FF 0%, #00CC88 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700;">
                🎉 Conta Aprovada!
              </h1>
            </td>
          </tr>
          
          <!-- Conteúdo Principal -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 18px; color: #333333; margin: 0 0 20px;">
                Olá <strong>{{userName}}</strong>,
              </p>
              
              <p style="font-size: 16px; color: #555555; line-height: 1.6; margin: 0 0 20px;">
                Temos uma ótima notícia! Sua conta no <strong>Rankito CRM</strong> foi aprovada pela nossa equipe. 🚀
              </p>
              
              <p style="font-size: 16px; color: #555555; line-height: 1.6; margin: 0 0 30px;">
                Você já pode fazer login e começar a gerenciar seus projetos Rank n Rent com todas as ferramentas profissionais que oferecemos.
              </p>
              
              <!-- Card do Plano -->
              <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-left: 4px solid #0066FF; padding: 20px; border-radius: 8px; margin: 0 0 30px;">
                <p style="margin: 0 0 10px; font-size: 14px; color: #666; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">
                  SEU PLANO
                </p>
                <p style="margin: 0; font-size: 24px; color: #0066FF; font-weight: 700;">
                  {{planName}}
                </p>
              </div>
              
              <!-- Botão CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="https://app.rankitocrm.com/auth" style="display: inline-block; background: linear-gradient(135deg, #0066FF 0%, #0052CC 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(0, 102, 255, 0.3);">
                      Fazer Login Agora
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Recursos Destacados -->
              <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e5e5e5;">
                <p style="font-size: 16px; color: #333; margin: 0 0 20px; font-weight: 600;">
                  O que você pode fazer agora:
                </p>
                
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 10px 0;">
                      <span style="display: inline-block; width: 24px; height: 24px; background-color: #00CC88; border-radius: 50%; text-align: center; line-height: 24px; color: white; font-weight: bold; margin-right: 10px;">✓</span>
                      <span style="color: #555; font-size: 15px;">Adicionar seus sites Rank n Rent</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0;">
                      <span style="display: inline-block; width: 24px; height: 24px; background-color: #00CC88; border-radius: 50%; text-align: center; line-height: 24px; color: white; font-weight: bold; margin-right: 10px;">✓</span>
                      <span style="color: #555; font-size: 15px;">Indexar páginas automaticamente no Google</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0;">
                      <span style="display: inline-block; width: 24px; height: 24px; background-color: #00CC88; border-radius: 50%; text-align: center; line-height: 24px; color: white; font-weight: bold; margin-right: 10px;">✓</span>
                      <span style="color: #555; font-size: 15px;">Gerenciar conversões e leads</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0;">
                      <span style="display: inline-block; width: 24px; height: 24px; background-color: #00CC88; border-radius: 50%; text-align: center; line-height: 24px; color: white; font-weight: bold; margin-right: 10px;">✓</span>
                      <span style="color: #555; font-size: 15px;">Acompanhar métricas financeiras</span>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #666;">
                Precisa de ajuda? Entre em contato:
              </p>
              <p style="margin: 0; font-size: 14px;">
                <a href="mailto:suporte@rankitocrm.com" style="color: #0066FF; text-decoration: none; font-weight: 600;">suporte@rankitocrm.com</a>
              </p>
              
              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e5e5;">
                <p style="margin: 0; font-size: 12px; color: #999;">
                  © 2025 Rankito CRM - Sistema de Gestão de Rank n Rent
                </p>
              </div>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return template
    .replace(/{{userName}}/g, userName)
    .replace(/{{planName}}/g, planName);
}

function getRejectedTemplate(userName: string, reason: string): string {
  const template = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Status do Cadastro - Rankito CRM</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, 'system-ui', 'Segoe UI', roboto, 'Helvetica Neue', helvetica, arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #666666 0%, #999999 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                Status do Cadastro
              </h1>
            </td>
          </tr>
          
          <!-- Conteúdo Principal -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 18px; color: #333333; margin: 0 0 20px;">
                Olá <strong>{{userName}}</strong>,
              </p>
              
              <p style="font-size: 16px; color: #555555; line-height: 1.6; margin: 0 0 20px;">
                Agradecemos seu interesse no <strong>Rankito CRM</strong>. Após análise da nossa equipe, infelizmente não foi possível aprovar seu cadastro no momento.
              </p>
              
              <!-- Motivo da Rejeição -->
              <div style="background-color: #fff5f5; border-left: 4px solid #ff6b6b; padding: 20px; border-radius: 8px; margin: 0 0 30px;">
                <p style="margin: 0 0 10px; font-size: 14px; color: #666; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">
                  MOTIVO
                </p>
                <p style="margin: 0; font-size: 16px; color: #ff6b6b; line-height: 1.5;">
                  {{rejectionReason}}
                </p>
              </div>
              
              <p style="font-size: 16px; color: #555555; line-height: 1.6; margin: 0 0 30px;">
                Se você acredita que houve algum erro ou gostaria de mais informações, entre em contato conosco. Estamos à disposição para esclarecer qualquer dúvida.
              </p>
              
              <!-- Botão Contato -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="mailto:suporte@rankitocrm.com" style="display: inline-block; background-color: #666666; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      Entrar em Contato
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #666;">
                Dúvidas? Fale conosco:
              </p>
              <p style="margin: 0; font-size: 14px;">
                <a href="mailto:suporte@rankitocrm.com" style="color: #0066FF; text-decoration: none; font-weight: 600;">suporte@rankitocrm.com</a>
              </p>
              
              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e5e5;">
                <p style="margin: 0; font-size: 12px; color: #999;">
                  © 2025 Rankito CRM - Sistema de Gestão de Rank n Rent
                </p>
              </div>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return template
    .replace(/{{userName}}/g, userName)
    .replace(/{{rejectionReason}}/g, reason);
}

serve(handler);
