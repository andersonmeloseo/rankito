import * as XLSX from "xlsx";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const actionLabels: Record<string, string> = {
  user_created: "Usuário Criado",
  user_approved: "Cadastro Aprovado",
  user_rejected: "Cadastro Rejeitado",
  user_blocked: "Usuário Bloqueado",
  user_unblocked: "Usuário Desbloqueado",
  user_deleted: "Usuário Excluído",
  user_updated: "Usuário Atualizado",
  email_updated: "Email Atualizado",
  password_reset: "Senha Resetada",
  plan_assigned: "Plano Atribuído",
  plan_changed: "Plano Alterado",
  bulk_plan_assigned: "Planos Atribuídos em Lote",
};

export const exportAuditLogsToExcel = (logs: any[], filters?: {
  startDate?: string;
  endDate?: string;
  action?: string;
}) => {
  const exportData = logs.map(log => ({
    "Data/Hora": format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR }),
    "Admin": log.admin?.full_name || "N/A",
    "Email Admin": log.admin?.email || "N/A",
    "Ação": actionLabels[log.action] || log.action,
    "Usuário Alvo": log.target?.full_name || "-",
    "Email Alvo": log.target?.email || "-",
    "IP": log.ip_address || "-",
    "Detalhes": log.details ? JSON.stringify(log.details, null, 2) : "-",
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  
  const colWidths = [
    { wch: 20 },
    { wch: 25 },
    { wch: 30 },
    { wch: 25 },
    { wch: 25 },
    { wch: 30 },
    { wch: 15 },
    { wch: 50 },
  ];
  worksheet["!cols"] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Audit Logs");
  
  const dateStr = format(new Date(), "yyyy-MM-dd_HHmmss");
  let fileName = `audit_logs_${dateStr}`;
  
  if (filters?.startDate || filters?.endDate) {
    fileName += `_${filters.startDate || 'inicio'}_a_${filters.endDate || 'fim'}`;
  }
  
  if (filters?.action && filters.action !== 'all') {
    fileName += `_${filters.action}`;
  }
  
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

export const exportAuditLogsToCSV = (logs: any[]) => {
  const csvData = logs.map(log => ({
    data_hora: format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR }),
    admin: log.admin?.full_name || "N/A",
    admin_email: log.admin?.email || "N/A",
    acao: actionLabels[log.action] || log.action,
    usuario_alvo: log.target?.full_name || "-",
    alvo_email: log.target?.email || "-",
    ip: log.ip_address || "-",
    detalhes: log.details ? JSON.stringify(log.details) : "-",
  }));

  const headers = Object.keys(csvData[0]).join(",");
  const rows = csvData.map(row => Object.values(row).map(v => `"${v}"`).join(","));
  const csv = [headers, ...rows].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `audit_logs_${format(new Date(), "yyyy-MM-dd_HHmmss")}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
