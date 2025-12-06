export const generatePlanDescription = (limits: {
  max_sites: string | number | null;
  max_pages_per_site: string | number | null;
  max_gsc_integrations: string | number | null;
  trial_days: string | number;
  has_advanced_tracking?: boolean;
}): string => {
  const sites = limits.max_sites ? Number(limits.max_sites) : null;
  const pages = limits.max_pages_per_site ? Number(limits.max_pages_per_site) : null;
  const gsc = limits.max_gsc_integrations ? Number(limits.max_gsc_integrations) : null;
  const trial = Number(limits.trial_days);
  const advancedTracking = limits.has_advanced_tracking ?? false;

  // Construir lista de entregáveis
  const deliverables: string[] = [];

  // Sites
  if (sites === null) {
    deliverables.push("sites ilimitados");
  } else if (sites === 1) {
    deliverables.push("1 site");
  } else {
    deliverables.push(`até ${sites} sites`);
  }

  // Páginas por site
  if (pages === null) {
    deliverables.push("páginas ilimitadas por site");
  } else if (pages === 1) {
    deliverables.push("1 página por site");
  } else {
    deliverables.push(`até ${pages} páginas por site`);
  }

  // Integrações GSC
  if (gsc === null) {
    deliverables.push("integrações GSC ilimitadas");
  } else if (gsc === 0) {
    deliverables.push("sem integrações GSC");
  } else if (gsc === 1) {
    deliverables.push("1 integração Google Search Console");
  } else {
    deliverables.push(`até ${gsc} integrações Google Search Console`);
  }

  // Tracking Avançado
  if (advancedTracking) {
    deliverables.push("Tracking Avançado (Metas, Google Ads, Meta CAPI)");
  }

  // Trial
  if (trial > 0) {
    deliverables.push(`${trial} dias de trial gratuito`);
  }

  // Montar descrição final
  const baseText = "Inclui";
  const deliverablesList = deliverables.join(", ");
  
  return `${baseText} ${deliverablesList}.`;
};
