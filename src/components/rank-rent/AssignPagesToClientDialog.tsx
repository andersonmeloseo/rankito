import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Link2, Unlink } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AssignPagesToClientDialogProps {
  clientId: string;
  clientName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssignPagesToClientDialog({
  clientId,
  clientName,
  open,
  onOpenChange,
}: AssignPagesToClientDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [monthlyRent, setMonthlyRent] = useState("500");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch available pages (not rented)
  const { data: availablePages, isLoading: loadingAvailable } = useQuery({
    queryKey: ["available-pages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rank_rent_pages")
        .select("*, rank_rent_sites(site_name, niche, location)")
        .eq("is_rented", false)
        .order("page_url");

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Fetch assigned pages
  const { data: assignedPages, isLoading: loadingAssigned } = useQuery({
    queryKey: ["assigned-pages", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rank_rent_pages")
        .select("*, rank_rent_sites(site_name, niche, location)")
        .eq("client_id", clientId)
        .order("page_url");

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const handleAssignPages = async () => {
    if (selectedPages.length === 0) {
      toast({
        title: "Nenhuma página selecionada",
        description: "Selecione pelo menos uma página para vincular",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const updates = selectedPages.map((pageId) => ({
        id: pageId,
        client_id: clientId,
        is_rented: true,
        monthly_rent_value: parseFloat(monthlyRent) || 0,
        phone_number: phoneNumber || null,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from("rank_rent_pages")
          .update({
            client_id: update.client_id,
            is_rented: update.is_rented,
            monthly_rent_value: update.monthly_rent_value,
            phone_number: update.phone_number,
          })
          .eq("id", update.id);

        if (error) throw error;
      }

      toast({
        title: "Páginas vinculadas com sucesso!",
        description: `${selectedPages.length} página(s) vinculada(s) a ${clientName}`,
      });

      setSelectedPages([]);
      setMonthlyRent("500");
      setPhoneNumber("");

      queryClient.invalidateQueries({ queryKey: ["available-pages"] });
      queryClient.invalidateQueries({ queryKey: ["assigned-pages"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    } catch (error: any) {
      toast({
        title: "Erro ao vincular páginas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignPage = async (pageId: string) => {
    try {
      const { error } = await supabase
        .from("rank_rent_pages")
        .update({
          client_id: null,
          is_rented: false,
          monthly_rent_value: 0,
          phone_number: null,
        })
        .eq("id", pageId);

      if (error) throw error;

      toast({
        title: "Página desvinculada",
        description: "Página removida do cliente com sucesso",
      });

      queryClient.invalidateQueries({ queryKey: ["available-pages"] });
      queryClient.invalidateQueries({ queryKey: ["assigned-pages"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    } catch (error: any) {
      toast({
        title: "Erro ao desvincular página",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const togglePageSelection = (pageId: string) => {
    setSelectedPages((prev) =>
      prev.includes(pageId)
        ? prev.filter((id) => id !== pageId)
        : [...prev, pageId]
    );
  };

  const toggleSelectAll = () => {
    if (!availablePages) return;
    
    const filteredPages = availablePages.filter((page) =>
      page.page_url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      page.page_title?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (selectedPages.length === filteredPages.length) {
      setSelectedPages([]);
    } else {
      setSelectedPages(filteredPages.map((p) => p.id));
    }
  };

  const filteredAvailable = availablePages?.filter(
    (page) =>
      page.page_url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      page.page_title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Gerenciar Páginas - {clientName}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="available" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="available">
              Páginas Disponíveis ({availablePages?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="assigned">
              Páginas Vinculadas ({assignedPages?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="flex-1 flex flex-col overflow-hidden space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-3">
                  <Label htmlFor="search">Buscar Página</Label>
                  <Input
                    id="search"
                    placeholder="Digite URL ou título..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="rent">Valor Mensal (R$)</Label>
                  <Input
                    id="rent"
                    type="number"
                    value={monthlyRent}
                    onChange={(e) => setMonthlyRent(e.target.value)}
                    placeholder="500"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone (Opcional)</Label>
                  <Input
                    id="phone"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleAssignPages}
                    disabled={loading || selectedPages.length === 0}
                    className="w-full"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Link2 className="w-4 h-4 mr-2" />
                    )}
                    Vincular {selectedPages.length} Página(s)
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-auto border rounded-md">
              {loadingAvailable ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : filteredAvailable && filteredAvailable.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedPages.length === filteredAvailable.length}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Site</TableHead>
                      <TableHead>URL da Página</TableHead>
                      <TableHead>Título</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAvailable.map((page: any) => (
                      <TableRow key={page.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedPages.includes(page.id)}
                            onCheckedChange={() => togglePageSelection(page.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {page.rank_rent_sites?.site_name}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {page.page_url}
                        </TableCell>
                        <TableCell className="text-sm">
                          {page.page_title || "Sem título"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  Nenhuma página disponível
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="assigned" className="flex-1 overflow-auto">
            {loadingAssigned ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : assignedPages && assignedPages.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Site</TableHead>
                    <TableHead>URL da Página</TableHead>
                    <TableHead>Valor Mensal</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead className="w-24">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignedPages.map((page: any) => (
                    <TableRow key={page.id}>
                      <TableCell className="font-medium">
                        {page.rank_rent_sites?.site_name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {page.page_url}
                      </TableCell>
                      <TableCell>
                        R$ {parseFloat(page.monthly_rent_value || 0).toFixed(2)}
                      </TableCell>
                      <TableCell>{page.phone_number || "-"}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnassignPage(page.id)}
                        >
                          <Unlink className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                Nenhuma página vinculada a este cliente
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
