import { X, Home, Send, Archive, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

interface BulkActionsBarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onRent?: () => void;
  onIndex?: () => void;
  onArchive?: () => void;
  onExport?: () => void;
  onDelete?: () => void;
  actions?: {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    variant?: "default" | "outline" | "destructive";
  }[];
}

export const BulkActionsBar = ({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  onRent,
  onIndex,
  onArchive,
  onExport,
  onDelete,
  actions,
}: BulkActionsBarProps) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <Card className="shadow-2xl border-2 border-primary/20">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedCount === totalCount}
              onCheckedChange={onSelectAll}
            />
            <span className="font-medium text-sm whitespace-nowrap">
              {selectedCount} selecionado{selectedCount > 1 ? "s" : ""}
            </span>
          </div>

          <Separator orientation="vertical" className="h-6" />

          <div className="flex gap-2">
            {actions ? (
              actions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || "outline"}
                  size="sm"
                  onClick={action.onClick}
                  className="gap-2"
                >
                  {action.icon}
                  {action.label}
                </Button>
              ))
            ) : (
              <>
                {onRent && (
                  <Button variant="outline" size="sm" onClick={onRent} className="gap-2">
                    <Home className="w-4 h-4" />
                    Alugar
                  </Button>
                )}
                {onIndex && (
                  <Button variant="outline" size="sm" onClick={onIndex} className="gap-2">
                    <Send className="w-4 h-4" />
                    Indexar no GSC
                  </Button>
                )}
                {onArchive && (
                  <Button variant="outline" size="sm" onClick={onArchive} className="gap-2">
                    <Archive className="w-4 h-4" />
                    Arquivar
                  </Button>
                )}
                {onExport && (
                  <Button variant="outline" size="sm" onClick={onExport} className="gap-2">
                    <Download className="w-4 h-4" />
                    Exportar
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={onDelete}
                    className="gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Excluir
                  </Button>
                )}
              </>
            )}
          </div>

          <Separator orientation="vertical" className="h-6" />

          <Button variant="ghost" size="sm" onClick={onClearSelection} className="h-8 w-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
