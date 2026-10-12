import React, { useMemo, useState } from 'react';
import { ClusterInfo, DendrogramNode, NewsArticle } from '../types/ml';
import { Network, Sliders } from 'lucide-react';

interface DendrogramViewProps {
  root: DendrogramNode;
  articles: NewsArticle[];
  clusters: ClusterInfo[];
  assignments: Map<string, number>;
  onSelectArticle: (articleId: string) => void;
  targetK: number;
}

export const DendrogramView: React.FC<DendrogramViewProps> = ({
  root,
  articles,
  clusters,
  assignments,
  onSelectArticle,
  targetK
}) => {
  const [hoveredNode, setHoveredNode] = useState<DendrogramNode | null>(null);

  const articleMap = useMemo(() => {
    const map = new Map<string, NewsArticle>();
    articles.forEach((a) => map.set(a.id, a));
    return map;
  }, [articles]);

  const clusterColorMap = useMemo(() => {
    const map = new Map<number, string>();
    clusters.forEach((c) => map.set(c.clusterId, c.color));
    map.set(-1, '#64748B');
    return map;
  }, [clusters]);

  // Compute 2D tree layout coordinates
  const { renderedLines, leafLabels, maxDistance } = useMemo(() => {
    if (!root) return { renderedLines: [], leafLabels: [], maxDistance: 1 };

    // 1. Gather all leaves in tree in-order traversal to assign x coordinates
    const leaves: DendrogramNode[] = [];
    const traverseLeaves = (node: DendrogramNode) => {
      if (node.isLeaf) {
        leaves.push(node);
      } else if (node.children) {
        traverseLeaves(node.children[0]);
        traverseLeaves(node.children[1]);
      }
    };
    traverseLeaves(root);

    const totalLeaves = leaves.length || 1;
    const leafXMap = new Map<string, number>();
    const svgWidth = 840;
    const paddingLeft = 40;
    const paddingRight = 40;
    const availableWidth = svgWidth - paddingLeft - paddingRight;
    const stepX = availableWidth / (totalLeaves - 1 || 1);

    leaves.forEach((leaf, idx) => {
      leafXMap.set(leaf.id, paddingLeft + idx * stepX);
    });

    // 2. Find max merge distance
    let maxD = 0.01;
    const findMaxDist = (node: DendrogramNode) => {
      if (node.distance > maxD) maxD = node.distance;
      if (node.children) {
        findMaxDist(node.children[0]);
        findMaxDist(node.children[1]);
      }
    };
    findMaxDist(root);

    // 3. Compute (x, y) for all internal nodes and generate SVG paths
    const lines: {
      id: string;
      path: string;
      node: DendrogramNode;
      isHighlighted: boolean;
    }[] = [];

    const svgHeight = 440;
    const paddingTop = 30;
    const paddingBottom = 70;
    const availableHeight = svgHeight - paddingTop - paddingBottom;

    const assignCoords = (node: DendrogramNode): { x: number; y: number } => {
      // y is proportional to merge distance: bottom (0) to top (maxD)
      const normalizedY = (node.distance / maxD) * availableHeight;
      const y = svgHeight - paddingBottom - normalizedY;

      if (node.isLeaf) {
        const x = leafXMap.get(node.id) || paddingLeft;
        node.x = x;
        node.y = y;
        return { x, y };
      }

      if (node.children) {
        const leftCoord = assignCoords(node.children[0]);
        const rightCoord = assignCoords(node.children[1]);
        const x = (leftCoord.x + rightCoord.x) / 2;
        node.x = x;
        node.y = y;

        // Path: from left child up to y, horizontal to right child x, down to right child y
        const path = `M ${leftCoord.x} ${leftCoord.y} L ${leftCoord.x} ${y} L ${rightCoord.x} ${y} L ${rightCoord.x} ${rightCoord.y}`;
        lines.push({
          id: node.id,
          path,
          node,
          isHighlighted: false
        });

        return { x, y };
      }

      return { x: paddingLeft, y: svgHeight - paddingBottom };
    };

    assignCoords(root);

    const labels = leaves.map((leaf) => {
      const art = leaf.articleId ? articleMap.get(leaf.articleId) : null;
      const clusterId = leaf.articleId ? assignments.get(leaf.articleId) ?? -1 : -1;
      return {
        id: leaf.id,
        articleId: leaf.articleId,
        x: leaf.x || 0,
        y: (leaf.y || 0) + 12,
        title: art ? art.title : 'Doc',
        source: art ? art.source : '',
        clusterId,
        color: clusterColorMap.get(clusterId) || '#64748B'
      };
    });

    return { renderedLines: lines, leafLabels: labels, maxDistance: maxD };
  }, [root, articles, assignments, articleMap, clusterColorMap]);

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Network className="w-4 h-4 text-slate-700" />
            <span>Hierarchical Agglomerative Dendrogram</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Displays bottom-up agglomeration tree based on cosine distance. The dashed red line shows the cut threshold yielding{' '}
            <span className="font-semibold text-slate-800 font-mono">{targetK} clusters</span>.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Max Cosine Merge Distance:</span>
          <span className="font-mono font-semibold text-slate-800">
            {maxDistance.toFixed(3)}
          </span>
        </div>
      </div>

      {/* Dendrogram SVG Canvas */}
      <div className="overflow-x-auto border border-slate-200 rounded bg-slate-50/30 p-2">
        <svg
          viewBox="0 0 860 480"
          className="w-full min-w-[780px] h-[460px] select-none"
        >
          {/* Background grid guides */}
          <line x1="30" y1="50" x2="830" y2="50" stroke="#E2E8F0" strokeDasharray="3 3" />
          <line x1="30" y1="150" x2="830" y2="150" stroke="#E2E8F0" strokeDasharray="3 3" />
          <line x1="30" y1="250" x2="830" y2="250" stroke="#E2E8F0" strokeDasharray="3 3" />
          <line x1="30" y1="350" x2="830" y2="350" stroke="#E2E8F0" strokeDasharray="3 3" />

          {/* Cluster cut line indicator */}
          <g transform="translate(0, 160)">
            <line
              x1="30"
              y1="0"
              x2="830"
              y2="0"
              stroke="#DC2626"
              strokeWidth="1.5"
              strokeDasharray="5 4"
            />
            <rect x="740" y="-18" width="85" height="18" rx="3" fill="#FEE2E2" />
            <text x="782" y="-6" fill="#991B1B" fontSize="9.5" textAnchor="middle" fontWeight="bold">
              K = {targetK} Cut
            </text>
          </g>

          {/* Tree Merge Lines */}
          {renderedLines.map((line) => {
            const isHovered = hoveredNode?.id === line.node.id;
            return (
              <path
                key={line.id}
                d={line.path}
                fill="none"
                stroke={isHovered ? '#2563EB' : '#475569'}
                strokeWidth={isHovered ? '2.5' : '1.2'}
                className="transition-colors cursor-pointer"
                onMouseEnter={() => setHoveredNode(line.node)}
                onMouseLeave={() => setHoveredNode(null)}
              />
            );
          })}

          {/* Leaf Nodes & Markers */}
          {leafLabels.map((leaf, idx) => (
            <g
              key={leaf.id}
              className="cursor-pointer group"
              onClick={() => leaf.articleId && onSelectArticle(leaf.articleId)}
            >
              {/* Dot at leaf */}
              <circle
                cx={leaf.x}
                cy={370}
                r="3.5"
                fill={leaf.color}
                stroke="#ffffff"
                strokeWidth="1.2"
              />

              {/* Angled label at bottom */}
              <text
                x={leaf.x}
                y={382}
                transform={`rotate(45, ${leaf.x}, 382)`}
                fontSize="9"
                fill="#334155"
                className="group-hover:fill-blue-600 transition-colors"
              >
                {leaf.source || `Doc ${idx + 1}`}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {hoveredNode && (
        <div className="p-3 rounded bg-slate-100 text-xs text-slate-700 flex items-center justify-between">
          <span>
            Merge Distance: <span className="font-mono font-bold">{hoveredNode.distance.toFixed(4)}</span>
          </span>
          <span className="text-slate-500">
            Node ID: {hoveredNode.id}
          </span>
        </div>
      )}
    </div>
  );
};
