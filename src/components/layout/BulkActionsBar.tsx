import { X, Home, Archive, Send, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";

interface BulkActionsBarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onRent?: () => void;
  onArchive?: () => void;
  onIndexGSC?: () => void;
  onExport?: () => void;
  onDelete?: () => void;
}

export const BulkActionsBar = ({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  onRent,
  onArchive,
  onIndexGSC,
  onExport,
  onDelete,
}: BulkActionsBarProps) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <Card className="shadow-2xl border-2 border-primary/20 bg-background">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedCount === totalCount}
              onCheckedChange={onSelectAll}
              aria-label="Selecionar todos"
            />
            <span className="font-medium text-foreground text-sm">
              {selectedCount} {selectedCount === 1 ? "selecionado" : "selecionados"}
            </span>
          </div>

          <Separator orientation="vertical" className="h-6" />

          <div className="flex gap-2">
            {onRent && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRent}
                className="h-9"
              >
                <Home className="w-4 h-4 mr-2" />
                Alugar
              </Button>
            )}

            {onIndexGSC && (
              <Button
                variant="outline"
                size="sm"
                onClick={onIndexGSC}
                className="h-9"
              >
                <Send className="w-4 h-4 mr-2" />
                Indexar no GSC
              </Button>
            )}

            {onArchive && (
              <Button
                variant="outline"
                size="sm"
                onClick={onArchive}
                className="h-9"
              >
                <Archive className="w-4 h-4 mr-2" />
                Arquivar
              </Button>
            )}

            {onExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
                className="h-9"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            )}

            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDelete}
                className="h-9 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </Button>
            )}
          </div>

          <Separator orientation="vertical" className="h-6" />

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="h-9 w-9 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
