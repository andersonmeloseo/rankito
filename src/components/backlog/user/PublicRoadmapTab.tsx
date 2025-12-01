import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { RoadmapTimeline } from "./RoadmapTimeline";
import { MyRequestsList } from "./MyRequestsList";
import { PopularRequestsSection } from "./PopularRequestsSection";
import { RequestFeatureDialog } from "./RequestFeatureDialog";

export const PublicRoadmapTab = () => {
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Atualizações & Roadmap</h2>
          <p className="text-muted-foreground">
            Acompanhe as novidades e contribua com suas ideias
          </p>
        </div>
        <Button onClick={() => setRequestDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Solicitar Feature
        </Button>
      </div>

      <RoadmapTimeline />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MyRequestsList />
        <PopularRequestsSection />
      </div>

      <RequestFeatureDialog
        open={requestDialogOpen}
        onOpenChange={setRequestDialogOpen}
      />
    </div>
  );
};
