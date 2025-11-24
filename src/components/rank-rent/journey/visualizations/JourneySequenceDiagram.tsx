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
              const isHovered = hoveredSequence !== null && path.sequences.includes(hoveredSequence);
              const dominantSeqIdx = path.sequences[0];
              const color = colors[dominantSeqIdx % colors.length];

              return (
                <g key={`path-${pathIdx}`}>
                  <path
                    d={generatePath(path.x1, path.y1, path.x2, path.y2, strokeWidth)}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="none"
                    opacity={hoveredSequence !== null && !isHovered ? 0.15 : 0.7}
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setHoveredSequence(path.sequences[0])}
                    onMouseLeave={() => setHoveredSequence(null)}
                  />
                  
                  {isHovered && (
                    <g className="pointer-events-none">
                      <rect
                        x={path.x1 + (path.x2 - path.x1) / 2 - 110}
                        y={Math.min(path.y1, path.y2) - 45}
                        width={220}
                        height={35}
                        fill="hsl(var(--popover))"
                        stroke="hsl(var(--border))"
                        strokeWidth={2}
                        rx={6}
                        filter="drop-shadow(0 4px 6px rgba(0,0,0,0.1))"
                      />
                      <text
                        x={path.x1 + (path.x2 - path.x1) / 2}
                        y={Math.min(path.y1, path.y2) - 22}
                        textAnchor="middle"
                        className="fill-popover-foreground text-xs font-semibold"
                      >
                        {path.totalCount} {path.totalCount === 1 ? 'sessão' : 'sessões'}
                      </text>
                      <text
                        x={path.x1 + (path.x2 - path.x1) / 2}
                        y={Math.min(path.y1, path.y2) - 8}
                        textAnchor="middle"
                        className="fill-muted-foreground text-xs"
                      >
                        {formatPageName(path.from)} → {formatPageName(path.to)}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Tooltip de sequência completa na parte inferior */}
            {hoveredSequence !== null && (
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
                  {sequences[hoveredSequence].count} sessões: {sequences[hoveredSequence].sequence.map(formatPageName).join(' → ')}
                </text>
              </g>
            )}

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
                      
                      {/* Tooltip ao passar mouse */}
                      {hoveredNode?.step === stepIdx && hoveredNode?.nodeIdx === nodeIdx && (
                        <g className="pointer-events-none">
                          {/* Background do tooltip */}
                          <rect
                            x={x + nodeWidth / 2 - 120}
                            y={y > 100 ? y - 85 : y + nodeHeight + 15}
                            width={240}
                            height={75}
                            fill="hsl(var(--popover))"
                            stroke="hsl(var(--border))"
                            strokeWidth={2}
                            rx={8}
                            filter="drop-shadow(0 4px 6px rgba(0,0,0,0.1))"
                          />
                          
                          {/* Seta apontando para o nó */}
                          {y > 100 ? (
                            <path
                              d={`M ${x + nodeWidth / 2 - 8} ${y - 10} 
                                  L ${x + nodeWidth / 2} ${y} 
                                  L ${x + nodeWidth / 2 + 8} ${y - 10} Z`}
                              fill="hsl(var(--popover))"
                            />
                          ) : (
                            <path
                              d={`M ${x + nodeWidth / 2 - 8} ${y + nodeHeight + 15} 
                                  L ${x + nodeWidth / 2} ${y + nodeHeight + 5} 
                                  L ${x + nodeWidth / 2 + 8} ${y + nodeHeight + 15} Z`}
                              fill="hsl(var(--popover))"
                            />
                          )}
                          
                          {/* Título completo da página */}
                          <text
                            x={x + nodeWidth / 2}
                            y={y > 100 ? y - 60 : y + nodeHeight + 40}
                            textAnchor="middle"
                            className="fill-popover-foreground text-sm font-semibold"
                          >
                            {node.label}
                          </text>
                          
                          {/* URL original */}
                          <text
                            x={x + nodeWidth / 2}
                            y={y > 100 ? y - 40 : y + nodeHeight + 60}
                            textAnchor="middle"
                            className="fill-muted-foreground text-xs"
                          >
                            {node.page.length > 35 ? node.page.substring(0, 35) + '...' : node.page}
                          </text>
                          
                          {/* Número de sessões */}
                          <text
                            x={x + nodeWidth / 2}
                            y={y > 100 ? y - 23 : y + nodeHeight + 77}
                            textAnchor="middle"
                            className="fill-muted-foreground text-xs font-medium"
                          >
                            {totalSessions} {totalSessions === 1 ? 'sessão passou aqui' : 'sessões passaram aqui'}
                          </text>
                        </g>
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
