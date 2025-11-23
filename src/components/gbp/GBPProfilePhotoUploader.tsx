import { Card, CardContent } from "@/components/ui/card";
import { Upload } from "lucide-react";

interface GBPProfilePhotoUploaderProps {
  profileId: string;
}

export const GBPProfilePhotoUploader = ({ profileId }: GBPProfilePhotoUploaderProps) => {
  return (
    <Card>
      <CardContent className="p-12 text-center">
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="font-semibold mb-2">Upload de Fotos</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Arraste e solte imagens ou clique para selecionar
        </p>
        <p className="text-xs text-muted-foreground">
          (Funcionalidade em desenvolvimento)
        </p>
      </CardContent>
    </Card>
  );
};
