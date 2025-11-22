import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { SequenceStepBadge } from "./SequenceStepBadge";
import { SequenceFlowLine } from "./SequenceFlowLine";
import { SequenceMetrics } from "./SequenceMetrics";
import { SequenceFilters } from "./SequenceFilters";

interface CommonSequence {
  sequence: string[];
  count: number;
  percentage: number;
  pageCount: number;
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
    setMinPages(2);
    setMinPercentage(0);
  };

  return (
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
              <div className="space-y-6">
                {filteredSequences.map((seq, index) => (
              <Card key={index} className="shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardContent className="pt-6">
                  {/* Metrics Header */}
                  <SequenceMetrics
                    rank={index + 1}
                    sessionCount={seq.count}
                    percentage={seq.percentage}
                    pageCount={seq.sequence.length}
                  />

                  {/* Vertical Timeline */}
                  <div className="mt-6 space-y-0">
                    {seq.sequence.map((page, pageIndex) => {
                      const isFirst = pageIndex === 0;
                      const isLast = pageIndex === seq.sequence.length - 1;
                      const type = isFirst ? "entry" : isLast ? "exit" : "intermediate";

                      return (
                        <div key={pageIndex}>
                          <SequenceStepBadge
                            url={page}
                            type={type}
                            sequenceNumber={pageIndex + 1}
                            totalSteps={seq.sequence.length}
                          />
                          
                          {!isLast && <SequenceFlowLine />}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
