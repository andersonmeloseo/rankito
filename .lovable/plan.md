
## Plano: Melhorar Tratamento de Erros GSC com Mensagens Detalhadas

### Problema Identificado

Quando a Edge Function `gsc-get-sitemaps` retorna erro 403 com instruções detalhadas:
```json
{
  "error": "⚠️ Permissões Insuficientes no Google Search Console",
  "message": "A Service Account não tem permissões...",
  "instructions": ["1. Acesse GSC...", "2. Adicione usuário..."]
}
```

O frontend ignora esse JSON rico e mostra apenas: `"Erro ao buscar sitemaps: Edge function returned 403: Error"`

**Causa raiz:** O `supabase.functions.invoke` retorna:
- `response.error` = objeto genérico do Supabase
- `response.data` = corpo JSON da resposta (onde estão as instruções)

O código atual descarta `response.data` quando há erro.

---

### Solução

#### 1. Criar utilitário para extrair erros de Edge Functions

**Novo arquivo:** `src/utils/edgeFunctionError.ts`

```typescript
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
```

#### 2. Criar componente de Dialog para erros detalhados

**Novo arquivo:** `src/components/gsc/GSCErrorDialog.tsx`

Dialog modal que mostra:
- Título do erro (ex: "Permissões Insuficientes")
- Mensagem explicativa
- Lista numerada de instruções
- Botão para copiar email da Service Account
- Botão para fechar

#### 3. Atualizar GSCSitemapsManager.tsx

**Modificar `fetchSitemaps` mutation:**

```typescript
const fetchSitemaps = useMutation({
  mutationFn: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No session');

    const response = await supabase.functions.invoke('gsc-get-sitemaps', {
      body: { integration_id: integrationId },
    });

    // Verificar se há erro detalhado no response.data
    if (response.error) {
      const detailedError = extractEdgeFunctionError(response);
      if (detailedError) {
        // Lançar erro com dados completos para tratamento especial
        const error = new Error(detailedError.message);
        (error as any).detailedData = detailedError;
        throw error;
      }
      throw response.error;
    }
    return response.data;
  },
  onError: (error: any) => {
    // Se tem dados detalhados (403 com instruções), mostrar dialog
    if (error.detailedData?.instructions) {
      setErrorDialogData(error.detailedData);
      return;
    }
    // Fallback para toast simples
    toast.error(`Erro ao buscar sitemaps: ${error.message}`);
  },
});
```

#### 4. Adicionar estado e Dialog no componente

```typescript
const [errorDialogData, setErrorDialogData] = useState<EdgeFunctionErrorData | null>(null);

// No JSX:
<GSCErrorDialog 
  open={!!errorDialogData}
  onClose={() => setErrorDialogData(null)}
  data={errorDialogData}
  serviceAccountEmail={integration?.service_account_email}
/>
```

---

### Arquivos a Modificar/Criar

| Arquivo | Ação |
|---------|------|
| `src/utils/edgeFunctionError.ts` | **Criar** - utilitário de extração |
| `src/components/gsc/GSCErrorDialog.tsx` | **Criar** - dialog de erro detalhado |
| `src/components/gsc/GSCSitemapsManager.tsx` | **Modificar** - usar novo sistema |

---

### Resultado Esperado

Quando o erro 403 ocorrer, o usuário verá um dialog modal com:

```
⚠️ Permissões Insuficientes no Google Search Console

A Service Account não tem permissões para acessar esta propriedade.

Como resolver:
1. Acesse Google Search Console
2. Selecione sua propriedade
3. Vá em Configurações > Usuários e permissões
4. Clique em "ADICIONAR USUÁRIO"
5. Cole o email: [copiar] leandro@leandro-478602.iam.gserviceaccount.com
6. Selecione permissão "PROPRIETÁRIO"
7. Aguarde 2-3 minutos
8. Tente novamente

[Fechar]
```

---

### Detalhes Técnicos

**Por que o erro vem em `response.data`:**

O Supabase SDK trata erros HTTP assim:
- Status 4xx/5xx → cria `FunctionsHttpError` em `response.error`
- Corpo da resposta → disponível em `response.data`

A Edge Function retorna o JSON correto, mas o frontend precisa ler `response.data` mesmo quando há erro.

**Padrão de uso futuro:**

Este mesmo padrão pode ser aplicado a outras Edge Functions que retornam erros detalhados (submit-sitemap, delete-sitemap, etc).
