import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GitBranch } from "lucide-react";
import { useState } from "react";
import { formatPageName } from "@/lib/journey-utils";

interface FlowConnection {
  from: string;
  to: string;
  count: number;
}

interface JourneyFlowDiagramProps {
  connections: FlowConnection[];
  topPages: string[];
}

interface NodePosition {
  url: string;
  label: string;
  y: number;
  totalFlow: number;
}

export const JourneyFlowDiagram = ({ connections, topPages }: JourneyFlowDiagramProps) => {
  const [hoveredFlow, setHoveredFlow] = useState<string | null>(null);

  // Configurações do diagrama
  const width = 800;
  const height = 500;
  const nodeWidth = 180;
  const nodePadding = 12;
  const margin = { top: 20, right: 20, bottom: 20, left: 20 };

  // Pegar top 8 conexões mais relevantes
  const topConnections = connections
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  if (topConnections.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-primary" />
            Fluxo entre Páginas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Dados insuficientes para gerar diagrama de fluxo.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Extrair páginas únicas de origem e destino
  const sourcePages = [...new Set(topConnections.map(c => c.from))];
  const targetPages = [...new Set(topConnections.map(c => c.to))];

  // Calcular fluxo total por página
  const sourceFlows = new Map<string, number>();
  const targetFlows = new Map<string, number>();
  
  topConnections.forEach(conn => {
    sourceFlows.set(conn.from, (sourceFlows.get(conn.from) || 0) + conn.count);
    targetFlows.set(conn.to, (targetFlows.get(conn.to) || 0) + conn.count);
  });

  // Posicionar nós
  const availableHeight = height - margin.top - margin.bottom;
  const sourceSpacing = availableHeight / sourcePages.length;
  const targetSpacing = availableHeight / targetPages.length;

  const sourceNodes: NodePosition[] = sourcePages.map((url, i) => ({
    url,
    label: formatPageName(url),
    y: margin.top + sourceSpacing * i + sourceSpacing / 2,
    totalFlow: sourceFlows.get(url) || 0,
  }));

  const targetNodes: NodePosition[] = targetPages.map((url, i) => ({
    url,
    label: formatPageName(url),
    y: margin.top + targetSpacing * i + targetSpacing / 2,
    totalFlow: targetFlows.get(url) || 0,
  }));

  // Cores para os fluxos
  const colors = [
    'hsl(var(--primary))',
    'hsl(217, 91%, 60%)', // blue
    'hsl(142, 71%, 45%)', // green
    'hsl(262, 83%, 58%)', // purple
    'hsl(340, 82%, 52%)', // pink
    'hsl(24, 95%, 53%)', // orange
    'hsl(173, 58%, 39%)', // teal
    'hsl(45, 93%, 47%)', // yellow
  ];

  // Calcular largura máxima para normalização
  const maxCount = Math.max(...topConnections.map(c => c.count));
  const maxFlowHeight = 60; // altura máxima da faixa

  // Gerar path SVG para curva Bezier (Sankey)
  const generatePath = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    height1: number,
    height2: number
  ) => {
    const midX = (x1 + x2) / 2;
    return `
      M ${x1} ${y1 - height1 / 2}
      C ${midX} ${y1 - height1 / 2}, ${midX} ${y2 - height2 / 2}, ${x2} ${y2 - height2 / 2}
      L ${x2} ${y2 + height2 / 2}
      C ${midX} ${y2 + height2 / 2}, ${midX} ${y1 + height1 / 2}, ${x1} ${y1 + height1 / 2}
      Z
    `;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-primary" />
          Fluxo entre Páginas
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
            {/* Renderizar fluxos (paths) */}
            {topConnections.map((conn, idx) => {
              const sourceNode = sourceNodes.find(n => n.url === conn.from);
              const targetNode = targetNodes.find(n => n.url === conn.to);
              
              if (!sourceNode || !targetNode) return null;

              const flowHeight = (conn.count / maxCount) * maxFlowHeight;
              const x1 = margin.left + nodeWidth;
              const y1 = sourceNode.y;
              const x2 = width - margin.right - nodeWidth;
              const y2 = targetNode.y;
              
              const path = generatePath(x1, y1, x2, y2, flowHeight, flowHeight);
              const color = colors[idx % colors.length];
              const flowKey = `${conn.from}-${conn.to}`;
              const isHovered = hoveredFlow === flowKey;

              return (
                <g key={flowKey}>
                  <path
                    d={path}
                    fill={color}
                    opacity={hoveredFlow && !isHovered ? 0.2 : 0.6}
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setHoveredFlow(flowKey)}
                    onMouseLeave={() => setHoveredFlow(null)}
                  />
                  {isHovered && (
                    <text
                      x={(x1 + x2) / 2}
                      y={(y1 + y2) / 2}
                      textAnchor="middle"
                      className="fill-foreground text-sm font-semibold pointer-events-none"
                      style={{ textShadow: '0 0 4px hsl(var(--background))' }}
                    >
                      {conn.count} sessões
                    </text>
                  )}
                </g>
              );
            })}

            {/* Renderizar nós de origem (esquerda) */}
            {sourceNodes.map((node, idx) => (
              <g key={`source-${idx}`}>
                <rect
                  x={margin.left}
                  y={node.y - 20}
                  width={nodeWidth}
                  height={40}
                  fill="hsl(var(--card))"
                  stroke="hsl(var(--border))"
                  strokeWidth={2}
                  rx={8}
                  className="transition-all duration-300"
                />
                <text
                  x={margin.left + nodeWidth / 2}
                  y={node.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-foreground text-sm font-medium pointer-events-none"
                >
                  {node.label.length > 20 ? node.label.substring(0, 18) + '...' : node.label}
                </text>
                <text
                  x={margin.left + nodeWidth / 2}
                  y={node.y + 14}
                  textAnchor="middle"
                  className="fill-muted-foreground text-xs pointer-events-none"
                >
                  {node.totalFlow} saídas
                </text>
              </g>
            ))}

            {/* Renderizar nós de destino (direita) */}
            {targetNodes.map((node, idx) => (
              <g key={`target-${idx}`}>
                <rect
                  x={width - margin.right - nodeWidth}
                  y={node.y - 20}
                  width={nodeWidth}
                  height={40}
                  fill="hsl(var(--card))"
                  stroke="hsl(var(--border))"
                  strokeWidth={2}
                  rx={8}
                  className="transition-all duration-300"
                />
                <text
                  x={width - margin.right - nodeWidth / 2}
                  y={node.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-foreground text-sm font-medium pointer-events-none"
                >
                  {node.label.length > 20 ? node.label.substring(0, 18) + '...' : node.label}
                </text>
                <text
                  x={width - margin.right - nodeWidth / 2}
                  y={node.y + 14}
                  textAnchor="middle"
                  className="fill-muted-foreground text-xs pointer-events-none"
                >
                  {node.totalFlow} entradas
                </text>
              </g>
            ))}
          </svg>
        </div>
      </CardContent>
    </Card>
  );
};
