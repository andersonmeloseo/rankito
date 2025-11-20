import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, MoreVertical, Edit, TestTube, Power, PowerOff, Trash2, CheckCircle2, XCircle, AlertCircle, ArrowUpDown, Globe } from "lucide-react";
import { useGeolocationApis, GeolocationApi } from "@/hooks/useGeolocationApis";
import { AddEditGeolocationApiDialog } from "./AddEditGeolocationApiDialog";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const PROVIDER_LABELS = {
  ipgeolocation: 'IPGeolocation',
  ipapi: 'IP-API',
  ipstack: 'IPStack',
  ipinfo: 'IPInfo',
};

export const GeolocationApisManager = () => {
  const { apis, isLoading, updateApi, deleteApi, testApi, bulkUpdate, bulkDelete } = useGeolocationApis();
  
  const [page, setPage] = useState(1);
  const itemsPerPage = 50;
  
  const [filters, setFilters] = useState({
    provider: 'all',
    status: 'all',
    hasErrors: false,
    search: '',
  });
  
  const [sortBy, setSortBy] = useState<'priority' | 'usage_count' | 'last_used_at' | 'error_count'>('priority');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const [selectedApis, setSelectedApis] = useState<string[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingApi, setEditingApi] = useState<GeolocationApi | null>(null);
  
  // Filtrar e ordenar APIs
  const processedApis = useMemo(() => {
    let filtered = [...apis];
    
    // Filtros
    if (filters.provider !== 'all') {
      filtered = filtered.filter(api => api.provider_name === filters.provider);
    }
    if (filters.status !== 'all') {
      filtered = filtered.filter(api => filters.status === 'active' ? api.is_active : !api.is_active);
    }
    if (filters.hasErrors) {
      filtered = filtered.filter(api => api.error_count > 0);
    }
    if (filters.search) {
      filtered = filtered.filter(api => 
        api.display_name.toLowerCase().includes(filters.search.toLowerCase()) ||
        api.api_key.toLowerCase().includes(filters.search.toLowerCase())
      );
    }
    
    // Ordenar
    filtered.sort((a, b) => {
      const aVal = a[sortBy] || 0;
      const bVal = b[sortBy] || 0;
      return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });
    
    return filtered;
  }, [apis, filters, sortBy, sortOrder]);
  
  const paginatedApis = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return processedApis.slice(start, start + itemsPerPage);
  }, [processedApis, page]);
  
  const totalPages = Math.ceil(processedApis.length / itemsPerPage);
  
  // Estatísticas
  const stats = useMemo(() => {
    const activeApis = apis.filter(api => api.is_active).length;
    const todayRequests = apis.reduce((sum, api) => sum + api.usage_count, 0);
    const totalCapacity = apis.reduce((sum, api) => sum + (api.monthly_limit || 0), 0);
    const apisWithErrors = apis.filter(api => api.error_count > 0).length;
    
    const providerCounts = apis.reduce((acc, api) => {
      acc[api.provider_name] = (acc[api.provider_name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalApis: apis.length,
      activeApis,
      todayRequests,
      totalCapacity,
      apisWithErrors,
      providerCounts,
    };
  }, [apis]);
  
  const toggleSelect = (id: string) => {
    setSelectedApis(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };
  
  const toggleSelectAll = () => {
    if (selectedApis.length === paginatedApis.length) {
      setSelectedApis([]);
    } else {
      setSelectedApis(paginatedApis.map(api => api.id));
    }
  };
  
  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };
  
  const bulkActions = {
    activate: () => bulkUpdate({ ids: selectedApis, updates: { is_active: true } }),
    deactivate: () => bulkUpdate({ ids: selectedApis, updates: { is_active: false } }),
    resetCounters: () => bulkUpdate({ ids: selectedApis, updates: { usage_count: 0, error_count: 0 } }),
    delete: () => {
      if (confirm(`Deletar ${selectedApis.length} APIs selecionadas?`)) {
        bulkDelete(selectedApis);
        setSelectedApis([]);
      }
    },
  };
  
  if (isLoading) {
    return <div>Carregando...</div>;
  }
  
  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total de APIs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalApis}</p>
            <p className="text-xs text-muted-foreground">{stats.activeApis} ativas</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Uso Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.todayRequests.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">requisições</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Capacidade Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalCapacity.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">req/mês</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">APIs com Erros</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-destructive">{stats.apisWithErrors}</p>
            <p className="text-xs text-muted-foreground">requerem atenção</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Distribuição</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-xs">
              <p>IPGeo: {stats.providerCounts.ipgeolocation || 0}</p>
              <p>IP-API: {stats.providerCounts.ipapi || 0}</p>
              <p>IPStack: {stats.providerCounts.ipstack || 0}</p>
              <p>IPInfo: {stats.providerCounts.ipinfo || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Barra de Ferramentas */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Select value={filters.provider} onValueChange={(v) => setFilters({...filters, provider: v})}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Providers</SelectItem>
              {Object.entries(PROVIDER_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={filters.status} onValueChange={(v) => setFilters({...filters, status: v})}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="active">Ativas</SelectItem>
              <SelectItem value="inactive">Inativas</SelectItem>
            </SelectContent>
          </Select>
          
          <Input 
            placeholder="Buscar por nome ou key..." 
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
            className="w-[250px]"
          />
          
          {Object.values(filters).some(v => v !== 'all' && v !== '' && v !== false) && (
            <Button variant="ghost" size="sm" onClick={() => setFilters({provider: 'all', status: 'all', hasErrors: false, search: ''})}>
              Limpar Filtros
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {selectedApis.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Ações ({selectedApis.length})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={bulkActions.activate}>
                  <Power className="mr-2 h-4 w-4" /> Ativar Selecionadas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={bulkActions.deactivate}>
                  <PowerOff className="mr-2 h-4 w-4" /> Desativar Selecionadas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={bulkActions.resetCounters}>
                  <Globe className="mr-2 h-4 w-4" /> Resetar Contadores
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={bulkActions.delete} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Deletar Selecionadas
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar API
          </Button>
        </div>
      </div>
      
      {/* Tabela com Paginação */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox 
                  checked={selectedApis.length === paginatedApis.length && paginatedApis.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead onClick={() => handleSort('priority')} className="cursor-pointer">
                Prioridade <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>API Key</TableHead>
              <TableHead>Status</TableHead>
              <TableHead onClick={() => handleSort('usage_count')} className="cursor-pointer">
                Uso <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead onClick={() => handleSort('error_count')} className="cursor-pointer">
                Erros <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead onClick={() => handleSort('last_used_at')} className="cursor-pointer">
                Último Uso <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedApis.map((api) => (
              <TableRow key={api.id}>
                <TableCell>
                  <Checkbox 
                    checked={selectedApis.includes(api.id)}
                    onCheckedChange={() => toggleSelect(api.id)}
                  />
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{api.priority}</Badge>
                </TableCell>
                <TableCell>
                  <Badge>{PROVIDER_LABELS[api.provider_name]}</Badge>
                </TableCell>
                <TableCell className="font-medium">{api.display_name}</TableCell>
                <TableCell>
                  <code className="text-xs">***{api.api_key.slice(-8)}</code>
                </TableCell>
                <TableCell>
                  {api.is_active ? (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle2 className="mr-1 h-3 w-3" /> Ativa
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <XCircle className="mr-1 h-3 w-3" /> Inativa
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-xs">
                    <p className="font-medium">{api.usage_count.toLocaleString()}</p>
                    {api.monthly_limit && (
                      <p className="text-muted-foreground">
                        de {api.monthly_limit.toLocaleString()}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {api.error_count > 0 ? (
                    <Badge variant="destructive">
                      <AlertCircle className="mr-1 h-3 w-3" /> {api.error_count}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">Nenhum</span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {api.last_used_at ? formatDistanceToNow(new Date(api.last_used_at), { addSuffix: true, locale: ptBR }) : 'Nunca'}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingApi(api)}>
                        <Edit className="mr-2 h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateApi({ id: api.id, updates: { is_active: !api.is_active } })}>
                        <Power className="mr-2 h-4 w-4" /> 
                        {api.is_active ? 'Desativar' : 'Ativar'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => {
                        if (confirm(`Deletar API ${api.display_name}?`)) {
                          deleteApi(api.id);
                        }
                      }} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Deletar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        <div className="flex items-center justify-between p-4 border-t">
          <p className="text-sm text-muted-foreground">
            Mostrando {((page - 1) * itemsPerPage) + 1} a {Math.min(page * itemsPerPage, processedApis.length)} de {processedApis.length} APIs
          </p>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <span className="text-sm">Página {page} de {totalPages}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
            >
              Próxima
            </Button>
          </div>
        </div>
      </Card>
      
      <AddEditGeolocationApiDialog 
        open={showAddDialog || !!editingApi}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddDialog(false);
            setEditingApi(null);
          }
        }}
        api={editingApi}
      />
    </div>
  );
};
