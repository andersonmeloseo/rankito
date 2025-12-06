-- Fix get_detected_ctas function to better filter navigation/system CTAs
CREATE OR REPLACE FUNCTION public.get_detected_ctas(p_site_id uuid)
RETURNS TABLE(
  cta_text text,
  event_type text,
  click_count bigint,
  first_seen timestamptz,
  last_seen timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.cta_text,
    c.event_type::text,
    COUNT(*)::bigint as click_count,
    MIN(c.created_at) as first_seen,
    MAX(c.created_at) as last_seen
  FROM rank_rent_conversions c
  WHERE c.site_id = p_site_id
    AND c.cta_text IS NOT NULL
    AND c.cta_text != ''
    AND LENGTH(c.cta_text) > 1
    AND LENGTH(c.cta_text) < 200
    -- Exclude common navigation/system CTAs (case insensitive)
    AND LOWER(TRIM(c.cta_text)) NOT IN (
      'menu', 'próximo', 'anterior', 'next', 'previous', 'back', 'voltar',
      'accept all', 'accept', 'aceitar', 'aceitar todos', 'aceitar tudo',
      'reject', 'rejeitar', 'decline', 'recusar',
      'close', 'fechar', 'x', '×', 'ok', 'cancel', 'cancelar',
      'submit', 'enviar', 'send', 'salvar', 'save',
      'search', 'buscar', 'pesquisar',
      'login', 'entrar', 'logout', 'sair', 'sign in', 'sign out', 'sign up',
      'register', 'registrar', 'cadastrar', 'cadastre-se',
      'home', 'início', 'inicio',
      'more', 'mais', 'less', 'menos', 'ver mais', 'ver menos', 'see more', 'see less',
      'read more', 'leia mais', 'saiba mais', 'learn more',
      'show', 'hide', 'mostrar', 'ocultar', 'exibir',
      'expand', 'collapse', 'expandir', 'recolher',
      'yes', 'no', 'sim', 'não', 'nao',
      'continue', 'continuar', 'prosseguir',
      'skip', 'pular', 'ignorar',
      'got it', 'entendi', 'understood', 'ok, entendi',
      'dismiss', 'dispensar',
      'allow', 'permitir', 'deny', 'negar',
      'cookies', 'cookie policy', 'política de cookies',
      'privacy', 'privacidade', 'terms', 'termos',
      'agree', 'concordar', 'concordo', 'i agree',
      'carrinho', 'cart', 'bag', 'sacola',
      'filtrar', 'filter', 'ordenar', 'sort',
      'adicionar', 'add', 'remover', 'remove', 'delete', 'excluir',
      'editar', 'edit', 'update', 'atualizar',
      'refresh', 'atualizar', 'reload', 'recarregar',
      'copy', 'copiar', 'paste', 'colar',
      'download', 'baixar', 'upload', 'enviar arquivo',
      'share', 'compartilhar',
      'like', 'curtir', 'dislike', 'unlike', 'descurtir',
      'follow', 'seguir', 'unfollow', 'deixar de seguir',
      'subscribe', 'inscrever', 'unsubscribe', 'desinscrever',
      'play', 'pause', 'stop', 'mute', 'unmute',
      'fullscreen', 'tela cheia',
      'zoom in', 'zoom out', 'zoom',
      'print', 'imprimir',
      'help', 'ajuda', 'suporte', 'support',
      'settings', 'configurações', 'config',
      'profile', 'perfil', 'account', 'conta',
      'notifications', 'notificações',
      'messages', 'mensagens', 'inbox', 'caixa de entrada'
    )
    -- Exclude patterns using regex (navigation elements, icons, single chars)
    AND c.cta_text !~* '^(menu|nav|header|footer|sidebar|cookie|modal|popup|banner|overlay|drawer|dropdown|tooltip|tab|panel|accordion|carousel|slider|pagination|breadcrumb|icon|btn|button)$'
    AND c.cta_text !~* '^\s*$'
    AND c.cta_text !~* '^[0-9]+$'
    AND c.cta_text !~* '^[\s\d\W]{1,3}$'
    -- Exclude CTAs that are just arrows or navigation symbols
    AND c.cta_text !~* '^[←→↑↓<>«»‹›]+$'
    AND c.cta_text !~* '^(prev|next|first|last|page)[\s\d]*$'
  GROUP BY c.cta_text, c.event_type
  HAVING COUNT(*) >= 1
  ORDER BY click_count DESC
  LIMIT 100;
END;
$$;