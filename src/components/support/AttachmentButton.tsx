import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Paperclip } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AttachmentButtonProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
}

export function AttachmentButton({
  onFilesSelected,
  maxFiles = 5,
  maxSizeMB = 10,
}: AttachmentButtonProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Validate number of files
    if (files.length > maxFiles) {
      toast({
        title: "Muitos arquivos",
        description: `Você pode enviar no máximo ${maxFiles} arquivos por vez`,
        variant: "destructive",
      });
      return;
    }

    // Validate file sizes
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    const oversizedFiles = files.filter((file) => file.size > maxSizeBytes);

    if (oversizedFiles.length > 0) {
      toast({
        title: "Arquivo muito grande",
        description: `Cada arquivo deve ter no máximo ${maxSizeMB}MB`,
        variant: "destructive",
      });
      return;
    }

    onFilesSelected(files);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,application/pdf,.doc,.docx,.txt"
        onChange={handleFileChange}
        className="hidden"
      />
      <Button
        variant="outline"
        size="icon"
        type="button"
        onClick={() => fileInputRef.current?.click()}
      >
        <Paperclip className="w-4 h-4" />
      </Button>
    </>
  );
}
