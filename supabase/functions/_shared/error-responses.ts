/**
 * Respostas de erro padronizadas para Edge Functions
 */

export interface EdgeFunctionError {
  error: string;
  message: string;
  code?: string;
  action?: string;
}

export function createErrorResponse(
  error: unknown,
  context: string,
  statusCode: number = 500
): Response {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  let response: EdgeFunctionError = {
    error: context,
    message: errorMessage,
    action: 'Tente novamente ou entre em contato com o suporte'
  };

  // Personalizar por tipo de erro
  if (errorMessage.includes('not found') || errorMessage.includes('404')) {
    response.message = 'Recurso não encontrado';
    response.action = 'Verifique se o ID está correto';
    statusCode = 404;
  } else if (errorMessage.includes('Unauthorized') || errorMessage.includes('401')) {
    response.message = 'Acesso não autorizado';
    response.action = 'Faça login e tente novamente';
    statusCode = 401;
  } else if (errorMessage.includes('quota') || errorMessage.includes('429')) {
    response.message = 'Limite de requisições atingido';
    response.action = 'Aguarde alguns minutos e tente novamente';
    statusCode = 429;
  }

  return new Response(
    JSON.stringify(response),
    {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    }
  );
}
