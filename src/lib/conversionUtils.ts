// Eventos que NÃO devem ser contabilizados como conversões
export const NON_CONVERSION_EVENTS = ['page_view', 'page_exit'] as const;

// Helper function para verificar se é conversão
export const isConversionEvent = (eventType: string): boolean => {
  return !NON_CONVERSION_EVENTS.includes(eventType as any);
};

// Helper function para filtrar apenas conversões
export const filterConversions = <T extends { event_type: string }>(events: T[]): T[] => {
  return events.filter(e => isConversionEvent(e.event_type));
};
