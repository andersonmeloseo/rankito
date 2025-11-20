import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CheckCircle2, RotateCcw, XCircle, Info, FileDown, MoreVertical } from "lucide-react";
import { useUpdateTicketStatus } from "@/hooks/useSupportTickets";
import { useToast } from "@/hooks/use-toast";
import { TicketInfoDialog } from "./TicketInfoDialog";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface TicketActionsMenuProps {
  ticketId: string;
  ticketStatus: string;
  chatContainerRef: React.RefObject<HTMLDivElement>;
  onExport?: () => void;
}

export function TicketActionsMenu({ 
  ticketId, 
  ticketStatus, 
  chatContainerRef,
  onExport 
}: TicketActionsMenuProps) {
  const { toast } = useToast();
  const [showInfo, setShowInfo] = useState(false);
  const updateStatus = useUpdateTicketStatus();

  const handleStatusChange = async (newStatus: string, label: string) => {
    try {
      await updateStatus.mutateAsync({ ticket_id: ticketId, status: newStatus });
      toast({
        title: "Status atualizado",
        description: `Ticket ${label.toLowerCase()} com sucesso`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status",
        variant: "destructive",
      });
    }
  };

  const exportToPDF = async () => {
    try {
      const element = chatContainerRef.current;
      if (!element) return;

      toast({
        title: "Exportando...",
        description: "Preparando PDF da conversa",
      });

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 190;
      const pageHeight = 277;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`ticket_${ticketId}_${Date.now()}.pdf`);

      toast({
        title: "Exportado com sucesso",
        description: "PDF da conversa foi baixado",
      });

      onExport?.();
    } catch (error) {
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível gerar o PDF",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Quick action buttons - visible on desktop */}
      <div className="hidden lg:flex items-center gap-2">
        {(ticketStatus === "open" || ticketStatus === "in_progress") && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleStatusChange("resolved", "Resolvido")}
            disabled={updateStatus.isPending}
          >
            <CheckCircle2 className="w-4 h-4" />
            Marcar como Resolvido
          </Button>
        )}

        {ticketStatus !== "closed" && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={updateStatus.isPending}>
                <XCircle className="w-4 h-4" />
                Fechar Ticket
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogTitle>Confirmar fechamento</AlertDialogTitle>
              <AlertDialogDescription>
                Ao fechar este ticket, não será mais possível enviar mensagens.
                Esta ação pode ser revertida reabrindo o ticket. Tem certeza?
              </AlertDialogDescription>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleStatusChange("closed", "Fechado")}>
                  Sim, Fechar Ticket
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {(ticketStatus === "resolved" || ticketStatus === "closed") && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleStatusChange("open", "Reaberto")}
            disabled={updateStatus.isPending}
          >
            <RotateCcw className="w-4 h-4" />
            Reabrir
          </Button>
        )}
      </div>

      {/* Dropdown menu - all actions on mobile, secondary actions on desktop */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreVertical className="w-4 h-4" />
            <span className="lg:hidden ml-1">Menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {/* Mobile-only quick actions */}
          <div className="lg:hidden">
            {(ticketStatus === "open" || ticketStatus === "in_progress") && (
              <DropdownMenuItem onClick={() => handleStatusChange("resolved", "Resolvido")}>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Marcar como Resolvido
              </DropdownMenuItem>
            )}

            {ticketStatus !== "closed" && (
              <DropdownMenuItem
                onClick={() => handleStatusChange("closed", "Fechado")}
                className="text-red-600"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Fechar Ticket
              </DropdownMenuItem>
            )}

            {(ticketStatus === "resolved" || ticketStatus === "closed") && (
              <DropdownMenuItem onClick={() => handleStatusChange("open", "Reaberto")}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reabrir
              </DropdownMenuItem>
            )}
          </div>

          {/* Secondary actions - always in dropdown */}
          <DropdownMenuItem onClick={() => setShowInfo(true)}>
            <Info className="w-4 h-4 mr-2" />
            Ver Informações
          </DropdownMenuItem>

          <DropdownMenuItem onClick={exportToPDF}>
            <FileDown className="w-4 h-4 mr-2" />
            Exportar Conversa
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <TicketInfoDialog
        ticketId={ticketId}
        open={showInfo}
        onOpenChange={setShowInfo}
      />
    </div>
  );
}
