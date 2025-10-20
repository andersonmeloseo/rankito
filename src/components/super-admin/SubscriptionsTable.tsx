import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";
import { formatCurrency } from "@/lib/utils";
import { format, differenceInDays } from "date-fns";
import { Plus, Search } from "lucide-react";
import { CreateSubscriptionDialog } from "./CreateSubscriptionDialog";
import { EditSubscriptionDialog } from "./EditSubscriptionDialog";
import { ExtendSubscriptionDialog } from "./ExtendSubscriptionDialog";
import { PauseSubscriptionDialog } from "./PauseSubscriptionDialog";
import { SubscriptionDetailsDialog } from "./SubscriptionDetailsDialog";
import { SubscriptionHistoryDialog } from "./SubscriptionHistoryDialog";
import { SubscriptionActionsMenu } from "./SubscriptionActionsMenu";
import { SubscriptionUsageProgress } from "./SubscriptionUsageProgress";
import { SubscriptionAlerts } from "./SubscriptionAlerts";

export const SubscriptionsTable = () => {
  const { subscriptions, isLoading, updateSubscription } = useSubscriptions();
  const { plans } = useSubscriptionPlans();
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<any>(null);
  const [extendingSubscription, setExtendingSubscription] = useState<any>(null);
  const [pausingSubscription, setPausingSubscription] = useState<any>(null);
  const [detailsSubscription, setDetailsSubscription] = useState<any>(null);
  const [historySubscriptionId, setHistorySubscriptionId] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [expiryFilter, setExpiryFilter] = useState("all");

  const renderStatusBadge = (status: string) => {
    const statusConfig = {
      trial: { label: "Trial", class: "bg-blue-100 text-blue-800" },
      active: { label: "Ativa", class: "bg-green-100 text-green-800" },
      past_due: { label: "Atrasada", class: "bg-orange-100 text-orange-800" },
      canceled: { label: "Cancelada", class: "bg-gray-100 text-gray-800" },
      expired: { label: "Expirada", class: "bg-red-100 text-red-800" },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    return <Badge className={config.class}>{config.label}</Badge>;
  };

  const getDaysRemainingBadge = (endDate: string) => {
    const days = differenceInDays(new Date(endDate), new Date());
    if (days < 0) return <Badge variant="destructive">Expirada</Badge>;
    const variant = days < 7 ? "destructive" : days < 30 ? "secondary" : "default";
    return <Badge variant={variant}>{days} dias</Badge>;
  };

  const handleCancel = (id: string) => {
    updateSubscription({ id, updates: { status: 'canceled', canceled_at: new Date().toISOString() } });
  };

  const handleReactivate = (id: string) => {
    updateSubscription({ id, updates: { status: 'active', canceled_at: null } });
  };

  const handleResume = (id: string) => {
    updateSubscription({ id, updates: { status: 'active', paused_at: null, paused_reason: null } });
  };

  const filteredSubscriptions = subscriptions?.filter((sub) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      sub.profiles?.email?.toLowerCase().includes(searchLower) ||
      sub.profiles?.full_name?.toLowerCase().includes(searchLower);
    const matchesStatus = statusFilter === "all" || sub.status === statusFilter;
    const matchesPlan = planFilter === "all" || sub.plan_id === planFilter;
    
    let matchesExpiry = true;
    if (expiryFilter !== "all") {
      const days = differenceInDays(new Date(sub.current_period_end), new Date());
      if (expiryFilter === "expired") matchesExpiry = days < 0;
      else if (expiryFilter === "7days") matchesExpiry = days >= 0 && days <= 7;
      else if (expiryFilter === "30days") matchesExpiry = days >= 0 && days <= 30;
    }
    return matchesSearch && matchesStatus && matchesPlan && matchesExpiry;
  }) || [];

  if (isLoading) {
    return <div className="text-muted-foreground">Carregando assinaturas...</div>;
  }

  return (
    <>
      <SubscriptionAlerts
        onFilterExpiring={() => setExpiryFilter("7days")}
        onFilterExpired={() => setStatusFilter("expired")}
      />
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Assinaturas</CardTitle>
              <CardDescription>Gerencie todas as assinaturas dos usuários</CardDescription>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />Nova Assinatura
            </Button>
          </div>
          <div className="flex gap-2 flex-wrap mt-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativa</SelectItem>
                <SelectItem value="expired">Expirada</SelectItem>
              </SelectContent>
            </Select>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Plano" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {plans?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Uso</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Restante</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubscriptions.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell>
                    <div><p className="font-medium">{sub.profiles?.full_name || "Sem nome"}</p>
                    <p className="text-sm text-muted-foreground">{sub.profiles?.email}</p></div>
                  </TableCell>
                  <TableCell>{sub.subscription_plans?.name}</TableCell>
                  <TableCell>{renderStatusBadge(sub.status)}</TableCell>
                  <TableCell>
                    <SubscriptionUsageProgress userId={sub.user_id} maxSites={sub.subscription_plans?.max_sites || null} maxPages={sub.subscription_plans?.max_pages_per_site || null} />
                  </TableCell>
                  <TableCell>{formatCurrency(sub.subscription_plans?.price || 0)}</TableCell>
                  <TableCell>{format(new Date(sub.current_period_end), "dd/MM/yyyy")}</TableCell>
                  <TableCell>{getDaysRemainingBadge(sub.current_period_end)}</TableCell>
                  <TableCell className="text-right">
                    <SubscriptionActionsMenu subscription={sub} onEdit={() => setEditingSubscription(sub)} onViewDetails={() => setDetailsSubscription(sub)} onExtend={() => setExtendingSubscription(sub)} onPause={() => setPausingSubscription(sub)} onResume={() => handleResume(sub.id)} onCancel={() => handleCancel(sub.id)} onReactivate={() => handleReactivate(sub.id)} onViewHistory={() => setHistorySubscriptionId(sub.id)} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <CreateSubscriptionDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      <EditSubscriptionDialog subscription={editingSubscription} open={!!editingSubscription} onOpenChange={(open) => !open && setEditingSubscription(null)} />
      <ExtendSubscriptionDialog subscription={extendingSubscription} open={!!extendingSubscription} onOpenChange={(open) => !open && setExtendingSubscription(null)} />
      <PauseSubscriptionDialog subscription={pausingSubscription} open={!!pausingSubscription} onOpenChange={(open) => !open && setPausingSubscription(null)} />
      <SubscriptionDetailsDialog subscription={detailsSubscription} open={!!detailsSubscription} onOpenChange={(open) => !open && setDetailsSubscription(null)} />
      <SubscriptionHistoryDialog subscriptionId={historySubscriptionId} open={!!historySubscriptionId} onOpenChange={(open) => !open && setHistorySubscriptionId(null)} />
    </>
  );
};
