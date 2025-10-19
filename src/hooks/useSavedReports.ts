import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ReportData } from './useReportData';
import { ReportStyle } from '@/components/reports/ReportStyleConfigurator';
import { Currency, ReportLocale } from '@/i18n/reportTranslations';

export interface FinancialConfig {
  costPerConversion: number;
  currency: Currency;
  locale: ReportLocale;
}

export interface SavedReport {
  id: string;
  user_id: string;
  site_id: string;
  report_name: string;
  report_data: ReportData;
  style: ReportStyle;
  financial_config: FinancialConfig;
  created_at: string;
  updated_at: string;
}

export const useSavedReports = () => {
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const saveReport = async (
    siteId: string,
    reportName: string,
    reportData: ReportData,
    style: ReportStyle,
    financialConfig: FinancialConfig
  ) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('saved_reports')
        .insert([{
          user_id: user.id,
          site_id: siteId,
          report_name: reportName,
          report_data: reportData as any,
          style: style as any,
          financial_config: financialConfig as any
        }] as any)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Relatório salvo!",
        description: "O relatório foi salvo com sucesso.",
      });

      return data;
    } catch (error: any) {
      console.error('Error saving report:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const listReports = async (siteId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('saved_reports')
        .select('*')
        .eq('site_id', siteId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSavedReports(data as any as SavedReport[]);
      return data as any as SavedReport[];
    } catch (error: any) {
      console.error('Error listing reports:', error);
      toast({
        title: "Erro ao carregar",
        description: error.message,
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const deleteReport = async (reportId: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('saved_reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;

      toast({
        title: "Relatório excluído!",
        description: "O relatório foi removido com sucesso.",
      });

      setSavedReports(prev => prev.filter(r => r.id !== reportId));
    } catch (error: any) {
      console.error('Error deleting report:', error);
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loadReport = (report: SavedReport) => {
    return {
      reportName: report.report_name,
      reportData: report.report_data,
      style: report.style,
      financialConfig: report.financial_config
    };
  };

  return {
    savedReports,
    loading,
    saveReport,
    listReports,
    deleteReport,
    loadReport
  };
};
