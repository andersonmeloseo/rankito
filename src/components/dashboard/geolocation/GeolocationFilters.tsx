import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface GeolocationFiltersProps {
  userId: string;
  filters: {
    period: string;
    siteId: string;
    eventType: string;
  };
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
}

export const GeolocationFilters = ({
  userId,
  filters,
  onFilterChange,
  onClearFilters,
}: GeolocationFiltersProps) => {
  const { data: sites } = useQuery({
    queryKey: ['user-sites', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rank_rent_sites')
        .select('id, site_name')
        .eq('owner_user_id', userId)
        .order('site_name');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });

  const hasActiveFilters = filters.period !== '30' || filters.siteId !== 'all' || filters.eventType !== 'all';

  return (
    <div className="flex flex-wrap gap-4 items-center">
      <div className="flex-1 min-w-[200px]">
        <Select value={filters.period} onValueChange={(value) => onFilterChange('period', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
            <SelectItem value="all">Todo período</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 min-w-[200px]">
        <Select value={filters.siteId} onValueChange={(value) => onFilterChange('siteId', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Todos os projetos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os projetos</SelectItem>
            {sites?.map((site) => (
              <SelectItem key={site.id} value={site.id}>
                {site.site_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 min-w-[200px]">
        <Select value={filters.eventType} onValueChange={(value) => onFilterChange('eventType', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Tipo de conversão" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas conversões</SelectItem>
            <SelectItem value="whatsapp_click">WhatsApp</SelectItem>
            <SelectItem value="phone_click">Telefone</SelectItem>
            <SelectItem value="email_click">Email</SelectItem>
            <SelectItem value="form_submit">Formulário</SelectItem>
            <SelectItem value="button_click">Botão</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <Button variant="outline" size="sm" onClick={onClearFilters}>
          <X className="h-4 w-4 mr-2" />
          Limpar Filtros
        </Button>
      )}
    </div>
  );
};
