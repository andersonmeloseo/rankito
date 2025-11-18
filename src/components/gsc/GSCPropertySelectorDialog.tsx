import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExternalLink, CheckCircle2 } from "lucide-react";
import { useState } from "react";

interface GSCPropertySelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  properties: string[];
  currentUrl: string | null;
  onSelect: (url: string) => void;
}

export function GSCPropertySelectorDialog({
  open,
  onOpenChange,
  properties,
  currentUrl,
  onSelect,
}: GSCPropertySelectorDialogProps) {
  const [selectedUrl, setSelectedUrl] = useState<string>(currentUrl || properties[0] || '');

  const handleConfirm = () => {
    if (selectedUrl) {
      onSelect(selectedUrl);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>🔍 Selecionar Propriedade do Google Search Console</DialogTitle>
          <DialogDescription>
            Selecione a propriedade correta cadastrada no GSC para este projeto
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {properties.length === 0 ? (
            <Alert>
              <AlertDescription>
                <p className="font-semibold mb-2">⚠️ Nenhuma Propriedade Disponível</p>
                <p className="text-sm mb-2">
                  A Service Account não tem acesso a nenhuma propriedade no Google Search Console.
                </p>
                <ol className="text-sm space-y-1 list-decimal list-inside">
                  <li>Acesse o <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">Google Search Console <ExternalLink className="h-3 w-3" /></a></li>
                  <li>Adicione/verifique sua propriedade (se ainda não fez)</li>
                  <li>Vá em Configurações → Usuários e permissões</li>
                  <li>Adicione o email da Service Account como PROPRIETÁRIO</li>
                  <li>Aguarde 2-3 minutos e teste novamente</li>
                </ol>
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <Alert>
                <AlertDescription>
                  <p className="text-sm">
                    Encontramos {properties.length} propriedade(s) cadastrada(s) no GSC para esta Service Account.
                    Selecione a URL <strong>exata</strong> que corresponde a este projeto.
                  </p>
                </AlertDescription>
              </Alert>

              <RadioGroup value={selectedUrl} onValueChange={setSelectedUrl}>
                <div className="space-y-2">
                  {properties.map((url) => (
                    <div key={url} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value={url} id={url} />
                      <Label htmlFor={url} className="flex-1 cursor-pointer font-mono text-sm">
                        {url}
                        {url === currentUrl && (
                          <span className="ml-2 text-xs text-green-600 inline-flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Atual
                          </span>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>

              {currentUrl && !properties.includes(currentUrl) && (
                <Alert variant="destructive">
                  <AlertDescription>
                    <p className="font-semibold">⚠️ URL Configurada Não Encontrada</p>
                    <p className="text-sm mt-1">
                      A URL atualmente configurada (<code className="font-mono">{currentUrl}</code>) não está
                      disponível nas propriedades do GSC. Selecione uma das opções acima.
                    </p>
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          {properties.length > 0 && (
            <Button onClick={handleConfirm} disabled={!selectedUrl}>
              Confirmar Seleção
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
