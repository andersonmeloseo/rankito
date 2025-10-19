import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, TrendingUp, CheckSquare } from "lucide-react";
import { SalesPipeline } from "./SalesPipeline";
import { TasksList } from "./TasksList";

interface CRMHubProps {
  userId: string;
}

export const CRMHub = ({ userId }: CRMHubProps) => {
  return (
    <Tabs defaultValue="pipeline" className="space-y-6">
      <TabsList className="grid w-full grid-cols-3 max-w-2xl">
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
      </TabsList>

      <TabsContent value="pipeline">
        <SalesPipeline userId={userId} />
      </TabsContent>

      <TabsContent value="tasks">
        <TasksList userId={userId} />
      </TabsContent>

      <TabsContent value="dashboard">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Dashboard CRM em desenvolvimento...</p>
        </div>
      </TabsContent>
    </Tabs>
  );
};
