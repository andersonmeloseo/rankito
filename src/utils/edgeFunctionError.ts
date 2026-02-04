export interface EdgeFunctionErrorData {
  error: string;
  message: string;
  instructions?: string[];
  action?: string;
  details?: string;
}

export function extractEdgeFunctionError(response: any): EdgeFunctionErrorData | null {
  // Se response.data contém estrutura de erro detalhada
  if (response.data && typeof response.data === 'object') {
    if (response.data.error || response.data.message) {
      return response.data as EdgeFunctionErrorData;
    }
  }
  return null;
}
