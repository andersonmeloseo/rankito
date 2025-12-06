import * as XLSX from "xlsx";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SiteExportData {
  site_name: string;
  site_url: string;
  client_name?: string;
  monthly_rent_value: number;
  is_rented: boolean;
  contract_start_date?: string;
  contract_end_date?: string;
  total_pages: number;
  total_page_views: number;
  total_conversions: number;
  conversion_rate: number;
  niche?: string;
  location?: string;
}

export const exportSitesToExcel = (sites: SiteExportData[]) => {
  const exportData = sites.map(site => ({
    "Nome do Projeto": site.site_name,
    "URL": site.site_url,
    "Cliente": site.client_name || "-",
    "Valor Mensal (R$)": site.monthly_rent_value.toFixed(2),
    "Status": site.is_rented ? "Alugado" : "Disponível",
    "Início Contrato": site.contract_start_date || "-",
    "Fim Contrato": site.contract_end_date || "-",
    "Total Páginas": site.total_pages,
    "Page Views": site.total_page_views,
    "Conversões": site.total_conversions,
    "Taxa Conversão (%)": site.conversion_rate,
    "Nicho": site.niche || "-",
    "Localização": site.location || "-",
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  
  // Ajustar largura das colunas
  const colWidths = [
    { wch: 25 }, // Nome do Projeto
    { wch: 35 }, // URL
    { wch: 20 }, // Cliente
    { wch: 15 }, // Valor Mensal
    { wch: 12 }, // Status
    { wch: 15 }, // Início Contrato
    { wch: 15 }, // Fim Contrato
    { wch: 12 }, // Total Páginas
    { wch: 12 }, // Page Views
    { wch: 12 }, // Conversões
    { wch: 15 }, // Taxa Conversão
    { wch: 20 }, // Nicho
    { wch: 20 }, // Localização
  ];
  worksheet["!cols"] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Projetos");
  
  const fileName = `projetos_rankito_${new Date().toISOString().split("T")[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

// Types for conversion export
interface ConversionExportData {
  id: string;
  goal_name: string | null;
  event_type: string;
  cta_text: string | null;
  conversion_value: number | null;
  page_url: string;
  created_at: string;
  session_id: string | null;
  // Enriched data
  device?: string;
  city?: string;
  country?: string;
  referrer?: string;
  journey_pages?: string;
  total_duration_seconds?: number;
}

const getEventTypeLabel = (eventType: string): string => {
  const labels: Record<string, string> = {
    whatsapp_click: "WhatsApp",
    phone_click: "Telefone",
    email_click: "E-mail",
    form_submit: "Formulário",
    button_click: "Botão",
    purchase: "Compra",
    add_to_cart: "Carrinho",
    begin_checkout: "Checkout",
  };
  return labels[eventType] || eventType;
};

export const exportConversionsToExcel = (conversions: ConversionExportData[], siteName?: string) => {
  const exportData = conversions.map(conv => ({
    "Data/Hora": format(new Date(conv.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR }),
    "Meta": conv.goal_name || "-",
    "Tipo": getEventTypeLabel(conv.event_type),
    "CTA Clicado": conv.cta_text || "-",
    "Valor (R$)": conv.conversion_value?.toFixed(2) || "0.00",
    "Página da Conversão": conv.page_url,
    "Jornada": conv.journey_pages || "-",
    "Dispositivo": conv.device || "-",
    "Cidade": conv.city || "-",
    "País": conv.country || "-",
    "Origem": conv.referrer || "Direto",
    "Duração (s)": conv.total_duration_seconds ?? "-",
    "Session ID": conv.session_id || "-",
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  
  // Ajustar largura das colunas
  const colWidths = [
    { wch: 18 }, // Data/Hora
    { wch: 20 }, // Meta
    { wch: 12 }, // Tipo
    { wch: 30 }, // CTA Clicado
    { wch: 12 }, // Valor
    { wch: 50 }, // Página da Conversão
    { wch: 60 }, // Jornada
    { wch: 12 }, // Dispositivo
    { wch: 15 }, // Cidade
    { wch: 12 }, // País
    { wch: 20 }, // Origem
    { wch: 12 }, // Duração
    { wch: 36 }, // Session ID
  ];
  worksheet["!cols"] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Conversões");
  
  const dateStr = new Date().toISOString().split("T")[0];
  const fileName = siteName 
    ? `conversoes_${siteName.replace(/[^a-zA-Z0-9]/g, '_')}_${dateStr}.xlsx`
    : `conversoes_${dateStr}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};
