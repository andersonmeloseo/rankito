import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsersManagementTable } from "./UsersManagementTable";
import { RegistrationApprovalTab } from "./RegistrationApprovalTab";
import { Users, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const UnifiedUsersTab = () => {
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

  return (
    <Tabs defaultValue="all-users" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2 bg-muted">
        <TabsTrigger value="all-users" className="gap-2">
          <Users className="h-4 w-4" />
          Todos os Usuários
        </TabsTrigger>
        <TabsTrigger value="approvals" className="gap-2">
          <UserCheck className="h-4 w-4" />
          Aprovações Pendentes
          {pendingCount && pendingCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {pendingCount}
            </Badge>
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
