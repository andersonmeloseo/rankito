import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GitBranch } from "lucide-react";
import { useState } from "react";
import { formatPageName } from "@/lib/journey-utils";
import type { CommonSequence } from "@/hooks/useSessionAnalytics";

interface JourneySequenceDiagramProps {
  sequences: (CommonSequence & { originalLength?: number })[];
}

interface StepNode {
  page: string;
  label: string;
  y: number;
  sequences: number[]; // índices das sequências que passam por este nó
}

export const JourneySequenceDiagram = ({ sequences }: JourneySequenceDiagramProps) => {
  const [hoveredSequence, setHoveredSequence] = useState<number | null>(null);

  // Configurações do diagrama
  const nodeWidth = 160;
  const nodeHeight = 40;
  const columnGap = 120;
  const margin = { top: 60, right: 40, bottom: 40, left: 40 };
  const verticalGap = 20;

  // Determinar número máximo de etapas
  const maxSteps = Math.max(...sequences.map(s => s.sequence.length));

  if (maxSteps === 0 || sequences.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-primary" />
            Sequências de Navegação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Dados insuficientes para gerar diagrama de sequências.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Organizar nós por etapa
  const stepColumns: StepNode[][] = [];
  
  for (let step = 0; step < maxSteps; step++) {
    const pagesAtStep = new Map<string, number[]>();
    
    sequences.forEach((seq, seqIdx) => {
      const page = seq.sequence[step];
      if (page) {
        if (!pagesAtStep.has(page)) {
          pagesAtStep.set(page, []);
        }
        pagesAtStep.get(page)!.push(seqIdx);
      }
    });

    const nodes: StepNode[] = Array.from(pagesAtStep.entries()).map(([page, seqIndices]) => ({
      page,
      label: formatPageName(page),
      y: 0,
      sequences: seqIndices,
    }));

    // Posicionar nós verticalmente
    nodes.forEach((node, idx) => {
      node.y = margin.top + idx * (nodeHeight + verticalGap);
    });

    stepColumns.push(nodes);
  }

  // Calcular dimensões do SVG
  const width = margin.left + margin.right + (maxSteps * nodeWidth) + ((maxSteps - 1) * columnGap);
  const maxNodesInColumn = Math.max(...stepColumns.map(col => col.length));
  const height = margin.top + margin.bottom + (maxNodesInColumn * (nodeHeight + verticalGap));

  // Cores para as sequências
  const colors = [
    'hsl(var(--primary))',
    'hsl(217, 91%, 60%)',
    'hsl(142, 71%, 45%)',
    'hsl(262, 83%, 58%)',
    'hsl(340, 82%, 52%)',
    'hsl(24, 95%, 53%)',
    'hsl(173, 58%, 39%)',
    'hsl(45, 93%, 47%)',
  ];

  // Calcular largura máxima de fluxo para normalização
  const maxCount = Math.max(...sequences.map(s => s.count));

  // Gerar path para conexão entre nós
  const generatePath = (
    x1: number, y1: number,
    x2: number, y2: number,
    strokeWidth: number
  ) => {
    const midX = (x1 + x2) / 2;
    const offset = strokeWidth / 2;
    
    return `
      M ${x1} ${y1}
      C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}
    `;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-primary" />
          Sequências de Navegação Completas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <svg
            width={width}
            height={height}
            className="mx-auto"
            style={{ maxWidth: '100%', height: 'auto' }}
          >
            {/* Headers das etapas */}
            {stepColumns.map((_, stepIdx) => (
              <text
                key={`header-${stepIdx}`}
                x={margin.left + (stepIdx * (nodeWidth + columnGap)) + nodeWidth / 2}
                y={margin.top - 30}
                textAnchor="middle"
                className="fill-muted-foreground text-sm font-semibold"
              >
                Etapa {stepIdx + 1}
              </text>
            ))}

            {/* Renderizar fluxos (conexões entre nós) */}
            {sequences.map((seq, seqIdx) => {
              const color = colors[seqIdx % colors.length];
              const isHovered = hoveredSequence === seqIdx;
              const strokeWidth = Math.max(2, (seq.count / maxCount) * 12);

              return (
                <g key={`flow-${seqIdx}`}>
                  {seq.sequence.map((page, stepIdx) => {
                    if (stepIdx === seq.sequence.length - 1) return null;

                    const currentNode = stepColumns[stepIdx].find(n => n.page === page);
                    const nextPage = seq.sequence[stepIdx + 1];
                    const nextNode = stepColumns[stepIdx + 1].find(n => n.page === nextPage);

                    if (!currentNode || !nextNode) return null;

                    const x1 = margin.left + (stepIdx * (nodeWidth + columnGap)) + nodeWidth;
                    const y1 = currentNode.y + nodeHeight / 2;
                    const x2 = margin.left + ((stepIdx + 1) * (nodeWidth + columnGap));
                    const y2 = nextNode.y + nodeHeight / 2;

                    return (
                      <path
                        key={`path-${seqIdx}-${stepIdx}`}
                        d={generatePath(x1, y1, x2, y2, strokeWidth)}
                        stroke={color}
                        strokeWidth={strokeWidth}
                        fill="none"
                        opacity={hoveredSequence !== null && !isHovered ? 0.15 : 0.6}
                        className="transition-all duration-300 cursor-pointer"
                        onMouseEnter={() => setHoveredSequence(seqIdx)}
                        onMouseLeave={() => setHoveredSequence(null)}
                      />
                    );
                  })}

                  {/* Tooltip quando hover */}
                  {isHovered && (
                    <g>
                      <rect
                        x={margin.left}
                        y={height - margin.bottom + 10}
                        width={width - margin.left - margin.right}
                        height={30}
                        fill="hsl(var(--popover))"
                        stroke="hsl(var(--border))"
                        rx={4}
                      />
                      <text
                        x={width / 2}
                        y={height - margin.bottom + 28}
                        textAnchor="middle"
                        className="fill-popover-foreground text-sm font-medium"
                      >
                        {seq.count} sessões: {seq.sequence.map(formatPageName).join(' → ')}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Renderizar nós por etapa */}
            {stepColumns.map((nodes, stepIdx) => (
              <g key={`step-${stepIdx}`}>
                {nodes.map((node, nodeIdx) => {
                  const x = margin.left + (stepIdx * (nodeWidth + columnGap));
                  const y = node.y;
                  const totalSessions = node.sequences.reduce(
                    (sum, seqIdx) => sum + sequences[seqIdx].count,
                    0
                  );
                  const isHighlighted = hoveredSequence !== null && node.sequences.includes(hoveredSequence);

                  return (
                    <g key={`node-${stepIdx}-${nodeIdx}`}>
                      <rect
                        x={x}
                        y={y}
                        width={nodeWidth}
                        height={nodeHeight}
                        fill="hsl(var(--card))"
                        stroke={isHighlighted ? 'hsl(var(--primary))' : 'hsl(var(--border))'}
                        strokeWidth={isHighlighted ? 3 : 2}
                        rx={8}
                        className="transition-all duration-300"
                      />
                      <text
                        x={x + nodeWidth / 2}
                        y={y + nodeHeight / 2 - 4}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-foreground text-sm font-medium pointer-events-none"
                      >
                        {node.label.length > 18 ? node.label.substring(0, 16) + '...' : node.label}
                      </text>
                      <text
                        x={x + nodeWidth / 2}
                        y={y + nodeHeight / 2 + 12}
                        textAnchor="middle"
                        className="fill-muted-foreground text-xs pointer-events-none"
                      >
                        {totalSessions} {totalSessions === 1 ? 'sessão' : 'sessões'}
                      </text>
                      {stepIdx === stepColumns.length - 1 && sequences.some((seq, idx) => 
                        node.sequences.includes(idx) && seq.originalLength && seq.originalLength > 4
                      ) && (
                        <text
                          x={x + nodeWidth / 2}
                          y={y + nodeHeight + 18}
                          textAnchor="middle"
                          className="fill-muted-foreground text-[10px] pointer-events-none"
                        >
                          +{sequences.find((seq, idx) => 
                            node.sequences.includes(idx) && seq.originalLength
                          )?.originalLength! - 4} páginas
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            ))}
          </svg>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-4">
          Passe o mouse sobre as conexões para ver detalhes da sequência
        </p>
      </CardContent>
    </Card>
  );
};
