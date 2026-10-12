import React, { useState, useMemo } from 'react';
import { ClusterInfo, NewsArticle, TFIDFModel } from '../types/ml';
import { cosineSimilarity, vectorizeQuery } from '../ml/nlp';
import { CheckCircle2, CornerDownRight, Play, Search, X } from 'lucide-react';

interface QueryClassifierModalProps {
  isOpen: boolean;
  onClose: () => void;
  tfidf: TFIDFModel;
  clusters: ClusterInfo[];
  articles: NewsArticle[];
  assignments: Map<string, number>;
  onSelectArticle: (articleId: string) => void;
}

const SAMPLE_QUERIES = [
  'Reserve Bank of India maintains benchmark repo rate as retail inflation stabilizes',
  'ISRO completes crucial crew module propulsion test for Gaganyaan flight',
  'Tata Electronics breaks ground on semiconductor fabrication plant in Dholera Gujarat',
  'UPI clocks record sixteen billion digital transactions across urban and rural India',
  'Neeraj Chopra clinches Diamond League javelin gold with ninety meter throw',
  'US Federal Reserve holds interest rates steady amid global bond market volatility',
  'James Webb Space Telescope detects primitive stars formed near the cosmic dawn'
];

export const QueryClassifierModal: React.FC<QueryClassifierModalProps> = ({
  isOpen,
  onClose,
  tfidf,
  clusters,
  articles,
  assignments,
  onSelectArticle
}) => {
  const [queryText, setQueryText] = useState(SAMPLE_QUERIES[0]);

  // Compute cluster centroids
  const clusterCentroids = useMemo(() => {
    const dim = tfidf.vocabulary.length;
    const centroids = new Map<number, number[]>();

    const articleIndexMap = new Map<string, number>();
    articles.forEach((a, idx) => articleIndexMap.set(a.id, idx));

    clusters.forEach((cluster) => {
      if (cluster.clusterId === -1) return; // skip noise

      const center = new Array(dim).fill(0);
      cluster.articleIds.forEach((id) => {
        const idx = articleIndexMap.get(id);
        if (idx !== undefined) {
          const vec = tfidf.docVectors[idx];
          for (let d = 0; d < dim; d++) center[d] += vec[d];
        }
      });

      if (cluster.articleIds.length > 0) {
        for (let d = 0; d < dim; d++) center[d] /= cluster.articleIds.length;
      }

      // Unit norm
      let normSq = 0;
      for (let d = 0; d < dim; d++) normSq += center[d] * center[d];
      const norm = Math.sqrt(normSq);
      if (norm > 0) {
        for (let d = 0; d < dim; d++) center[d] /= norm;
      }

      centroids.set(cluster.clusterId, center);
    });

    return centroids;
  }, [tfidf, articles, clusters]);

  // Run inference on queryText
  const inferenceResult = useMemo(() => {
    if (!queryText.trim() || tfidf.vocabulary.length === 0) return null;

    const queryVec = vectorizeQuery(queryText, tfidf);

    // Calculate cosine similarity against all cluster centroids
    const clusterScores: { cluster: ClusterInfo; similarity: number }[] = [];

    clusters.forEach((c) => {
      if (c.clusterId === -1) return;
      const centroid = clusterCentroids.get(c.clusterId);
      if (!centroid) return;

      const sim = Math.max(0, cosineSimilarity(queryVec, centroid));
      clusterScores.push({
        cluster: c,
        similarity: Math.round(sim * 1000) / 1000
      });
    });

    clusterScores.sort((a, b) => b.similarity - a.similarity);

    // Also find top 2 individual nearest articles in corpus
    const articleIndexMap = new Map<string, number>();
    articles.forEach((a, idx) => articleIndexMap.set(a.id, idx));

    const nearestArticles: { article: NewsArticle; sim: number; clusterLabel: string }[] = [];
    articles.forEach((art, idx) => {
      const sim = Math.max(0, cosineSimilarity(queryVec, tfidf.docVectors[idx]));
      const cId = assignments.get(art.id) ?? -1;
      const cl = clusters.find((c) => c.clusterId === cId);
      nearestArticles.push({
        article: art,
        sim,
        clusterLabel: cl?.label || 'Noise'
      });
    });

    nearestArticles.sort((a, b) => b.sim - a.sim);

    return {
      bestCluster: clusterScores[0] || null,
      allScores: clusterScores,
      nearestArticles: nearestArticles.slice(0, 2)
    };
  }, [queryText, tfidf, clusters, clusterCentroids, articles, assignments]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Search className="w-4 h-4 text-blue-600" />
              <span>Test Unsupervised Query Inference</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Input any news headline or draft to project it into the trained TF-IDF semantic space.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Preset Prompts */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Try a Quick Headline Preset:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_QUERIES.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => setQueryText(q)}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded transition-colors text-left"
                >
                  {q.slice(0, 36)}...
                </button>
              ))}
            </div>
          </div>

          {/* Input text area */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Article Headline / Text Content:
            </label>
            <textarea
              rows={3}
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder="Paste article text or headline here..."
              className="w-full text-xs p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 font-sans"
            />
          </div>

          {/* Inference Results */}
          {inferenceResult && inferenceResult.bestCluster && (
            <div className="space-y-4 pt-2">
              {/* Predicted Cluster Callout */}
              <div className="p-4 rounded-lg bg-blue-50/80 border border-blue-200/70">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-800 uppercase tracking-wide">
                    Predicted Cluster Destination
                  </span>
                  <span className="text-xs font-mono font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                    Confidence: {(inferenceResult.bestCluster.similarity * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0"
                    style={{ backgroundColor: inferenceResult.bestCluster.cluster.color }}
                  />
                  <h4 className="text-sm font-bold text-slate-900">
                    {inferenceResult.bestCluster.cluster.clusterId >= 0
                      ? `Cluster ${inferenceResult.bestCluster.cluster.clusterId + 1}: `
                      : ''}
                    {inferenceResult.bestCluster.cluster.label}
                  </h4>
                </div>
              </div>

              {/* Similarity across all clusters */}
              <div>
                <h5 className="text-xs font-semibold text-slate-700 mb-2">
                  Centroid Cosine Similarity Breakdown:
                </h5>
                <div className="space-y-2">
                  {inferenceResult.allScores.map((scoreItem) => {
                    const pct = Math.max(2, Math.round(scoreItem.similarity * 100));
                    return (
                      <div key={scoreItem.cluster.clusterId} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-800 font-medium truncate max-w-[360px]">
                            {scoreItem.cluster.label}
                          </span>
                          <span className="font-mono text-slate-600 tabular-nums">
                            {(scoreItem.similarity * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: scoreItem.cluster.color
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Nearest Individual Articles in Corpus */}
              <div className="pt-2 border-t border-slate-100">
                <h5 className="text-xs font-semibold text-slate-700 mb-2">
                  Most Lexically Similar Corpus Articles:
                </h5>
                <div className="space-y-2">
                  {inferenceResult.nearestArticles.map((item) => (
                    <button
                      key={item.article.id}
                      onClick={() => {
                        onClose();
                        onSelectArticle(item.article.id);
                      }}
                      className="w-full text-left p-2.5 rounded border border-slate-200 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="truncate">
                        <span className="font-semibold text-slate-800">{item.article.title}</span>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {item.article.source} · {item.clusterLabel}
                        </div>
                      </div>
                      <span className="font-mono font-bold text-blue-600 shrink-0">
                        {(item.sim * 100).toFixed(1)}%
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
