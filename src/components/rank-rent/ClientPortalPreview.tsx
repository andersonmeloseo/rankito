import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface ClientPortalPreviewProps {
  portalToken: string;
}

export const ClientPortalPreview = ({ portalToken }: ClientPortalPreviewProps) => {
  const portalUrl = `/client-portal/${portalToken}`;

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg">Preview do Portal</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(portalUrl, '_blank')}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Abrir em Nova Aba
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border rounded-lg overflow-hidden bg-muted shadow-inner">
          <iframe
            src={`${portalUrl}?preview=true`}
            className="w-full h-[600px]"
            title="Portal Preview"
          />
        </div>
        <p className="text-sm text-muted-foreground text-center">
          Esta é uma prévia do portal. Abra em nova aba para ver a versão completa.
        </p>
      </CardContent>
    </Card>
  );
};
