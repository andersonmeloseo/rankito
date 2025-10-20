import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface ClientPortalPreviewProps {
  portalToken: string;
}

export const ClientPortalPreview = ({ portalToken }: ClientPortalPreviewProps) => {
  const portalUrl = `/client-portal/${portalToken}`;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Preview do Portal</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(portalUrl, '_blank')}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Abrir em Nova Aba
        </Button>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden bg-muted">
          <iframe
            src={`${portalUrl}?preview=true`}
            className="w-full h-[400px]"
            title="Portal Preview"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Esta é uma prévia do portal. Abra em nova aba para ver a versão completa.
        </p>
      </CardContent>
    </Card>
  );
};
