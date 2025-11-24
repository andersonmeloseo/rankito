/**
 * Extrai nome legível de uma URL
 */
export const formatPageName = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    if (pathname === '/' || pathname === '') return 'Home';
    
    // Remove trailing slash e pega o último segmento
    const segments = pathname.replace(/\/$/, '').split('/');
    const lastSegment = segments[segments.length - 1];
    
    // Converte kebab-case ou snake_case para Title Case
    return lastSegment
      .replace(/[-_]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  } catch {
    return url.split('/').pop() || 'Página';
  }
};

/**
 * Formata segundos em formato MM:SS
 */
export const formatDuration = (seconds: number): string => {
  if (!seconds || seconds === 0) return '0:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Calcula score de uma sequência baseado em comprimento, frequência e conversões
 */
export const calculateSequenceScore = (sequence: any): number => {
  const lengthScore = sequence.pageCount * 3;
  const frequencyScore = sequence.count * 1;
  const conversionBonus = sequence.sessionsWithClicks > 0 ? 50 : 0;
  return lengthScore + frequencyScore + conversionBonus;
};

/**
 * Retorna estilos para ranking de sequências
 */
export const getRankStyle = (rank: number) => {
  if (rank === 1) return {
    emoji: "🥇",
    badge: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-100",
    card: "border-yellow-300 bg-yellow-50/30 dark:border-yellow-700 dark:bg-yellow-950/30"
  };
  
  if (rank === 2) return {
    emoji: "🥈", 
    badge: "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-900 dark:text-slate-100",
    card: "border-slate-300 bg-slate-50/30 dark:border-slate-700 dark:bg-slate-950/30"
  };
  
  if (rank === 3) return {
    emoji: "🥉",
    badge: "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900 dark:text-orange-100", 
    card: "border-orange-300 bg-orange-50/30 dark:border-orange-700 dark:bg-orange-950/30"
  };
  
  return {
    emoji: `#${rank}`,
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
    card: ""
  };
};
