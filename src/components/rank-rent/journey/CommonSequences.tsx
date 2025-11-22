import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SequenceStepBadge } from "./SequenceStepBadge";
import { SequenceFlowLine } from "./SequenceFlowLine";
import { SequenceMetrics } from "./SequenceMetrics";

interface CommonSequence {
  sequence: string[];
  count: number;
  percentage: number;
}

interface CommonSequencesProps {
  sequences: CommonSequence[];
}

export const CommonSequences = ({ sequences }: CommonSequencesProps) => {
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
            {sequences.map((seq, index) => (
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
      </CardContent>
    </Card>
  );
};
