import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Calendar, Target, TrendingUp } from "lucide-react";
import type { RebalancePreview } from "@/hooks/useGSCQueueRebalance";

interface GSCRebalancePreviewDialogProps {
  open: boolean;
  onClose: () => void;
  preview: RebalancePreview | null;
  onConfirm: () => void;
  isRebalancing: boolean;
}

export function GSCRebalancePreviewDialog({
  open,
  onClose,
  preview,
  onConfirm,
  isRebalancing,
}: GSCRebalancePreviewDialogProps) {
  if (!preview) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Preview da Redistribuição Inteligente</DialogTitle>
          <DialogDescription>
            Veja como as URLs serão distribuídas entre as contas disponíveis antes de confirmar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumo Geral */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{preview.totalUrls}</div>
                    <div className="text-sm text-muted-foreground">URLs Totais</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{preview.summary.todayUrls}</div>
                    <div className="text-sm text-muted-foreground">Hoje</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{preview.daysNeeded} dias</div>
                    <div className="text-sm text-muted-foreground">Tempo Total</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Distribuição por Dia */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Distribuição por Dia</h3>
            <Accordion type="single" collapsible className="w-full">
              {preview.distributionByDay.map((day, index) => (
                <AccordionItem value={`day-${day.day}`} key={day.day}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex justify-between w-full pr-4">
                      <span className="font-medium">
                        {day.day === 0 ? '🎯 HOJE' : `📅 Dia ${day.day}`} ({day.date})
                      </span>
                      <span className="font-bold text-primary">{day.totalUrls} URLs</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pt-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Conta</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead className="text-right">URLs</TableHead>
                            <TableHead className="text-right">Capacidade</TableHead>
                            <TableHead>Uso</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {day.accounts.map((account, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">{account.name}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{account.email}</TableCell>
                              <TableCell className="text-right font-bold">{account.urls}</TableCell>
                              <TableCell className="text-right text-muted-foreground">{account.capacity}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Progress value={account.percentage} className="w-24" />
                                  <span className="text-sm font-medium min-w-[45px]">{account.percentage}%</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Aviso */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Atenção</AlertTitle>
            <AlertDescription>
              Esta ação irá remover todas as <strong>{preview.totalUrls} URLs</strong> da fila atual 
              e redistribuí-las de forma inteligente entre <strong>{preview.summary.accountsUsed} contas</strong> disponíveis.
              Esta operação não pode ser desfeita.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isRebalancing}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={isRebalancing}>
            {isRebalancing ? 'Redistribuindo...' : 'Confirmar Redistribuição'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
