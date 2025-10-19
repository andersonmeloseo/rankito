import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, TrendingUp, CheckSquare, Settings } from "lucide-react";
import { SalesPipeline } from "./SalesPipeline";
import { TasksList } from "./TasksList";
import { CRMSettings } from "./CRMSettings";
import { CRMDashboard } from "./dashboard/CRMDashboard";

interface CRMHubProps {
  userId: string;
}

export const CRMHub = ({ userId }: CRMHubProps) => {
  return (
    <Tabs defaultValue="pipeline" className="space-y-6">
      <TabsList className="grid w-full grid-cols-4 max-w-3xl">
        <TabsTrigger value="pipeline" className="gap-2">
          <TrendingUp className="w-4 h-4" />
          Pipeline
        </TabsTrigger>
        <TabsTrigger value="tasks" className="gap-2">
          <CheckSquare className="w-4 h-4" />
          Tarefas
        </TabsTrigger>
        <TabsTrigger value="dashboard" className="gap-2">
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </TabsTrigger>
        <TabsTrigger value="settings" className="gap-2">
          <Settings className="w-4 h-4" />
          Configurações
        </TabsTrigger>
      </TabsList>

      <TabsContent value="pipeline">
        <SalesPipeline userId={userId} />
      </TabsContent>

      <TabsContent value="tasks">
        <TasksList userId={userId} />
      </TabsContent>

      <TabsContent value="dashboard">
        <CRMDashboard userId={userId} />
      </TabsContent>

      <TabsContent value="settings">
        <CRMSettings userId={userId} />
      </TabsContent>
    </Tabs>
  );
};
