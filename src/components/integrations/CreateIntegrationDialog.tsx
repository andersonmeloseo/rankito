import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe, Chrome, Code } from "lucide-react";
import { useExternalSources } from "@/hooks/useExternalSources";
import { IntegrationInstructions } from "./IntegrationInstructions";

interface CreateIntegrationDialogProps {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateIntegrationDialog = ({
  userId,
  open,
  onOpenChange,
}: CreateIntegrationDialogProps) => {
  const [sourceType, setSourceType] = useState<'wordpress' | 'chrome_extension' | 'api'>('wordpress');
  const [sourceName, setSourceName] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  const [createdSource, setCreatedSource] = useState<any>(null);

  const { createSource, isCreating } = useExternalSources(userId);

  const handleCreate = async () => {
    if (!sourceName.trim()) return;

    const sourceData: any = {
      source_type: sourceType,
      source_name: sourceName.trim(),
    };

    if (sourceType === 'wordpress' && siteUrl) {
      sourceData.site_url = siteUrl.trim();
    }

    createSource(sourceData, {
      onSuccess: (data) => {
        setCreatedSource(data);
        setShowInstructions(true);
      },
    });
  };

  const handleClose = () => {
    setSourceName('');
    setSiteUrl('');
    setSourceType('wordpress');
    setShowInstructions(false);
    setCreatedSource(null);
    onOpenChange(false);
  };

  if (showInstructions && createdSource) {
    return (
      <IntegrationInstructions
        source={createdSource}
        open={open}
        onClose={handleClose}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Integração Externa</DialogTitle>
          <DialogDescription>
            Configure uma nova fonte de captura de leads
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Source Type */}
          <div className="space-y-2">
            <Label>Tipo de Integração</Label>
            <Select value={sourceType} onValueChange={(v: any) => setSourceType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wordpress">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    WordPress Plugin
                  </div>
                </SelectItem>
                <SelectItem value="chrome_extension">
                  <div className="flex items-center gap-2">
                    <Chrome className="w-4 h-4" />
                    Extensão Chrome (WhatsApp)
                  </div>
                </SelectItem>
                <SelectItem value="api">
                  <div className="flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    API Personalizada
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {sourceType === 'wordpress' && 'Capture leads de formulários e botões no WordPress'}
              {sourceType === 'chrome_extension' && 'Adicione contatos do WhatsApp Web direto no CRM'}
              {sourceType === 'api' && 'Integre com qualquer sistema usando nossa API'}
            </p>
          </div>

          {/* Source Name */}
          <div className="space-y-2">
            <Label htmlFor="source-name">Nome da Integração *</Label>
            <Input
              id="source-name"
              placeholder="Ex: Site Principal, WhatsApp Vendas, API Leads..."
              value={sourceName}
              onChange={(e) => setSourceName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Nome amigável para identificar esta fonte de leads
            </p>
          </div>

          {/* Site URL (WordPress only) */}
          {sourceType === 'wordpress' && (
            <div className="space-y-2">
              <Label htmlFor="site-url">URL do Site</Label>
              <Input
                id="site-url"
                placeholder="https://meusite.com.br"
                value={siteUrl}
                onChange={(e) => setSiteUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                URL do site WordPress onde o plugin será instalado
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isCreating}>
            Cancelar
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={!sourceName.trim() || isCreating}
          >
            {isCreating ? 'Criando...' : 'Criar Integração'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
