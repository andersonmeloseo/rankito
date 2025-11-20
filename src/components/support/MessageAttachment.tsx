import { Download, File, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Attachment {
  name: string;
  url: string;
  size: number;
  type: string;
}

interface MessageAttachmentProps {
  attachment: Attachment;
}

export function MessageAttachment({ attachment }: MessageAttachmentProps) {
  const isImage = attachment.type.startsWith("image/");
  const fileSize = (attachment.size / 1024).toFixed(1);

  const handleDownload = () => {
    window.open(attachment.url, "_blank");
  };

  return (
    <Card className="p-2 inline-flex items-center gap-2 max-w-xs">
      <div className="flex-shrink-0">
        {isImage ? (
          <ImageIcon className="w-4 h-4 text-muted-foreground" />
        ) : (
          <File className="w-4 h-4 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{attachment.name}</p>
        <p className="text-xs text-muted-foreground">{fileSize} KB</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 flex-shrink-0"
        onClick={handleDownload}
        type="button"
      >
        <Download className="w-3 h-3" />
      </Button>
    </Card>
  );
}
