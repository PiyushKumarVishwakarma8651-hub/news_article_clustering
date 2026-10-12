import React, { useMemo } from 'react';
import { ClusterInfo, NewsArticle, TFIDFModel } from '../types/ml';
import { cosineSimilarity } from '../ml/nlp';
import { ArrowUpRight, Calendar, ExternalLink, User, X } from 'lucide-react';

interface ArticleInspectorModalProps {
  articleId: string | null;
  articles: NewsArticle[];
  tfidf: TFIDFModel;
  clusters: ClusterInfo[];
  assignments: Map<string, number>;
  onClose: () => void;
  onSelectArticle: (articleId: string) => void;
}

export const ArticleInspectorModal: React.FC<ArticleInspectorModalProps> = ({
  articleId,
  articles,
  tfidf,
  clusters,
  assignments,
  onClose,
  onSelectArticle
}) => {
  if (!articleId) return null;

  const articleIndex = articles.findIndex((a) => a.id === articleId);
  const article = articles[articleIndex];
  if (!article) return null;

  const clusterId = assignments.get(article.id) ?? -1;
  const cluster = clusters.find((c) => c.clusterId === clusterId);

  // Top TF-IDF keywords for this document
  const docKeywords = tfidf.topWordsPerDoc[articleIndex] || [];

  // Find 3 nearest neighbors in corpus by cosine similarity
  const nearestNeighbors = useMemo(() => {
    if (articleIndex === -1 || !tfidf.docVectors[articleIndex]) return [];

    const targetVec = tfidf.docVectors[articleIndex];
    const neighbors: { article: NewsArticle; sim: number; clusterId: number }[] = [];

    articles.forEach((otherArt, idx) => {
      if (idx !== articleIndex) {
        const sim = cosineSimilarity(targetVec, tfidf.docVectors[idx]);
        neighbors.push({
          article: otherArt,
          sim: Math.max(0, sim),
          clusterId: assignments.get(otherArt.id) ?? -1
        });
      }
    });

    neighbors.sort((a, b) => b.sim - a.sim);
    return neighbors.slice(0, 3);
  }, [articleIndex, articles, tfidf, assignments]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: cluster?.color || '#64748B' }}
            />
            <span className="text-xs font-semibold text-slate-700">
              {cluster ? (cluster.clusterId >= 0 ? `Cluster ${cluster.clusterId + 1}: ${cluster.label}` : cluster.label) : 'Unclustered'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Headline & Metadata */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 leading-snug">
              {article.title}
            </h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-2">
              <span className="font-semibold text-slate-700">{article.source}</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {article.publishedDate}
              </span>
              {article.author && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {article.author}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Article Text Content */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/60 text-slate-700 text-xs leading-relaxed font-sans">
            {article.content}
          </div>

          {/* Top TF-IDF Keywords */}
          <div>
            <h4 className="text-xs font-semibold text-slate-700 mb-2">
              Extracted TF-IDF Keyword Weights (Document Vector Profile)
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {docKeywords.map((kw, i) => (
                <span
                  key={i}
                  className="text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded border border-slate-200 font-mono"
                >
                  {kw.word}{' '}
                  <span className="text-blue-600 font-semibold text-[11px]">
                    ({kw.score.toFixed(3)})
                  </span>
                </span>
              ))}
            </div>
          </div>

          {/* Nearest Neighbor Articles in Corpus */}
          <div className="pt-3 border-t border-slate-100">
            <h4 className="text-xs font-semibold text-slate-700 mb-2.5">
              Nearest Neighbor Articles (Highest Cosine Similarity)
            </h4>
            <div className="space-y-2">
              {nearestNeighbors.map((nb) => {
                const nbCluster = clusters.find((c) => c.clusterId === nb.clusterId);
                return (
                  <button
                    key={nb.article.id}
                    onClick={() => onSelectArticle(nb.article.id)}
                    className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all flex items-center justify-between gap-3 group"
                  >
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 line-clamp-1">
                        {nb.article.title}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span>{nb.article.source}</span>
                        <span aria-hidden="true">·</span>
                        <span
                          className="font-medium"
                          style={{ color: nbCluster?.color || '#64748B' }}
                        >
                          {nbCluster?.label || 'Noise'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-blue-700 shrink-0 bg-blue-50 px-2 py-1 rounded">
                      <span>{(nb.sim * 100).toFixed(1)}%</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
