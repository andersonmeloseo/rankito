import { AlertCircle, Sparkles, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useGBPMockData } from "@/hooks/useGBPMockData";

interface GBPMockDataBannerProps {
  siteId: string;
  profileCount: number;
}

export const GBPMockDataBanner = ({ siteId, profileCount }: GBPMockDataBannerProps) => {
  const { generateMockData, isGenerating } = useGBPMockData(siteId);

  return (
    <Alert className="mb-6 border-primary/50 bg-primary/5">
      <AlertCircle className="h-5 w-5 text-primary" />
      <AlertTitle className="text-lg font-semibold">Modo de Demonstração Ativo</AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p className="text-muted-foreground">
          Você está visualizando <strong>{profileCount} perfis mockados</strong> com dados simulados. 
          Todas as funcionalidades estão disponíveis para teste!
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateMockData({ clearExisting: false })}
            disabled={isGenerating}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Adicionar Mais Perfis
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateMockData({ clearExisting: true })}
            disabled={isGenerating}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Regenerar Dados
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};
