import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function ExternalLeadsAPI() {
  useEffect(() => {
    const handleRequest = async () => {
      try {
        // Get request data
        const requestBody = await new Promise<any>((resolve) => {
          if (document.body.textContent) {
            try {
              resolve(JSON.parse(document.body.textContent));
            } catch {
              resolve({});
            }
          } else {
            resolve({});
          }
        });

        // Get API token from request
        const urlParams = new URLSearchParams(window.location.search);
        const apiToken = urlParams.get('token') || requestBody.token;

        if (!apiToken) {
          sendResponse({
            success: false,
            error: 'Token de API é obrigatório',
            code: 'MISSING_TOKEN'
          }, 401);
          return;
        }

        // Call edge function
        const { data, error } = await supabase.functions.invoke(
          'create-deal-from-external-source',
          {
            body: requestBody,
            headers: {
              'x-api-token': apiToken,
            },
          }
        );

        if (error) {
          sendResponse({
            success: false,
            error: error.message || 'Erro ao processar lead',
            code: 'PROCESSING_ERROR'
          }, 500);
          return;
        }

        sendResponse(data, 200);
      } catch (error) {
        console.error('Error in ExternalLeadsAPI:', error);
        sendResponse({
          success: false,
          error: 'Erro interno do servidor',
          code: 'INTERNAL_ERROR'
        }, 500);
      }
    };

    const sendResponse = (data: any, status: number) => {
      const response = {
        status,
        data,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      };
      
      // Send message to parent if in iframe
      if (window.parent !== window) {
        window.parent.postMessage({ type: 'api-response', response }, '*');
      }
      
      // Display in page
      document.body.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
    };

    // Only handle POST requests
    if (window.location.pathname === '/api/external-leads') {
      handleRequest();
    }
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">RankiTO API Endpoint</h1>
        <p className="text-muted-foreground">
          Este é um endpoint público para captura de leads.
        </p>
        <p className="text-sm text-muted-foreground">
          Envie uma requisição POST com os dados do lead e seu token de API.
        </p>
      </div>
    </div>
  );
}
