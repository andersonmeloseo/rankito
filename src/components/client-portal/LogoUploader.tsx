import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X, ImageIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface LogoUploaderProps {
  currentLogoUrl: string | null;
  onUpload: (file: File) => Promise<string>;
  onRemove: () => void;
  isUploading?: boolean;
}

export const LogoUploader = ({ 
  currentLogoUrl, 
  onUpload, 
  onRemove,
  isUploading = false 
}: LogoUploaderProps) => {
  const [preview, setPreview] = useState<string | null>(currentLogoUrl);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    const maxSize = 2 * 1024 * 1024; // 2MB
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Formato inválido",
        description: "Use PNG, JPG ou SVG",
        variant: "destructive",
      });
      return false;
    }

    if (file.size > maxSize) {
      toast({
        title: "Arquivo muito grande",
        description: "Tamanho máximo: 2MB",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleFileSelect = async (file: File) => {
    if (!validateFile(file)) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    try {
      const publicUrl = await onUpload(file);
      setPreview(publicUrl);
      toast({
        title: "Logo enviado!",
        description: "Logo atualizado com sucesso",
      });
    } catch (error) {
      setPreview(currentLogoUrl);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemove = () => {
    setPreview(null);
    onRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <Label>Logo do Portal</Label>
      
      {preview ? (
        <div className="relative w-48 h-48 border-2 border-border rounded-lg overflow-hidden bg-muted">
          <img 
            src={preview} 
            alt="Logo preview" 
            className="w-full h-full object-contain p-4"
          />
          <Button
            size="icon"
            variant="destructive"
            className="absolute top-2 right-2"
            onClick={handleRemove}
            disabled={isUploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging ? 'border-primary bg-primary/5' : 'border-border'
          }`}
        >
          <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-4">
            Arraste uma imagem ou clique para selecionar
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            PNG, JPG ou SVG (máx. 2MB)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/svg+xml"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
            className="hidden"
            disabled={isUploading}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? 'Enviando...' : 'Selecionar Arquivo'}
          </Button>
        </div>
      )}
    </div>
  );
};
