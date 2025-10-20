import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, X } from "lucide-react";

interface AdvancedFiltersProps {
  sites: Array<{ id: string; site_name: string }>;
  onFiltersChange: (filters: FilterState) => void;
}

export interface FilterState {
  siteId?: string;
  pageId?: string;
  eventType?: string;
  device?: string;
  timeRange?: string;
}

export const AdvancedFilters = ({ sites, onFiltersChange }: AdvancedFiltersProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<FilterState>({});

  const activeFiltersCount = Object.values(filters).filter(v => v).length;

  const updateFilter = (key: keyof FilterState, value: string | undefined) => {
    const newFilters = { ...filters, [key]: value || undefined };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    setFilters({});
    onFiltersChange({});
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros Avançados
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
            >
              <X className="w-4 h-4 mr-2" />
              Limpar
            </Button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 animate-fade-in">
          {/* Site */}
          <div>
            <label className="text-sm font-medium mb-2 block">Site</label>
            <Select
              value={filters.siteId || 'all'}
              onValueChange={(v) => updateFilter('siteId', v === 'all' ? undefined : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os sites" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os sites</SelectItem>
                {sites.map((site) => (
                  <SelectItem key={site.id} value={site.id}>
                    {site.site_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de Conversão */}
          <div>
            <label className="text-sm font-medium mb-2 block">Tipo de Conversão</label>
            <Select
              value={filters.eventType || 'all'}
              onValueChange={(v) => updateFilter('eventType', v === 'all' ? undefined : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="phone_click">Telefone</SelectItem>
                <SelectItem value="whatsapp_click">WhatsApp</SelectItem>
                <SelectItem value="email_click">Email</SelectItem>
                <SelectItem value="form_submit">Formulário</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dispositivo */}
          <div>
            <label className="text-sm font-medium mb-2 block">Dispositivo</label>
            <Select
              value={filters.device || 'all'}
              onValueChange={(v) => updateFilter('device', v === 'all' ? undefined : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="mobile">Mobile</SelectItem>
                <SelectItem value="desktop">Desktop</SelectItem>
                <SelectItem value="tablet">Tablet</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Horário */}
          <div>
            <label className="text-sm font-medium mb-2 block">Horário do Dia</label>
            <Select
              value={filters.timeRange || 'all'}
              onValueChange={(v) => updateFilter('timeRange', v === 'all' ? undefined : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="morning">Manhã (6h-12h)</SelectItem>
                <SelectItem value="afternoon">Tarde (12h-18h)</SelectItem>
                <SelectItem value="evening">Noite (18h-24h)</SelectItem>
                <SelectItem value="night">Madrugada (0h-6h)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && !isExpanded && (
        <div className="flex flex-wrap gap-2 mt-3">
          {filters.siteId && (
            <Badge variant="secondary">
              Site: {sites.find(s => s.id === filters.siteId)?.site_name}
              <X
                className="w-3 h-3 ml-1 cursor-pointer"
                onClick={() => updateFilter('siteId', undefined)}
              />
            </Badge>
          )}
          {filters.eventType && (
            <Badge variant="secondary">
              Tipo: {filters.eventType}
              <X
                className="w-3 h-3 ml-1 cursor-pointer"
                onClick={() => updateFilter('eventType', undefined)}
              />
            </Badge>
          )}
          {filters.device && (
            <Badge variant="secondary">
              Dispositivo: {filters.device}
              <X
                className="w-3 h-3 ml-1 cursor-pointer"
                onClick={() => updateFilter('device', undefined)}
              />
            </Badge>
          )}
          {filters.timeRange && (
            <Badge variant="secondary">
              Horário: {filters.timeRange}
              <X
                className="w-3 h-3 ml-1 cursor-pointer"
                onClick={() => updateFilter('timeRange', undefined)}
              />
            </Badge>
          )}
        </div>
      )}
    </Card>
  );
};
