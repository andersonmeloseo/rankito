import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Workflow, Zap } from "lucide-react";
import { PipelineSettings } from "./settings/PipelineSettings";
import { AutoConversionSettings } from "@/components/rank-rent/AutoConversionSettings";

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
          <TabsTrigger value="auto-conversion" className="gap-2">
            <Zap className="w-4 h-4" />
            Auto-Conversão
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline">
          <PipelineSettings userId={userId} />
        </TabsContent>

        <TabsContent value="auto-conversion">
          <AutoConversionSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};
