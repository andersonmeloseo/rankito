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
  const [hoveredNode, setHoveredNode] = useState<{ step: number; nodeIdx: number } | null>(null);

  // Configurações do diagrama
  const nodeWidth = 160;
  const nodeHeight = 40;
  const columnGap = 120;
  const margin = { top: 60, right: 40, bottom: 160, left: 40 };
  const verticalGap = 35;

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
  const height = margin.top + margin.bottom + 140 + (maxNodesInColumn * (nodeHeight + verticalGap));

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

  // Agregar conexões por caminho único
  interface AggregatedPath {
    from: string;
    to: string;
    stepIdx: number;
    totalCount: number;
    sequences: number[];
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }

  const aggregatedPaths: AggregatedPath[] = [];

  sequences.forEach((seq, seqIdx) => {
    seq.sequence.forEach((page, stepIdx) => {
      if (stepIdx === seq.sequence.length - 1) return;

      const currentNode = stepColumns[stepIdx].find(n => n.page === page);
      const nextPage = seq.sequence[stepIdx + 1];
      const nextNode = stepColumns[stepIdx + 1]?.find(n => n.page === nextPage);

      if (!currentNode || !nextNode) return;

      let existingPath = aggregatedPaths.find(
        p => p.stepIdx === stepIdx && p.from === page && p.to === nextPage
      );

      if (existingPath) {
        existingPath.totalCount += seq.count;
        existingPath.sequences.push(seqIdx);
      } else {
        const x1 = margin.left + (stepIdx * (nodeWidth + columnGap)) + nodeWidth;
        const y1 = currentNode.y + nodeHeight / 2;
        const x2 = margin.left + ((stepIdx + 1) * (nodeWidth + columnGap));
        const y2 = nextNode.y + nodeHeight / 2;

        aggregatedPaths.push({
          from: page,
          to: nextPage,
          stepIdx,
          totalCount: seq.count,
          sequences: [seqIdx],
          x1,
          y1,
          x2,
          y2,
        });
      }
    });
  });

  const maxAggregatedCount = Math.max(...aggregatedPaths.map(p => p.totalCount), 1);

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

            {/* Renderizar fluxos agregados (conexões entre nós) */}
            {aggregatedPaths.map((path, pathIdx) => {
              const strokeWidth = Math.max(2, (path.totalCount / maxAggregatedCount) * 20);
              
              // Destacar se hover na sequência OU se hover no nó relacionado
              const isHoveredBySequence = hoveredSequence !== null && path.sequences.includes(hoveredSequence);
              
              const isHoveredByNode = hoveredNode !== null && (
                (stepColumns[hoveredNode.step]?.[hoveredNode.nodeIdx]?.page === path.from && 
                 path.stepIdx === hoveredNode.step) ||
                (stepColumns[hoveredNode.step]?.[hoveredNode.nodeIdx]?.page === path.to && 
                 path.stepIdx === hoveredNode.step - 1)
              );
              
              const isHighlighted = isHoveredBySequence || isHoveredByNode;
              
              const dominantSeqIdx = path.sequences[0];
              const color = colors[dominantSeqIdx % colors.length];

              return (
                <g key={`path-${pathIdx}`}>
                  <path
                    d={generatePath(path.x1, path.y1, path.x2, path.y2, strokeWidth)}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="none"
                    opacity={
                      (hoveredSequence !== null || hoveredNode !== null) && !isHighlighted 
                        ? 0.15 
                        : 0.7
                    }
                    className="transition-all duration-300 cursor-pointer"
                  onMouseEnter={() => setHoveredSequence(path.sequences[0])}
                  onMouseLeave={() => setHoveredSequence(null)}
                />
                </g>
              );
            })}

            {/* Legenda inferior unificada */}
            {(hoveredSequence !== null || hoveredNode !== null) && (() => {
              // CASO 1: Hover em conexão/sequência
              if (hoveredSequence !== null) {
                const sequence = sequences[hoveredSequence];
                const sequenceText = sequence.sequence.map(formatPageName).join(' → ');
                const textLength = sequenceText.length;
                const calculatedHeight = Math.min(120, Math.max(50, textLength / 2));
                
                return (
                  <g>
                    <rect
                      x={margin.left}
                      y={height - margin.bottom + 10}
                      width={width - margin.left - margin.right}
                      height={calculatedHeight}
                      fill="hsl(var(--popover))"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      rx={6}
                      filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
                    />
                    <text
                      x={width / 2}
                      y={height - margin.bottom + 28}
                      textAnchor="middle"
                      className="fill-primary text-sm font-semibold"
                    >
                      📊 {sequence.count} {sequence.count === 1 ? 'sessão' : 'sessões'}
                    </text>
                    <foreignObject
                      x={margin.left + 20}
                      y={height - margin.bottom + 40}
                      width={width - margin.left - margin.right - 40}
                      height={calculatedHeight - 35}
                    >
                      <div className="text-xs text-popover-foreground text-center px-4 py-2 overflow-auto">
                        <strong>Sequência completa:</strong> {sequenceText}
                      </div>
                    </foreignObject>
                  </g>
                );
              }
              
              // CASO 2: Hover em nó
              if (hoveredNode !== null && stepColumns[hoveredNode.step]?.[hoveredNode.nodeIdx]) {
                const node = stepColumns[hoveredNode.step][hoveredNode.nodeIdx];
                const stepIdx = hoveredNode.step;
                
                const totalSessions = node.sequences.reduce(
                  (sum, seqIdx) => sum + sequences[seqIdx].count,
                  0
                );
                
                const incomingConnections = aggregatedPaths.filter(p => 
                  p.to === node.page && p.stepIdx === stepIdx - 1
                );
                
                const outgoingConnections = aggregatedPaths.filter(p => 
                  p.from === node.page && p.stepIdx === stepIdx
                );
                
                const incomingCount = incomingConnections.reduce((sum, p) => sum + p.totalCount, 0);
                const outgoingCount = outgoingConnections.reduce((sum, p) => sum + p.totalCount, 0);
                
                return (
                  <g>
                    <rect
                      x={margin.left}
                      y={height - margin.bottom + 10}
                      width={width - margin.left - margin.right}
                      height={100}
                      fill="hsl(var(--popover))"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      rx={6}
                      filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
                    />
                    
                    {/* Título da página */}
                    <text
                      x={width / 2}
                      y={height - margin.bottom + 30}
                      textAnchor="middle"
                      className="fill-primary text-base font-bold"
                    >
                      {node.label}
                    </text>
                    
                    {/* URL */}
                    <text
                      x={width / 2}
                      y={height - margin.bottom + 50}
                      textAnchor="middle"
                      className="fill-muted-foreground text-xs"
                    >
                      {node.page}
                    </text>
                    
                    {/* Estatísticas */}
                    <text
                      x={width / 2}
                      y={height - margin.bottom + 70}
                      textAnchor="middle"
                      className="fill-popover-foreground text-sm font-medium"
                    >
                      📊 {totalSessions} {totalSessions === 1 ? 'sessão' : 'sessões'}
                    </text>
                    
                    {/* Conexões */}
                    <text
                      x={width / 2}
                      y={height - margin.bottom + 90}
                      textAnchor="middle"
                      className="fill-popover-foreground text-xs"
                    >
                      {incomingConnections.length > 0 && `↓ ${incomingCount} entrada${incomingCount !== 1 ? 's' : ''}`}
                      {incomingConnections.length > 0 && outgoingConnections.length > 0 && ' • '}
                      {outgoingConnections.length > 0 && `↑ ${outgoingCount} saída${outgoingCount !== 1 ? 's' : ''}`}
                    </text>
                  </g>
                );
              }
              
              return null;
            })()}

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
                        className="transition-all duration-300 cursor-pointer"
                        onMouseEnter={() => setHoveredNode({ step: stepIdx, nodeIdx })}
                        onMouseLeave={() => setHoveredNode(null)}
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
                        node.sequences.includes(idx) && seq.originalLength && seq.originalLength > 5
                      ) && (
                        <text
                          x={x + nodeWidth / 2}
                          y={y + nodeHeight + 18}
                          textAnchor="middle"
                          className="fill-muted-foreground text-[10px] pointer-events-none"
                        >
                          +{sequences.find((seq, idx) => 
                            node.sequences.includes(idx) && seq.originalLength
                          )?.originalLength! - 5} páginas
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
          Passe o mouse sobre os nós ou conexões para ver detalhes na legenda abaixo
        </p>
      </CardContent>
    </Card>
  );
};
