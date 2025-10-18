import { useState } from "react";
import { useSaasUsers } from "@/hooks/useSaasUsers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Eye, Lock, Unlock, Trash2 } from "lucide-react";
import { UserDetailsDialog } from "./UserDetailsDialog";
import { BlockUserDialog } from "./BlockUserDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const UsersManagementTable = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [planFilter, setPlanFilter] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userToBlock, setUserToBlock] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);

  const { users, isLoading, blockUser, unblockUser } = useSaasUsers({
    search,
    status: statusFilter || undefined,
    plan: planFilter || undefined,
  });

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
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
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
            <SelectItem value="">Todos</SelectItem>
            <SelectItem value="Starter">Starter</SelectItem>
            <SelectItem value="Professional">Professional</SelectItem>
            <SelectItem value="Enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead>Site</TableHead>
              <TableHead>País</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Cadastro</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users && users.length > 0 ? (
              users.map((user: any) => (
                <TableRow key={user.id}>
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
                  <TableCell>{getPlanName(user)}</TableCell>
                  <TableCell>{getStatusBadge(user)}</TableCell>
                  <TableCell>
                    {user.created_at ? format(new Date(user.created_at), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
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
                      
                      {user.is_active ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setUserToBlock(user);
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
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
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

      <BlockUserDialog
        user={userToBlock}
        open={blockDialogOpen}
        onOpenChange={setBlockDialogOpen}
        onConfirm={(reason) => {
          if (userToBlock) {
            blockUser({ userId: userToBlock.id, reason });
            setBlockDialogOpen(false);
          }
        }}
      />
    </div>
  );
};
