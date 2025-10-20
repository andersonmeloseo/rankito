import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, X } from "lucide-react";
import { useNotes } from "@/hooks/useNotes";
import { toast } from "@/hooks/use-toast";

interface QuickNoteInputProps {
  dealId: string;
  userId: string;
  onNoteSaved: () => void;
  onCancel: () => void;
}

export const QuickNoteInput = ({ dealId, userId, onNoteSaved, onCancel }: QuickNoteInputProps) => {
  const [content, setContent] = useState("");
  const { createNote } = useNotes(userId);

  const handleSave = () => {
    if (!content.trim()) {
      toast({
        title: "Nota vazia",
        description: "Digite algo antes de salvar",
        variant: "destructive",
      });
      return;
    }

    createNote(
      {
        user_id: userId,
        deal_id: dealId,
        client_id: null,
        content: content.trim(),
        is_pinned: false,
      },
      {
        onSuccess: () => {
          setContent("");
          onNoteSaved();
          toast({
            title: "Nota adicionada",
            description: "A nota foi salva com sucesso",
          });
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <div className="space-y-2 p-2 bg-muted/50 rounded-lg" onClick={(e) => e.stopPropagation()}>
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Digite sua nota... (Ctrl+Enter para salvar, Esc para cancelar)"
        className="min-h-[60px] text-sm resize-none"
        autoFocus
      />
      <div className="flex gap-2 justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onCancel();
          }}
        >
          <X className="h-3 w-3 mr-1" />
          Cancelar
        </Button>
        <Button
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleSave();
          }}
        >
          <Send className="h-3 w-3 mr-1" />
          Salvar
        </Button>
      </div>
    </div>
  );
};
