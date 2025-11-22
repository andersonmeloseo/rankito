import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsersManagementTable } from "./UsersManagementTable";
import { RegistrationApprovalTab } from "./RegistrationApprovalTab";
import { Users, UserCheck, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useRef } from "react";

export const UnifiedUsersTab = () => {
  const { toast } = useToast();
  const previousCountRef = useRef<number | null>(null);
  
  const { data: pendingCount } = useQuery({
    queryKey: ['pending-users-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', false);
      return count || 0;
    },
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (pendingCount !== undefined && previousCountRef.current !== null) {
      if (pendingCount > previousCountRef.current) {
        const newApprovals = pendingCount - previousCountRef.current;
        toast({
          title: "🔔 Novas Aprovações Pendentes",
          description: `${newApprovals} ${newApprovals === 1 ? 'nova solicitação' : 'novas solicitações'} de cadastro aguardando aprovação`,
          duration: 10000,
        });
        
        // Som de notificação
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjGJ0fPTgjMGHm7A7+OZSBAMUJ/j8LZjHAY4kdfyzHksBSR3x/DdkEAKFF606+uoVRQKRp/g8r5sIQYxidHz04IzBh5uwO/jmUgQDFCf4/C2YxwGOJHX8sx5LAUkd8fw3ZBAC');
        audio.volume = 0.3;
        audio.play().catch(() => {});
      }
    }
    previousCountRef.current = pendingCount || 0;
  }, [pendingCount, toast]);

  return (
    <Tabs defaultValue="all-users" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2 bg-muted">
        <TabsTrigger value="all-users" className="gap-2">
          <Users className="h-4 w-4" />
          Todos os Usuários
        </TabsTrigger>
        <TabsTrigger value="approvals" className="gap-2 relative">
          <UserCheck className="h-4 w-4" />
          Aprovações Pendentes
          {(pendingCount ?? 0) > 0 && (
            <>
              <Badge variant="destructive" className="ml-2 animate-pulse">
                {pendingCount}
              </Badge>
              <Bell className="h-3 w-3 absolute -top-1 -right-1 text-destructive animate-bounce" />
            </>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="all-users">
        <UsersManagementTable />
      </TabsContent>

      <TabsContent value="approvals">
        <RegistrationApprovalTab />
      </TabsContent>
    </Tabs>
  );
};
