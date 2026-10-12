import React, { useState } from 'react';
import { ClusterInfo, NewsArticle } from '../types/ml';
import { ChevronDown, ChevronRight, FileText, Sparkles } from 'lucide-react';

interface ClusterSummaryCardsProps {
  clusters: ClusterInfo[];
  articles: NewsArticle[];
  totalArticles: number;
  onSelectArticle: (articleId: string) => void;
}

export const ClusterSummaryCards: React.FC<ClusterSummaryCardsProps> = ({
  clusters,
  articles,
  totalArticles,
  onSelectArticle
}) => {
  const [expandedClusterId, setExpandedClusterId] = useState<number | null>(
    clusters.length > 0 ? clusters[0].clusterId : null
  );

  const articleMap = new Map<string, NewsArticle>();
  articles.forEach((a) => articleMap.set(a.id, a));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Discovered Topic Clusters</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Latent textual clusters identified by unsupervised machine learning without manual labels.
          </p>
        </div>
        <div className="text-xs text-slate-500">
          Total Clusters: <span className="font-semibold text-slate-800 font-mono tabular-nums">{clusters.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {clusters.map((cluster) => {
          const isExpanded = expandedClusterId === cluster.clusterId;
          const percentage = Math.round((cluster.articleIds.length / totalArticles) * 100);
          const repArticle = articleMap.get(cluster.representativeArticleId);

          return (
            <div
              key={cluster.clusterId}
              className="bg-white border border-slate-200 rounded-lg p-5 transition-shadow hover:shadow-xs flex flex-col justify-between"
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: cluster.color }}
                    />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {cluster.clusterId >= 0 ? `Cluster ${cluster.clusterId + 1}: ` : ''}
                        {cluster.label}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="font-mono tabular-nums font-medium text-slate-700">
                          {cluster.articleIds.length} articles ({percentage}%)
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          Coherence:{' '}
                          <span className="font-mono tabular-nums text-slate-700">
                            {cluster.coherenceScore}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Centroid Keywords */}
                <div className="my-3 py-2.5 border-y border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                    Key Vocabulary (TF-IDF Weight)
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {cluster.centroidKeywords.map((kw, i) => (
                      <span
                        key={i}
                        className="text-xs bg-slate-50 text-slate-700 px-2 py-0.5 rounded border border-slate-200/60 font-mono"
                      >
                        {kw.word}{' '}
                        <span className="text-slate-400 text-[10px]">
                          ({Math.round(kw.score * 100) / 100})
                        </span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Representative Article */}
                {repArticle && (
                  <div className="mb-3">
                    <div className="text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                      Most Representative Article (Centroid Anchor)
                    </div>
                    <button
                      onClick={() => onSelectArticle(repArticle.id)}
                      className="w-full text-left p-2.5 rounded bg-slate-50/70 hover:bg-slate-100 border border-slate-200/50 transition-colors group"
                    >
                      <p className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 line-clamp-1">
                        {repArticle.title}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                        <span>{repArticle.source}</span>
                        <span aria-hidden="true">·</span>
                        <span>{repArticle.publishedDate}</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Expand Member Articles Toggle */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => setExpandedClusterId(isExpanded ? null : cluster.clusterId)}
                  className="w-full flex items-center justify-between text-xs font-medium text-slate-600 hover:text-slate-900 py-1 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>View all {cluster.articleIds.length} member articles</span>
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="mt-2.5 space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {cluster.articleIds.map((artId) => {
                      const art = articleMap.get(artId);
                      if (!art) return null;
                      return (
                        <button
                          key={art.id}
                          onClick={() => onSelectArticle(art.id)}
                          className="w-full text-left p-2 rounded hover:bg-slate-50 text-xs border border-transparent hover:border-slate-200 transition-colors flex items-start justify-between gap-2 group"
                        >
                          <span className="text-slate-700 group-hover:text-slate-900 line-clamp-1 font-medium">
                            {art.title}
                          </span>
                          <span className="text-[11px] text-slate-400 shrink-0 font-mono">
                            {art.source}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
