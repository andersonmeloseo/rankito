import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Kanban, MessageSquare, History } from "lucide-react";
import { BacklogKanban } from "./BacklogKanban";
import { FeatureRequestsTable } from "./FeatureRequestsTable";
import { ReleaseHistoryTimeline } from "./ReleaseHistoryTimeline";
import { useFeatureRequests } from "@/hooks/useFeatureRequests";

export const BacklogManagementTab = () => {
  const [activeTab, setActiveTab] = useState("roadmap");
  const { requests } = useFeatureRequests(true);
  
  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Backlog & Roadmap</h2>
        <p className="text-muted-foreground">
          Gerencie features, solicitações de usuários e histórico de releases
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="roadmap" className="gap-2">
            <Kanban className="h-4 w-4" />
            Roadmap
          </TabsTrigger>
          <TabsTrigger value="requests" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Solicitações
            {pendingCount > 0 && (
              <span className="ml-2 rounded-full bg-destructive px-2 py-0.5 text-xs text-destructive-foreground">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roadmap" className="space-y-4">
          <BacklogKanban />
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <FeatureRequestsTable />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <ReleaseHistoryTimeline />
        </TabsContent>
      </Tabs>
    </div>
  );
};
