import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { ClickUpTabTrigger } from "@/components/ui/custom-tabs";
import { FolderTree, Video } from "lucide-react";
import { ModulesManagementTab } from "./video-training/ModulesManagementTab";
import { VideosManagementTab } from "./video-training/VideosManagementTab";

export const VideoTrainingManagementTab = () => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="modules" className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
          <ClickUpTabTrigger value="modules" icon={FolderTree}>
            Módulos
          </ClickUpTabTrigger>
          <ClickUpTabTrigger value="videos" icon={Video}>
            Vídeos
          </ClickUpTabTrigger>
        </TabsList>

        <TabsContent value="modules" className="mt-6">
          <ModulesManagementTab />
        </TabsContent>

        <TabsContent value="videos" className="mt-6">
          <VideosManagementTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};
