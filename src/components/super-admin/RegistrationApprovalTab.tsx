import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Eye, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useRole } from "@/contexts/RoleContext";

interface PendingUser {
  id: string;
  full_name: string;
  email: string;
  whatsapp: string | null;
  website: string | null;
  selected_plan_slug: string | null;
  created_at: string;
  is_active: boolean;
  rejection_reason: string | null;
}

export const RegistrationApprovalTab = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useRole();
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // Buscar usuários pendentes
  const { data: pendingUsers, isLoading } = useQuery({
    queryKey: ['pending-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, whatsapp, website, created_at, is_active')
        .eq('is_active', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Mapear dados com campos adicionais via cast
      return (data || []).map(profile => ({
        ...profile,
        selected_plan_slug: (profile as any).selected_plan_slug || null,
        rejection_reason: (profile as any).rejection_reason || null,
      })) as PendingUser[];
    },
  });

  // Aprovar usuário
  const approveMutation = useMutation({
    mutationFn: async (userId: string) => {
      const profile = pendingUsers?.find(u => u.id === userId);
      
      // 1. Ativar conta
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          is_active: true,
          approved_at: new Date().toISOString(),
          approved_by: currentUser?.id,
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      // 2. Criar subscription se plano foi selecionado
      if (profile?.selected_plan_slug) {
        // Buscar plano
        const { data: plan, error: planError } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('slug', profile.selected_plan_slug)
          .single();

        if (planError) throw planError;

        if (plan) {
          const trialEndDate = new Date();
          trialEndDate.setDate(trialEndDate.getDate() + plan.trial_days);

          const { error: subError } = await supabase
            .from('user_subscriptions')
            .insert({
              user_id: userId,
              plan_id: plan.id,
              status: plan.trial_days > 0 ? 'trial' : 'active',
              current_period_start: new Date().toISOString().split('T')[0],
              current_period_end: trialEndDate.toISOString().split('T')[0],
              trial_end_date: plan.trial_days > 0 ? trialEndDate.toISOString().split('T')[0] : null,
            });

          if (subError) throw subError;
        }
      }

      // 3. Criar notificação
      const { error: notifError } = await supabase
        .from('user_notifications')
        .insert({
          user_id: userId,
          type: 'account_approved',
          title: 'Conta Aprovada!',
          message: 'Sua conta foi aprovada pela nossa equipe. Você já pode fazer login e começar a usar o Rankito CRM.',
        });

      if (notifError) throw notifError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-users'] });
      toast({
        title: "Usuário aprovado",
        description: "A conta foi ativada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao aprovar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Rejeitar usuário
  const rejectMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      // Atualizar profile com motivo da rejeição (usando any para contornar type check temporariamente)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          rejection_reason: reason,
        } as any)
        .eq('id', userId);

      if (profileError) throw profileError;

      // Criar notificação
      const { error: notifError } = await supabase
        .from('user_notifications')
        .insert({
          user_id: userId,
          type: 'account_rejected',
          title: 'Cadastro não aprovado',
          message: `Infelizmente seu cadastro não foi aprovado. Motivo: ${reason}`,
        });

      if (notifError) throw notifError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-users'] });
      setIsRejectDialogOpen(false);
      setRejectionReason("");
      toast({
        title: "Usuário rejeitado",
        description: "O usuário foi notificado sobre a rejeição.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao rejeitar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Card className="shadow-card hover:shadow-lg transition-all duration-200">
        <CardHeader>
          <CardTitle>Aprovação de Cadastros</CardTitle>
          <CardDescription>
            Gerencie solicitações de cadastro aguardando aprovação
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!pendingUsers || pendingUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum cadastro pendente de aprovação
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-muted/50">
                  <TableHead className="h-12">Nome</TableHead>
                  <TableHead className="h-12">Email</TableHead>
                  <TableHead className="h-12">WhatsApp</TableHead>
                  <TableHead className="h-12">Plano</TableHead>
                  <TableHead className="h-12">Data</TableHead>
                  <TableHead className="h-12 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingUsers.map((user) => (
                  <TableRow key={user.id} className="h-16">
                    <TableCell className="p-4 font-medium">{user.full_name}</TableCell>
                    <TableCell className="p-4">{user.email}</TableCell>
                    <TableCell className="p-4">{user.whatsapp || '-'}</TableCell>
                    <TableCell className="p-4">
                      {user.selected_plan_slug ? (
                        <Badge variant="outline" className="capitalize">
                          {user.selected_plan_slug}
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="p-4">
                      {format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="p-4 text-right space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedUser(user)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => approveMutation.mutate(user.id)}
                        disabled={approveMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelectedUser(user);
                          setIsRejectDialogOpen(true);
                        }}
                        disabled={rejectMutation.isPending}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Rejeitar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Detalhes */}
      <Dialog open={!!selectedUser && !isRejectDialogOpen} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Cadastro</DialogTitle>
            <DialogDescription>
              Informações completas do usuário
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold">Nome Completo</Label>
                <p className="text-sm mt-1">{selectedUser.full_name}</p>
              </div>
              <div>
                <Label className="text-sm font-semibold">Email</Label>
                <p className="text-sm mt-1">{selectedUser.email}</p>
              </div>
              <div>
                <Label className="text-sm font-semibold">WhatsApp</Label>
                <p className="text-sm mt-1">{selectedUser.whatsapp || 'Não informado'}</p>
              </div>
              <div>
                <Label className="text-sm font-semibold">Website</Label>
                <p className="text-sm mt-1">{selectedUser.website || 'Não informado'}</p>
              </div>
              <div>
                <Label className="text-sm font-semibold">Plano Selecionado</Label>
                <p className="text-sm mt-1 capitalize">
                  {selectedUser.selected_plan_slug || 'Nenhum'}
                </p>
              </div>
              <div>
                <Label className="text-sm font-semibold">Data do Cadastro</Label>
                <p className="text-sm mt-1">
                  {format(new Date(selectedUser.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Rejeição */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Cadastro</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição para o usuário
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Motivo da Rejeição</Label>
              <Textarea
                placeholder="Ex: Dados incompletos, empresa não atende aos critérios..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="mt-2"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsRejectDialogOpen(false);
                  setRejectionReason("");
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (selectedUser && rejectionReason.trim()) {
                    rejectMutation.mutate({
                      userId: selectedUser.id,
                      reason: rejectionReason.trim(),
                    });
                  } else {
                    toast({
                      title: "Motivo obrigatório",
                      description: "Por favor, informe o motivo da rejeição.",
                      variant: "destructive",
                    });
                  }
                }}
                disabled={!rejectionReason.trim() || rejectMutation.isPending}
              >
                {rejectMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Rejeitando...
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Confirmar Rejeição
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
