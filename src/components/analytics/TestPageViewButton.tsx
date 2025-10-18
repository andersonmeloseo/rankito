import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TestTube, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TestPageViewButtonProps {
  siteId: string;
  onSuccess?: () => void;
}

export const TestPageViewButton = ({ siteId, onSuccess }: TestPageViewButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const detectDeviceType = (): string => {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return "tablet";
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return "mobile";
    }
    return "desktop";
  };

  const handleTestPageView = async () => {
    try {
      setIsLoading(true);

      // Buscar o tracking_token do site
      const { data: siteData, error: siteError } = await supabase
        .from("rank_rent_sites")
        .select("tracking_token, site_url")
        .eq("id", siteId)
        .single();

      if (siteError || !siteData) {
        throw new Error("Erro ao buscar dados do site");
      }

      // Preparar payload igual ao plugin WordPress
      const payload = {
        site_name: "Teste Geolocalização",
        page_url: `${siteData.site_url}/teste-analytics`,
        event_type: "page_view",
        metadata: {
          referrer: window.location.href,
          device: detectDeviceType(),
          page_title: "Teste de Page View - Analytics",
          timestamp: new Date().toISOString(),
        }
      };

      // Chamar edge function com tracking_token - URL hardcoded
      const functionUrl = `https://jhzmgexprjnpgadkxjup.supabase.co/functions/v1/track-rank-rent-conversion?token=${siteData.tracking_token}`;
      
      const response = await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao enviar page view");
      }

      toast({
        title: "✅ Page View testado com sucesso!",
        description: "O evento foi registrado com sua geolocalização real. Atualize a tabela para ver o resultado.",
      });

      // Trigger reload se callback fornecido
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1000);
      }
    } catch (error) {
      console.error("Erro ao testar page view:", error);
      toast({
        title: "Erro ao testar page view",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleTestPageView}
      disabled={isLoading}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Testando...
        </>
      ) : (
        <>
          <TestTube className="w-4 h-4" />
          Testar Page View
        </>
      )}
    </Button>
  );
};
