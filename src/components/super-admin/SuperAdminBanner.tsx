import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ArrowLeft } from "lucide-react";

interface SuperAdminBannerProps {
  currentView: "client" | "end_client";
}

export const SuperAdminBanner = ({ currentView }: SuperAdminBannerProps) => {
  const navigate = useNavigate();

  return (
    <div className="bg-primary text-primary-foreground py-3 px-4 shadow-lg border-b-2 border-primary/20">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5" />
          <span className="font-semibold">
            Modo Super Admin - Visualizando como {currentView === "client" ? "Cliente" : "End Client"}
          </span>
        </div>
        <Button 
          variant="secondary" 
          size="sm"
          onClick={() => navigate("/super-admin")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao Painel Admin
        </Button>
      </div>
    </div>
  );
};
