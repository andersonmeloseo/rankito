import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, MapPin, ChevronDown, ChevronUp, Copy, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SequenceStepBadge } from "./SequenceStepBadge";
import { SequenceFlowLine } from "./SequenceFlowLine";
import { SequenceMetrics } from "./SequenceMetrics";
import { SequenceFilters } from "./SequenceFilters";
import { SequenceInsights } from "./SequenceInsights";
import { useJourneyFilters } from "@/hooks/useJourneyFilters";
import { useToast } from "@/hooks/use-toast";
import type { CommonSequence } from "@/hooks/useSessionAnalytics";

interface CommonSequencesProps {
  sequences: CommonSequence[];
}

export const CommonSequences = ({ sequences }: CommonSequencesProps) => {
  const { toast } = useToast();
  const filters = useJourneyFilters(sequences);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [allExpanded, setAllExpanded] = useState(false);

  // Load saved state from sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem('journey-expanded-items');
    if (saved) {
      try {
        setExpandedItems(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved state:', e);
      }
    }
  }, []);

  // Save state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('journey-expanded-items', JSON.stringify(expandedItems));
  }, [expandedItems]);

  const handleExpandAll = () => {
    if (allExpanded) {
      setExpandedItems([]);
    } else {
      setExpandedItems(filters.filteredSequences.map((_, idx) => `item-${idx}`));
    }
    setAllExpanded(!allExpanded);
  };

  const handleCopySequence = (sequence: CommonSequence) => {
    const text = sequence.sequence.map((url, idx) => `${idx + 1}. ${url}`).join('\n');
    navigator.clipboard.writeText(text);
    toast({
      title: "Sequência copiada!",
      description: "A sequência foi copiada para a área de transferência.",
    });
  };

  const handleExportCSV = (sequence: CommonSequence) => {
    const headers = ['Passo', 'URL', 'Tempo Médio (s)', 'Cliques'];
    const rows = sequence.sequence.map((url, idx) => [
      idx + 1,
      url,
      Math.round(sequence.timePerUrl[url] || 0),
      sequence.clickEvents.filter(c => c.pageUrl === url).reduce((acc, c) => acc + c.count, 0),
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sequencia-${sequence.count}-sessoes.csv`;
    a.click();
    
    toast({
      title: "CSV exportado!",
      description: "O arquivo foi baixado com sucesso.",
    });
  };

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Sequências Mais Comuns de Navegação</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExpandAll}
                className="flex items-center gap-2"
              >
                {allExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Recolher Tudo
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Expandir Tudo
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
        {sequences.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🎯</div>
            <p className="text-lg font-semibold mb-2">Nenhuma Jornada Ainda</p>
            <p className="text-sm text-muted-foreground mb-4">
              Configure o tracking para começar a capturar as jornadas dos usuários.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <SequenceFilters
              totalSequences={sequences.length}
              filteredCount={filters.filteredSequences.length}
              limit={filters.limit}
              minPages={filters.minPages}
              minPercentage={filters.minPercentage}
              locationFilter={filters.locationFilter}
              conversionFilter={filters.conversionFilter}
              uniqueLocations={filters.uniqueLocations}
              onLimitChange={filters.setLimit}
              onMinPagesChange={filters.setMinPages}
              onMinPercentageChange={filters.setMinPercentage}
              onLocationFilterChange={filters.setLocationFilter}
              onConversionFilterChange={(value) => filters.setConversionFilter(value as 'all' | 'converted' | 'not_converted')}
              onReset={filters.handleReset}
            />

            {filters.filteredSequences.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Nenhuma sequência encontrada com os filtros aplicados.
                  Tente ajustar os critérios de filtragem.
                </AlertDescription>
              </Alert>
            ) : (
              <AnimatePresence>
                <Accordion 
                  type="multiple" 
                  value={expandedItems}
                  onValueChange={setExpandedItems}
                  className="space-y-4"
                >
                  {filters.filteredSequences.map((seq, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <AccordionItem 
                        value={`item-${index}`} 
                        className="border rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/30 transition-colors">
                          <div className="w-full">
                            <SequenceMetrics
                              rank={index + 1}
                              sessionCount={seq.count}
                              percentage={seq.percentage}
                              pageCount={seq.sequence.length}
                              firstAccessTime={seq.firstAccessTime}
                            />
                          </div>
                        </AccordionTrigger>
                        
                        <AccordionContent className="px-6 pb-6 space-y-6">
                          {/* Quick Actions */}
                          <div className="flex gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopySequence(seq)}
                              className="flex items-center gap-2"
                            >
                              <Copy className="h-3 w-3" />
                              Copiar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleExportCSV(seq)}
                              className="flex items-center gap-2"
                            >
                              <Download className="h-3 w-3" />
                              Exportar CSV
                            </Button>
                          </div>
                      {/* Location Summary */}
                      {seq.locations.length > 0 && (
                        <div className="p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Origem dos Visitantes</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {seq.locations.slice(0, 3).map((loc, idx) => (
                              <Badge key={idx} variant="outline" className="gap-1">
                                🌍 {loc.city}, {loc.country} ({Math.round((loc.count / seq.count) * 100)}%)
                              </Badge>
                            ))}
                            {seq.locations.length > 3 && (
                              <Badge variant="outline">
                                +{seq.locations.length - 3} mais
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Insights */}
                      <SequenceInsights sequence={seq} />

                      {/* Vertical Timeline */}
                      <div className="mt-6 space-y-0">
                        {seq.sequence.map((page, pageIndex) => {
                          const isFirst = pageIndex === 0;
                          const isLast = pageIndex === seq.sequence.length - 1;
                          const type = isFirst ? "entry" : isLast ? "exit" : "intermediate";
                          
                          const pageClicks = seq.clickEvents.filter(c => c.pageUrl === page);

                          return (
                            <div key={pageIndex}>
                              <SequenceStepBadge
                                url={page}
                                type={type}
                                sequenceNumber={pageIndex + 1}
                                totalSteps={seq.sequence.length}
                                avgTimeSpent={seq.timePerUrl[page] || 0}
                                clickEvents={pageClicks}
                              />
                              
                              {!isLast && <SequenceFlowLine />}
                            </div>
                          );
                        })}
                      </div>
                        </AccordionContent>
                      </AccordionItem>
                    </motion.div>
                  ))}
                </Accordion>
              </AnimatePresence>
            )}
          </div>
        )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};
