import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import { useState } from "react";

interface GSCPropertySelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  properties: string[];
  currentUrl?: string;
  onSelect: (url: string) => void;
}

export function GSCPropertySelectorDialog({
  open,
  onOpenChange,
  properties,
  currentUrl,
  onSelect,
}: GSCPropertySelectorDialogProps) {
  const [selectedUrl, setSelectedUrl] = useState<string>(currentUrl || properties[0] || "");

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
          <DialogTitle>Selecionar Propriedade do Google Search Console</DialogTitle>
          <DialogDescription>
            Escolha a propriedade GSC correta para este projeto
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {properties.length === 0 ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">Nenhuma propriedade encontrada</p>
                  <p className="text-sm">
                    A Service Account não tem acesso a nenhuma propriedade no Google Search Console.
                  </p>
                  <div className="space-y-1 text-sm mt-3">
                    <p className="font-medium">Passos para resolver:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Acesse o <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">Google Search Console <ExternalLink className="h-3 w-3" /></a></li>
                      <li>Selecione sua propriedade</li>
                      <li>Vá em <strong>Configurações → Usuários e permissões</strong></li>
                      <li>Clique em <strong>ADICIONAR USUÁRIO</strong></li>
                      <li>Cole o email da Service Account</li>
                      <li>Selecione permissão <strong>PROPRIETÁRIO</strong></li>
                      <li>Aguarde 2-3 minutos e tente novamente</li>
                    </ol>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {currentUrl && !properties.includes(currentUrl) && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-semibold">URL configurada não encontrada</p>
                    <p className="text-sm mt-1">
                      A URL <code className="bg-muted px-1 py-0.5 rounded">{currentUrl}</code> não está
                      disponível nas propriedades desta Service Account.
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                <Label>Propriedades disponíveis ({properties.length}):</Label>
                <RadioGroup value={selectedUrl} onValueChange={setSelectedUrl}>
                  <div className="space-y-2">
                    {properties.map((url) => (
                      <div
                        key={url}
                        className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                          selectedUrl === url
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <RadioGroupItem value={url} id={url} />
                        <Label
                          htmlFor={url}
                          className="flex-1 cursor-pointer flex items-center gap-2"
                        >
                          <span className="font-mono text-sm">{url}</span>
                          {url === currentUrl && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                              Atual
                            </span>
                          )}
                        </Label>
                        <CheckCircle2
                          className={`h-4 w-4 ${
                            selectedUrl === url ? 'text-primary' : 'text-muted-foreground/20'
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              <Alert>
                <AlertDescription className="text-sm">
                  <strong>Dica:</strong> Escolha a URL que corresponde exatamente ao formato
                  cadastrado no Google Search Console (com ou sem barra final, com ou sem www).
                </AlertDescription>
              </Alert>
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
