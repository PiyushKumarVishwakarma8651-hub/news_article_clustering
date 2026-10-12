import React, { useState, useMemo, useRef } from 'react';
import { ClusterInfo, NewsArticle, Projection2DPoint } from '../types/ml';
import { computeConvexHull } from '../ml/projection';
import { Eye, Layers, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

interface ClusterMapProps {
  points: Projection2DPoint[];
  clusters: ClusterInfo[];
  articles: NewsArticle[];
  explainedVariance?: [number, number];
  projectionMethod: 'pca' | 'tsne';
  onSelectArticle: (articleId: string) => void;
  selectedArticleId: string | null;
}

export const ClusterMap: React.FC<ClusterMapProps> = ({
  points,
  clusters,
  articles,
  explainedVariance,
  projectionMethod,
  onSelectArticle,
  selectedArticleId
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<Projection2DPoint | null>(null);
  const [activeClusterFilter, setActiveClusterFilter] = useState<number | 'all'>('all');
  const [showHulls, setShowHulls] = useState(true);
  const [showCentroidLabels, setShowCentroidLabels] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Map article ID to article object for fast lookup
  const articleMap = useMemo(() => {
    const map = new Map<string, NewsArticle>();
    articles.forEach((a) => map.set(a.id, a));
    return map;
  }, [articles]);

  // Color lookup
  const clusterColorMap = useMemo(() => {
    const map = new Map<number, string>();
    clusters.forEach((c) => map.set(c.clusterId, c.color));
    map.set(-1, '#64748B'); // noise color
    return map;
  }, [clusters]);

  const clusterTitleMap = useMemo(() => {
    const map = new Map<number, string>();
    clusters.forEach((c) => map.set(c.clusterId, c.label));
    map.set(-1, 'Unclustered Noise');
    return map;
  }, [clusters]);

  // Compute convex hulls for each cluster
  const clusterHulls = useMemo(() => {
    const hulls: { clusterId: number; color: string; path: string; centroid: { x: number; y: number } }[] = [];

    clusters.forEach((cluster) => {
      if (cluster.clusterId === -1) return; // skip noise hull
      const clusterPoints = points.filter((p) => p.clusterId === cluster.clusterId);
      if (clusterPoints.length < 3) return;

      const hullPoints = computeConvexHull(clusterPoints.map((p) => ({ x: p.x, y: p.y })));
      if (hullPoints.length < 3) return;

      const pathStr = hullPoints.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ') + ' Z';

      // Centroid of hull
      let sumX = 0, sumY = 0;
      clusterPoints.forEach((p) => {
        sumX += p.x;
        sumY += p.y;
      });

      hulls.push({
        clusterId: cluster.clusterId,
        color: cluster.color,
        path: pathStr,
        centroid: {
          x: sumX / clusterPoints.length,
          y: sumY / clusterPoints.length
        }
      });
    });

    return hulls;
  }, [points, clusters]);

  // Mouse drag handlers for canvas panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetViewport = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setActiveClusterFilter('all');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col">
      {/* Top Map Toolbar */}
      <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">Cluster Projection</span>
            <span className="text-xs text-slate-500 font-mono">
              {projectionMethod === 'pca'
                ? `PCA 2D (PC1: ${explainedVariance?.[0] ?? 0}%, PC2: ${explainedVariance?.[1] ?? 0}%)`
                : 'Force-Directed MDS (Cosine Manifold)'}
            </span>
          </div>
          <span className="text-slate-300" aria-hidden="true">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">Filter:</span>
            <select
              value={activeClusterFilter}
              onChange={(e) => setActiveClusterFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              aria-label="Filter by cluster"
              className="text-xs bg-white border border-slate-200 rounded px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="all">All Clusters ({articles.length} articles)</option>
              {clusters.map((c) => (
                <option key={c.clusterId} value={c.clusterId}>
                  Cluster {c.clusterId >= 0 ? c.clusterId + 1 : 'Noise'}: {c.label} ({c.articleIds.length})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHulls(!showHulls)}
            className={`px-2.5 py-1 text-xs font-medium rounded border transition-colors inline-flex items-center gap-1.5 ${
              showHulls
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            title="Toggle cluster boundary convex hulls"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Hulls</span>
          </button>

          <button
            onClick={() => setShowCentroidLabels(!showCentroidLabels)}
            className={`px-2.5 py-1 text-xs font-medium rounded border transition-colors inline-flex items-center gap-1.5 ${
              showCentroidLabels
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            title="Toggle centroid keyword pins"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Centroid Labels</span>
          </button>

          <div className="flex items-center border border-slate-200 rounded bg-white">
            <button
              onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
              className="p-1 hover:bg-slate-100 text-slate-600 border-r border-slate-200"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
              className="p-1 hover:bg-slate-100 text-slate-600"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={resetViewport}
            className="p-1 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded bg-white"
            title="Reset Pan & Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div
        className="relative w-full h-[520px] bg-slate-900/5 select-none cursor-grab active:cursor-grabbing overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Subtle grid pattern */}
        <svg className="w-full h-full" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(148, 163, 184, 0.15)" strokeWidth="1" />
            </pattern>
          </defs>

          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Scaled & Panned Group */}
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Cluster Convex Hulls */}
            {showHulls &&
              clusterHulls.map((hull) => {
                const isSelected =
                  activeClusterFilter === 'all' || activeClusterFilter === hull.clusterId;
                if (!isSelected) return null;

                return (
                  <path
                    key={`hull-${hull.clusterId}`}
                    d={hull.path}
                    fill={hull.color}
                    fillOpacity={0.12}
                    stroke={hull.color}
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                    className="transition-all duration-300"
                  />
                );
              })}

            {/* Cluster Centroid Label Pins */}
            {showCentroidLabels &&
              clusterHulls.map((hull) => {
                const cluster = clusters.find((c) => c.clusterId === hull.clusterId);
                if (!cluster) return null;
                const isSelected =
                  activeClusterFilter === 'all' || activeClusterFilter === hull.clusterId;
                if (!isSelected) return null;

                const topWords = cluster.centroidKeywords.slice(0, 2).map((k) => k.word).join(', ');

                return (
                  <g
                    key={`centroid-${hull.clusterId}`}
                    transform={`translate(${hull.centroid.x}, ${hull.centroid.y})`}
                    className="pointer-events-none"
                  >
                    <circle r="4" fill={hull.color} stroke="#ffffff" strokeWidth="1.5" />
                    <rect
                      x="-65"
                      y="-26"
                      width="130"
                      height="20"
                      rx="4"
                      fill="rgba(15, 23, 42, 0.85)"
                    />
                    <text
                      x="0"
                      y="-12"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="9.5"
                      fontFamily="sans-serif"
                      fontWeight="600"
                    >
                      {topWords || cluster.label}
                    </text>
                  </g>
                );
              })}

            {/* Document Scatter Points */}
            {points.map((pt) => {
              const isFilteredOut =
                activeClusterFilter !== 'all' && pt.clusterId !== activeClusterFilter;
              const isSelected = selectedArticleId === pt.articleId;
              const isHovered = hoveredPoint?.articleId === pt.articleId;
              const color = clusterColorMap.get(pt.clusterId) || '#64748B';

              return (
                <g
                  key={pt.articleId}
                  className="cursor-pointer transition-transform duration-150"
                  opacity={isFilteredOut ? 0.15 : 1}
                  onMouseEnter={() => setHoveredPoint(pt)}
                  onMouseLeave={() => setHoveredPoint(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectArticle(pt.articleId);
                  }}
                >
                  {/* Outer selection ring */}
                  {(isSelected || isHovered) && (
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 11 : 9}
                      fill="none"
                      stroke={color}
                      strokeWidth="2.5"
                      strokeOpacity="0.4"
                    />
                  )}

                  {/* Core Point Dot */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isSelected ? 6.5 : isHovered ? 6 : 4.5}
                    fill={color}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                </g>
              );
            })}
          </g>
        </svg>

        {/* Hover Article Tooltip Card */}
        {hoveredPoint && (
          <div
            className="absolute z-20 pointer-events-none bg-slate-900 text-white rounded-lg p-3 shadow-xl max-w-sm text-left border border-slate-700/60"
            style={{
              bottom: '16px',
              left: '16px'
            }}
          >
            <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-1">
              <span className="font-semibold" style={{ color: clusterColorMap.get(hoveredPoint.clusterId) }}>
                {clusterTitleMap.get(hoveredPoint.clusterId)}
              </span>
              <span>·</span>
              <span>{hoveredPoint.source}</span>
            </div>
            <p className="text-xs font-medium text-slate-100 line-clamp-2">
              {hoveredPoint.title}
            </p>
            <p className="text-[10px] text-slate-400 mt-2">
              Click node to inspect full article text & TF-IDF vector
            </p>
          </div>
        )}

        {/* Floating Instruction */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs border border-slate-200/80 rounded px-2.5 py-1 text-[11px] text-slate-500 pointer-events-none">
          Drag to Pan · Click point to inspect
        </div>
      </div>

      {/* Cluster Legend Bar */}
      <div className="px-4 py-3 border-t border-slate-200 bg-white">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {clusters.map((c) => (
            <button
              key={c.clusterId}
              onClick={() =>
                setActiveClusterFilter(activeClusterFilter === c.clusterId ? 'all' : c.clusterId)
              }
              className={`flex items-center gap-2 text-xs transition-opacity hover:opacity-100 ${
                activeClusterFilter === 'all' || activeClusterFilter === c.clusterId
                  ? 'opacity-100'
                  : 'opacity-40'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: c.color }}
              />
              <span className="font-medium text-slate-800">
                {c.clusterId >= 0 ? `Cluster ${c.clusterId + 1}:` : ''} {c.label}
              </span>
              <span className="text-slate-400 font-mono text-[11px] tabular-nums">
                ({c.articleIds.length})
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
