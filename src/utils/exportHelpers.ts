import * as XLSX from "xlsx";

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
