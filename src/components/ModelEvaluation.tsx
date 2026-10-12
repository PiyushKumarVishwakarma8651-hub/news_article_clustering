import React from 'react';
import { ClusterInfo, ClusteringResult, ElbowPoint, TFIDFModel } from '../types/ml';
import { Activity, BarChart2, CheckCircle2, TrendingDown } from 'lucide-react';

interface ModelEvaluationProps {
  clusteringResult: ClusteringResult;
  elbowData: ElbowPoint[];
  tfidf: TFIDFModel;
  currentK: number;
  onSelectK?: (k: number) => void;
  clusters: ClusterInfo[];
}

export const ModelEvaluation: React.FC<ModelEvaluationProps> = ({
  clusteringResult,
  elbowData,
  tfidf,
  currentK,
  onSelectK,
  clusters
}) => {
  const { silhouetteScore, clusterSilhouettes, daviesBouldinIndex, inertia, algorithm } = clusteringResult;

  // Max inertia for SVG chart scaling
  const maxInertia = elbowData.length > 0 ? Math.max(...elbowData.map((d) => d.inertia)) : 10;
  const minInertia = elbowData.length > 0 ? Math.min(...elbowData.map((d) => d.inertia)) : 0;

  // Chart coordinates
  const chartWidth = 500;
  const chartHeight = 200;
  const paddingX = 40;
  const paddingY = 25;

  const pointsStr = elbowData
    .map((pt, i) => {
      const x = paddingX + (i / (elbowData.length - 1 || 1)) * (chartWidth - 2 * paddingX);
      const y =
        chartHeight -
        paddingY -
        ((pt.inertia - minInertia) / (maxInertia - minInertia || 1)) * (chartHeight - 2 * paddingY);
      return `${x},${y}`;
    })
    .join(' ');

  // Get interpretation label for Silhouette
  const getSilhouetteLabel = (score: number) => {
    if (score >= 0.45) return { text: 'Strong Separation', color: 'text-emerald-700 bg-emerald-50' };
    if (score >= 0.25) return { text: 'Moderate Separation', color: 'text-blue-700 bg-blue-50' };
    if (score >= 0.1) return { text: 'Weak / Diffuse Structure', color: 'text-amber-700 bg-amber-50' };
    return { text: 'Substantial Overlap', color: 'text-rose-700 bg-rose-50' };
  };

  const silStatus = getSilhouetteLabel(silhouetteScore);

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Silhouette Score */}
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs font-medium text-slate-500 mb-1">Mean Silhouette Score</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {silhouetteScore}
            </span>
            <span className="text-xs text-slate-400 font-mono">[-1.0 to +1.0]</span>
          </div>
          <div className={`mt-2 text-[11px] font-medium px-2 py-0.5 rounded w-max inline-block ${silStatus.color}`}>
            {silStatus.text}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Measures how well each article fits into its assigned cluster versus neighboring clusters.
          </p>
        </div>

        {/* Davies-Bouldin Index */}
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs font-medium text-slate-500 mb-1">Davies-Bouldin Index</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {daviesBouldinIndex}
            </span>
            <span className="text-xs text-slate-400 font-mono">(lower is better)</span>
          </div>
          <div className="mt-2 text-[11px] font-medium px-2 py-0.5 rounded w-max inline-block text-slate-700 bg-slate-100">
            {daviesBouldinIndex < 1.6 ? 'Compact & Well Separated' : 'Moderate Boundary Dispersion'}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Ratio of intra-cluster scatter to inter-cluster separation.
          </p>
        </div>

        {/* Inertia / WCSS */}
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs font-medium text-slate-500 mb-1">Within-Cluster Sum of Squares (Inertia)</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {inertia !== undefined ? inertia.toFixed(2) : 'N/A'}
            </span>
          </div>
          <div className="mt-2 text-[11px] font-medium px-2 py-0.5 rounded w-max inline-block text-slate-700 bg-slate-100">
            {algorithm === 'kmeans' ? 'K-Means Objective' : `${algorithm.toUpperCase()} Algorithm`}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Total squared cosine distance from articles to their respective cluster centroids.
          </p>
        </div>

        {/* Active Model Latency & Features */}
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs font-medium text-slate-500 mb-1">Vector Vocabulary Space</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {tfidf.vocabulary.length}
            </span>
            <span className="text-xs text-slate-400 font-mono">TF-IDF dimensions</span>
          </div>
          <div className="mt-2 text-[11px] font-medium px-2 py-0.5 rounded w-max inline-block text-slate-700 bg-slate-100">
            Compute: {clusteringResult.elapsedTimeMs}ms
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Vocabulary filtered by document frequencies with sublinear term scaling.
          </p>
        </div>
      </div>

      {/* Elbow Method Chart & Silhouette Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Elbow Curve Panel */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-slate-700" />
                <span>Elbow Method Curve (WCSS vs K)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                The point where the rate of inertia decrease flattens indicates the optimal cluster count.
              </p>
            </div>
          </div>

          <div className="border border-slate-100 rounded bg-slate-50/50 p-2">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-48 select-none">
              {/* Grid lines */}
              <line x1={paddingX} y1={paddingY} x2={chartWidth - paddingX} y2={paddingY} stroke="#E2E8F0" />
              <line
                x1={paddingX}
                y1={chartHeight / 2}
                x2={chartWidth - paddingX}
                y2={chartHeight / 2}
                stroke="#E2E8F0"
              />
              <line
                x1={paddingX}
                y1={chartHeight - paddingY}
                x2={chartWidth - paddingX}
                y2={chartHeight - paddingY}
                stroke="#CBD5E1"
              />

              {/* Curve Line */}
              <polyline
                fill="none"
                stroke="#2563EB"
                strokeWidth="2.5"
                points={pointsStr}
              />

              {/* Points */}
              {elbowData.map((pt, i) => {
                const x = paddingX + (i / (elbowData.length - 1 || 1)) * (chartWidth - 2 * paddingX);
                const y =
                  chartHeight -
                  paddingY -
                  ((pt.inertia - minInertia) / (maxInertia - minInertia || 1)) *
                    (chartHeight - 2 * paddingY);
                const isSelected = pt.k === currentK;

                return (
                  <g
                    key={pt.k}
                    className="cursor-pointer"
                    onClick={() => onSelectK && onSelectK(pt.k)}
                  >
                    <circle
                      cx={x}
                      cy={y}
                      r={isSelected ? 6 : 4}
                      fill={isSelected ? '#2563EB' : '#ffffff'}
                      stroke="#2563EB"
                      strokeWidth="2"
                    />
                    <text
                      x={x}
                      y={chartHeight - 6}
                      textAnchor="middle"
                      fontSize="10"
                      fill={isSelected ? '#0F172A' : '#64748B'}
                      fontWeight={isSelected ? 'bold' : 'normal'}
                    >
                      K={pt.k}
                    </text>
                    <text
                      x={x}
                      y={y - 8}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#475569"
                      fontFamily="monospace"
                    >
                      {pt.inertia}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 px-1">
            <span>X-Axis: Number of Clusters (K)</span>
            <span>Current: K = {currentK}</span>
          </div>
        </div>

        {/* Per-Cluster Silhouette Breakdown */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-slate-700" />
                <span>Per-Cluster Silhouette Cohesion</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Higher scores indicate tighter intra-cluster compactness and clearer separation.
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {clusterSilhouettes.map((cs) => {
              const cluster = clusters.find((c) => c.clusterId === cs.clusterId);
              const barWidth = Math.max(5, Math.min(100, Math.round(cs.score * 100)));

              return (
                <div key={cs.clusterId} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800 flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: cluster?.color || '#64748B' }}
                      />
                      <span>{cluster?.label || `Cluster ${cs.clusterId + 1}`}</span>
                    </span>
                    <span className="font-mono tabular-nums text-slate-700 font-semibold">
                      {cs.score}
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: cluster?.color || '#2563EB'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Global Vocabulary Terms */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-2">
          Global Corpus Vocabulary & IDF Weights
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Terms with higher Inverse Document Frequency (IDF) carry stronger discriminatory power across news topics.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {tfidf.vocabulary.slice(0, 24).map((term, i) => (
            <div
              key={term}
              className="p-2 rounded bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs"
            >
              <span className="font-medium text-slate-800 font-mono truncate mr-2">
                {term.replace('_', ' ')}
              </span>
              <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                {tfidf.idf[i]?.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
