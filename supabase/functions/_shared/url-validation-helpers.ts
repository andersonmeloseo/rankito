import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

interface ValidationResult {
  isValid: boolean;
  status: 'valid' | 'invalid_domain' | 'unreachable';
  error?: string;
}

/**
 * Valida se URL pertence ao domínio do site
 */
export function validateDomain(url: string, siteUrl: string): boolean {
  try {
    const urlDomain = new URL(url).hostname.replace('www.', '');
    const siteDomain = new URL(siteUrl).hostname.replace('www.', '');
    return urlDomain === siteDomain;
  } catch {
    return false;
  }
}

/**
 * Verifica se URL é acessível via HTTP HEAD request
 */
export async function checkUrlAccessibility(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Rankito CRM URL Validator/1.0'
      }
    });
    
    clearTimeout(timeoutId);
    return response.ok; // 200-299 status codes
  } catch (error) {
    console.error(`URL unreachable: ${url}`, error);
    return false;
  }
}

/**
 * Validação completa de URL (sem check de duplicata)
 */
export async function validateUrl(
  supabase: SupabaseClient,
  url: string,
  siteId: string,
  siteUrl: string
): Promise<ValidationResult> {
  // 1. Validar domínio
  if (!validateDomain(url, siteUrl)) {
    return {
      isValid: false,
      status: 'invalid_domain',
      error: `URL ${url} não pertence ao domínio ${siteUrl}`
    };
  }

  // 2. Verificar acessibilidade
  const isAccessible = await checkUrlAccessibility(url);
  if (!isAccessible) {
    return {
      isValid: false,
      status: 'unreachable',
      error: 'URL não está acessível (timeout ou status code != 2xx)'
    };
  }

  return {
    isValid: true,
    status: 'valid'
  };
}

/**
 * Validação batch de URLs
 */
export async function validateUrls(
  supabase: SupabaseClient,
  urls: string[],
  siteId: string,
  siteUrl: string
): Promise<Map<string, ValidationResult>> {
  const results = new Map<string, ValidationResult>();
  
  // Processar em paralelo com limite de concorrência
  const batchSize = 10;
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(url => validateUrl(supabase, url, siteId, siteUrl))
    );
    
    batch.forEach((url, index) => {
      results.set(url, batchResults[index]);
    });
  }
  
  return results;
}
