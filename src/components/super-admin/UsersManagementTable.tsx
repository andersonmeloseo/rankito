import { useState, useEffect } from "react";
import { useSaasUsers } from "@/hooks/useSaasUsers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Eye, Lock, Unlock, Trash2, Edit, DollarSign, X } from "lucide-react";
import { UserDetailsDialog } from "./UserDetailsDialog";
import { BlockUserDialog } from "./BlockUserDialog";
import { EditUserDialog } from "./EditUserDialog";
import { DeleteUserDialog } from "./DeleteUserDialog";
import { BulkAssignPlanDialog } from "./BulkAssignPlanDialog";
import { ChangePlanDialog } from "./ChangePlanDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const UsersManagementTable = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkPlanDialogOpen, setBulkPlanDialogOpen] = useState(false);
  const [changePlanDialogOpen, setChangePlanDialogOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const { 
    users, 
    isLoading,
    refetch,
    blockUser, 
    unblockUser,
    deleteUser,
    deleteUsers,
    assignPlan,
    bulkAssignPlan,
    updateUser,
    updateUserEmail
  } = useSaasUsers({
    search,
    status: statusFilter === "all" ? undefined : statusFilter,
    plan: planFilter === "all" ? undefined : planFilter,
  });

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Debug logging
  useEffect(() => {
    if (users && users.length > 0) {
      console.log('🔍 UsersManagementTable - Dados dos usuários:', users);
      users.forEach((user: any) => {
        console.log(`📊 User ${user.email}:`, {
          id: user.id,
          user_subscriptions: user.user_subscriptions,
          subscription_plan: user.user_subscriptions?.[0]?.subscription_plans,
          plan_slug: user.user_subscriptions?.[0]?.subscription_plans?.slug,
        });
      });
    }
  }, [users]);

  const getStatusBadge = (user: any) => {
    const sub = user.user_subscriptions?.[0];
    
    if (!user.is_active) {
      return <Badge variant="destructive">Bloqueado</Badge>;
    }
    
    if (!sub) {
      return <Badge variant="secondary">Sem Assinatura</Badge>;
    }

    switch (sub.status) {
      case 'active':
        return <Badge variant="default">Ativo</Badge>;
      case 'trial':
        return <Badge variant="outline">Trial</Badge>;
      case 'past_due':
        return <Badge variant="destructive">Pagamento Atrasado</Badge>;
      case 'canceled':
        return <Badge variant="secondary">Cancelado</Badge>;
      case 'expired':
        return <Badge variant="secondary">Expirado</Badge>;
      default:
        return <Badge variant="secondary">{sub.status}</Badge>;
    }
  };

  const getPlanName = (user: any) => {
    const sub = user.user_subscriptions?.[0];
    return sub?.subscription_plans?.name || '-';
  };

  const getPlanBadgeVariant = (planSlug?: string) => {
    if (!planSlug) return "secondary";
    switch (planSlug) {
      case 'free': return "secondary";
      case 'enterprise': return "default";
      default: return "outline";
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUserIds(users?.map((u: any) => u.id) || []);
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUserIds([...selectedUserIds, userId]);
    } else {
      setSelectedUserIds(selectedUserIds.filter(id => id !== userId));
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Tem certeza que deseja excluir ${selectedUserIds.length} usuários?`)) {
      return;
    }
    deleteUsers(selectedUserIds);
    setSelectedUserIds([]);
  };

  const handleEdit = async (updates: any) => {
    if (!selectedUser) return;

    // Update profile
    const profileUpdates: any = {
      full_name: updates.full_name,
      whatsapp: updates.whatsapp,
      company: updates.company,
      website: updates.website,
      country_code: updates.country_code,
      is_active: updates.is_active,
    };

    updateUser({ userId: selectedUser.id, updates: profileUpdates });

    // Update email if changed
    if (updates.email && updates.email !== selectedUser.email) {
      updateUserEmail({ userId: selectedUser.id, newEmail: updates.email });
    }

    // Update plan if changed
    if (updates.planId && updates.planId !== selectedUser.user_subscriptions?.[0]?.plan_id) {
      assignPlan({ userId: selectedUser.id, planId: updates.planId });
    }
  };

  const selectedUsers = users?.filter((u: any) => selectedUserIds.includes(u.id)) || [];

  if (isLoading) {
    return <div>Carregando usuários...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou WhatsApp..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="gap-2"
        >
          <Search className="h-4 w-4" />
          Atualizar
        </Button>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
            <SelectItem value="past_due">Atrasado</SelectItem>
            <SelectItem value="canceled">Cancelado</SelectItem>
          </SelectContent>
        </Select>

        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Plano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="Starter">Starter</SelectItem>
            <SelectItem value="Professional">Professional</SelectItem>
            <SelectItem value="Enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions Bar */}
      {selectedUserIds.length > 0 && (
        <div className="bg-primary/10 p-4 rounded-lg flex items-center justify-between">
          <span className="font-medium">
            {selectedUserIds.length} usuário{selectedUserIds.length !== 1 ? 's' : ''} selecionado{selectedUserIds.length !== 1 ? 's' : ''}
          </span>
          <div className="flex gap-2">
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
            <Button size="sm" onClick={() => setBulkPlanDialogOpen(true)}>
              <DollarSign className="h-4 w-4 mr-2" />
              Atribuir Plano
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSelectedUserIds([])}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={users && users.length > 0 && selectedUserIds.length === users.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead>Site</TableHead>
              <TableHead>País</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Cadastro</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users && users.length > 0 ? (
              users.map((user: any) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedUserIds.includes(user.id)}
                      onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{user.full_name || '-'}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.whatsapp || '-'}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {user.website ? (
                      <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {user.website}
                      </a>
                    ) : '-'}
                  </TableCell>
                  <TableCell>{user.country_code || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={getPlanBadgeVariant(user.user_subscriptions?.[0]?.subscription_plans?.slug)}>
                        {getPlanName(user)}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setChangePlanDialogOpen(true);
                        }}
                        className="h-7 w-7 p-0"
                      >
                        <DollarSign className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(user)}</TableCell>
                  <TableCell>
                    {user.created_at ? format(new Date(user.created_at), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedUser(user);
                          setDetailsOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedUser(user);
                          setEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {user.is_active ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedUser(user);
                            setBlockDialogOpen(true);
                          }}
                        >
                          <Lock className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => unblockUser(user.id)}
                        >
                          <Unlock className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedUser(user);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground">
                  Nenhum usuário encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialogs */}
      <UserDetailsDialog
        user={selectedUser}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />

      <EditUserDialog
        user={selectedUser}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleEdit}
      />

      <BlockUserDialog
        user={selectedUser}
        open={blockDialogOpen}
        onOpenChange={setBlockDialogOpen}
        onConfirm={(reason) => {
          if (selectedUser) {
            blockUser({ userId: selectedUser.id, reason });
            setBlockDialogOpen(false);
          }
        }}
      />

      <DeleteUserDialog
        user={selectedUser}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={(reason) => {
          if (selectedUser) {
            deleteUser(selectedUser.id);
            setDeleteDialogOpen(false);
          }
        }}
      />

      <BulkAssignPlanDialog
        users={selectedUsers}
        open={bulkPlanDialogOpen}
        onOpenChange={setBulkPlanDialogOpen}
        onConfirm={(planId) => {
          bulkAssignPlan({ userIds: selectedUserIds, planId });
          setBulkPlanDialogOpen(false);
          setSelectedUserIds([]);
        }}
      />

      <ChangePlanDialog
        user={selectedUser}
        open={changePlanDialogOpen}
        onOpenChange={setChangePlanDialogOpen}
      />
    </div>
  );
};
