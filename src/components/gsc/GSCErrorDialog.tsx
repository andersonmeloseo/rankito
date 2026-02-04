import { useState } from "react";
import { AlertTriangle, Copy, Check, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EdgeFunctionErrorData } from "@/utils/edgeFunctionError";
import { toast } from "sonner";

interface GSCErrorDialogProps {
  open: boolean;
  onClose: () => void;
  data: EdgeFunctionErrorData | null;
  serviceAccountEmail?: string;
}

export function GSCErrorDialog({
  open,
  onClose,
  data,
  serviceAccountEmail,
}: GSCErrorDialogProps) {
  const [copied, setCopied] = useState(false);

  if (!data) return null;

  const handleCopyEmail = async () => {
    if (!serviceAccountEmail) return;
    
    try {
      await navigator.clipboard.writeText(serviceAccountEmail);
      setCopied(true);
      toast.success("Email copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Erro ao copiar email");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-warning">
            <AlertTriangle className="h-5 w-5" />
            {data.error || "Erro"}
          </DialogTitle>
          {data.message && (
            <DialogDescription className="text-base">
              {data.message}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {data.instructions && data.instructions.length > 0 && (
            <div className="space-y-2">
              <p className="font-medium text-sm text-foreground">
                Como resolver:
              </p>
              <ol className="space-y-1.5 text-sm text-muted-foreground">
                {data.instructions.map((instruction, index) => (
                  <li key={index} className="leading-relaxed">
                    {instruction}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {serviceAccountEmail && (
            <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Email da Service Account:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-background px-2 py-1.5 rounded border break-all">
                  {serviceAccountEmail}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyEmail}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {data.action && (
            <Button asChild variant="outline" className="w-full">
              <a
                href={data.action}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Abrir Google Search Console
              </a>
            </Button>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
