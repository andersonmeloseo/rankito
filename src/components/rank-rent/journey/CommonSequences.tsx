import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TooltipProvider } from "@/components/ui/tooltip";
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

interface LocationData {
  city: string;
  country: string;
  count: number;
}

interface ClickEventSummary {
  pageUrl: string;
  eventType: string;
  count: number;
  ctaText?: string;
}

interface CommonSequence {
  sequence: string[];
  count: number;
  percentage: number;
  pageCount: number;
  locations: LocationData[];
  avgDuration: number;
  avgTimePerPage: number;
  clickEvents: ClickEventSummary[];
  timePerUrl: Record<string, number>;
  firstAccessTime: string;
}

interface CommonSequencesProps {
  sequences: CommonSequence[];
}

export const CommonSequences = ({ sequences }: CommonSequencesProps) => {
  const [limit, setLimit] = useState<number | 'all'>(10);
  const [minPages, setMinPages] = useState<number>(1);
  const [minPercentage, setMinPercentage] = useState<number>(0);

  const filteredSequences = useMemo(() => {
    let filtered = sequences
      .filter(seq => seq.pageCount >= minPages)
      .filter(seq => seq.percentage >= minPercentage);
    
    if (limit !== 'all') {
      filtered = filtered.slice(0, limit);
    }
    
    return filtered;
  }, [sequences, limit, minPages, minPercentage]);

  const handleReset = () => {
    setLimit(10);
    setMinPages(1);
    setMinPercentage(0);
  };

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle>Sequências Mais Comuns de Navegação</CardTitle>
        </CardHeader>
        <CardContent>
        {sequences.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhuma sequência de navegação registrada ainda. Aguarde mais visitas.
          </p>
        ) : (
          <div className="space-y-6">
            <SequenceFilters
              totalSequences={sequences.length}
              filteredCount={filteredSequences.length}
              limit={limit}
              minPages={minPages}
              minPercentage={minPercentage}
              onLimitChange={setLimit}
              onMinPagesChange={setMinPages}
              onMinPercentageChange={setMinPercentage}
              onReset={handleReset}
            />

            {filteredSequences.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Nenhuma sequência encontrada com os filtros aplicados.
                  Tente ajustar os critérios de filtragem.
                </AlertDescription>
              </Alert>
            ) : (
              <Accordion type="single" collapsible defaultValue="item-0" className="space-y-4">
                {filteredSequences.map((seq, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
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
                ))}
              </Accordion>
            )}
          </div>
        )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};
