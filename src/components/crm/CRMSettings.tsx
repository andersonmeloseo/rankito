import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Workflow } from "lucide-react";
import { PipelineSettings } from "./settings/PipelineSettings";

interface CRMSettingsProps {
  userId: string;
}

export const CRMSettings = ({ userId }: CRMSettingsProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Configurações CRM</h2>
      </div>

      <Tabs defaultValue="pipeline" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pipeline" className="gap-2">
            <Workflow className="w-4 h-4" />
            Pipeline
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline">
          <PipelineSettings userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
