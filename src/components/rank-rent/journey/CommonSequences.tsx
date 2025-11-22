import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

interface CommonSequence {
  sequence: string[];
  count: number;
  percentage: number;
}

interface CommonSequencesProps {
  sequences: CommonSequence[];
}

export const CommonSequences = ({ sequences }: CommonSequencesProps) => {
  const formatUrl = (url: string) => {
    try {
      const path = new URL(url).pathname;
      return path === '/' ? 'Home' : path.split('/').filter(Boolean).join(' / ');
    } catch {
      return url;
    }
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
          <div className="space-y-4">
            {sequences.map((seq, index) => (
              <div key={index} className="border rounded-lg p-4 hover:bg-accent/5 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      {seq.sequence.map((page, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="bg-muted px-3 py-1.5 rounded-md text-sm font-medium truncate max-w-[200px]">
                            {formatUrl(page)}
                          </div>
                          {i < seq.sequence.length - 1 && (
                            <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{seq.count} sessões</span>
                      <span>•</span>
                      <span>{seq.percentage.toFixed(1)}% do total</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
