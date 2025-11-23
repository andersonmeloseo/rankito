import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Eye, Image } from "lucide-react";
import { useGBPPhotos } from "@/hooks/useGBPPhotos";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

interface GBPPhotosManagerProps {
  profileId: string;
}

export const GBPPhotosManager = ({ profileId }: GBPPhotosManagerProps) => {
  const { photos, isLoading, deletePhoto, isDeleting } = useGBPPhotos(profileId);
  const [typeFilter, setTypeFilter] = useState<string>("all");

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="p-4">
            <Skeleton className="w-full h-48 mb-3" />
            <Skeleton className="h-4 w-3/4" />
          </Card>
        ))}
      </div>
    );
  }

  if (!photos || photos.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Image className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Nenhuma foto encontrada</p>
      </Card>
    );
  }

  const filteredPhotos = typeFilter === "all" 
    ? photos 
    : photos.filter(photo => photo.photo_type === typeFilter);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Galeria de Fotos</h2>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="profile">Perfil</SelectItem>
            <SelectItem value="cover">Capa</SelectItem>
            <SelectItem value="interior">Interior</SelectItem>
            <SelectItem value="exterior">Exterior</SelectItem>
            <SelectItem value="product">Produto</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPhotos.map((photo) => (
          <Card key={photo.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
            <div className="relative aspect-video">
              <img
                src={photo.photo_url}
                alt={photo.caption || 'Foto do negócio'}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => window.open(photo.photo_url, '_blank')}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Ver
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deletePhoto(photo.id)}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Excluir
                </Button>
              </div>
            </div>
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="capitalize">
                  {photo.photo_type}
                </Badge>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Eye className="h-3 w-3" />
                  {photo.view_count}
                </div>
              </div>
              {photo.caption && (
                <p className="text-sm text-muted-foreground truncate">{photo.caption}</p>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
