import { X, File, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface AttachmentPreviewProps {
  file: File;
  onRemove: () => void;
}

export function AttachmentPreview({ file, onRemove }: AttachmentPreviewProps) {
  const isImage = file.type.startsWith("image/");
  const fileSize = (file.size / 1024).toFixed(1);

  return (
    <Card className="p-2 flex items-center gap-2 max-w-xs">
      <div className="flex-shrink-0">
        {isImage ? (
          <Image className="w-4 h-4 text-muted-foreground" />
        ) : (
          <File className="w-4 h-4 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{file.name}</p>
        <p className="text-xs text-muted-foreground">{fileSize} KB</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 flex-shrink-0"
        onClick={onRemove}
        type="button"
      >
        <X className="w-3 h-3" />
      </Button>
    </Card>
  );
}
