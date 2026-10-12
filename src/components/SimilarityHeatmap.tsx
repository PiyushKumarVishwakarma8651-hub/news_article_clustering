import React, { useState, useMemo } from 'react';
import { ClusterInfo, NewsArticle, TFIDFModel } from '../types/ml';
import { cosineSimilarity } from '../ml/nlp';
import { ArrowRight, Columns3, Layers } from 'lucide-react';

interface SimilarityHeatmapProps {
  articles: NewsArticle[];
  tfidf: TFIDFModel;
  clusters: ClusterInfo[];
  assignments: Map<string, number>;
  onSelectArticle: (articleId: string) => void;
}

export const SimilarityHeatmap: React.FC<SimilarityHeatmapProps> = ({
  articles,
  tfidf,
  clusters,
  assignments,
  onSelectArticle
}) => {
  const [selectedPair, setSelectedPair] = useState<[number, number] | null>(null);
  const [sortByCluster, setSortByCluster] = useState<boolean>(true);
  const [filterClusterId, setFilterClusterId] = useState<number | 'all'>('all');

  // Order articles (either by cluster or original order)
  const orderedArticles = useMemo(() => {
    let list = [...articles];
    if (filterClusterId !== 'all') {
      list = list.filter((a) => assignments.get(a.id) === filterClusterId);
    }
    if (sortByCluster) {
      list.sort((a, b) => {
        const cA = assignments.get(a.id) ?? -1;
        const cB = assignments.get(b.id) ?? -1;
        if (cA !== cB) return cA - cB;
        return a.title.localeCompare(b.title);
      });
    }
    return list;
  }, [articles, sortByCluster, filterClusterId, assignments]);

  // Index map of original articles to vectors
  const originalIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    articles.forEach((a, idx) => map.set(a.id, idx));
    return map;
  }, [articles]);

  // Precalculate similarity matrix for the displayed articles
  const matrix = useMemo(() => {
    const n = orderedArticles.length;
    const mat: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      const idxA = originalIndexMap.get(orderedArticles[i].id)!;
      for (let j = 0; j < n; j++) {
        if (i === j) {
          mat[i][j] = 1.0;
        } else {
          const idxB = originalIndexMap.get(orderedArticles[j].id)!;
          mat[i][j] = Math.max(0, cosineSimilarity(tfidf.docVectors[idxA], tfidf.docVectors[idxB]));
        }
      }
    }
    return mat;
  }, [orderedArticles, originalIndexMap, tfidf]);

  // When a cell is clicked, extract the two articles and shared keywords
  const comparisonData = useMemo(() => {
    if (!selectedPair) return null;
    const [i, j] = selectedPair;
    if (i >= orderedArticles.length || j >= orderedArticles.length) return null;

    const artA = orderedArticles[i];
    const artB = orderedArticles[j];
    const idxA = originalIndexMap.get(artA.id)!;
    const idxB = originalIndexMap.get(artB.id)!;
    const sim = matrix[i][j];

    // Find shared non-zero words in TF-IDF vectors
    const shared: { word: string; scoreA: number; scoreB: number; product: number }[] = [];
    tfidf.vocabulary.forEach((term, tIdx) => {
      const vA = tfidf.docVectors[idxA][tIdx];
      const vB = tfidf.docVectors[idxB][tIdx];
      if (vA > 0.01 && vB > 0.01) {
        shared.push({
          word: term.replace('_', ' '),
          scoreA: Math.round(vA * 100) / 100,
          scoreB: Math.round(vB * 100) / 100,
          product: vA * vB
        });
      }
    });

    shared.sort((a, b) => b.product - a.product);

    return {
      artA,
      artB,
      sim: Math.round(sim * 1000) / 1000,
      sharedWords: shared.slice(0, 10)
    };
  }, [selectedPair, orderedArticles, originalIndexMap, matrix, tfidf]);

  // Color helper for similarity cell
  const getCellColor = (sim: number) => {
    if (sim >= 0.9) return 'bg-blue-700 text-white';
    if (sim >= 0.7) return 'bg-blue-600 text-white';
    if (sim >= 0.5) return 'bg-blue-500 text-white';
    if (sim >= 0.3) return 'bg-blue-300 text-slate-900';
    if (sim >= 0.15) return 'bg-blue-100 text-slate-900';
    if (sim >= 0.05) return 'bg-slate-100 text-slate-700';
    return 'bg-white text-slate-300';
  };

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Pairwise Cosine Similarity Heatmap</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Notice how articles sorted by cluster create distinct block-diagonal clusters of high similarity along the matrix.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={sortByCluster}
              onChange={(e) => setSortByCluster(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="font-medium">Sort by Cluster (Block Diagonal)</span>
          </label>

          <select
            value={filterClusterId}
            onChange={(e) => setFilterClusterId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            aria-label="Filter similarity matrix by cluster"
            className="text-xs bg-white border border-slate-200 rounded px-2.5 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="all">Show All Articles ({articles.length})</option>
            {clusters.map((c) => (
              <option key={c.clusterId} value={c.clusterId}>
                Cluster {c.clusterId >= 0 ? c.clusterId + 1 : 'Noise'}: {c.label} ({c.articleIds.length})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Heatmap Container */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Color Scale Legend */}
          <div className="flex items-center gap-2 mb-4 text-xs text-slate-500">
            <span>Cosine Similarity:</span>
            <div className="flex items-center gap-1 font-mono text-[10px]">
              <span className="px-1.5 py-0.5 bg-white border border-slate-200 text-slate-400">0.0</span>
              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600">0.05+</span>
              <span className="px-1.5 py-0.5 bg-blue-100 text-slate-800">0.15+</span>
              <span className="px-1.5 py-0.5 bg-blue-300 text-slate-900">0.30+</span>
              <span className="px-1.5 py-0.5 bg-blue-500 text-white">0.50+</span>
              <span className="px-1.5 py-0.5 bg-blue-700 text-white">0.90+ (Identical)</span>
            </div>
          </div>

          {/* Matrix Grid */}
          <div className="overflow-auto max-h-[480px] border border-slate-200 rounded">
            <table className="border-collapse text-[10px] font-mono">
              <thead>
                <tr>
                  <th className="sticky top-0 left-0 z-20 bg-slate-100 p-2 border-b border-r border-slate-200 w-32 text-left text-slate-600 font-sans">
                    Articles ({orderedArticles.length})
                  </th>
                  {orderedArticles.map((art, idx) => (
                    <th
                      key={art.id}
                      className="sticky top-0 z-10 bg-slate-50 p-1 border-b border-r border-slate-200 text-center w-8 h-8 text-slate-600 font-normal hover:bg-slate-100"
                      title={`${art.source}: ${art.title}`}
                    >
                      {idx + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orderedArticles.map((rowArt, i) => {
                  const clusterId = assignments.get(rowArt.id) ?? -1;
                  return (
                    <tr key={rowArt.id}>
                      <td
                        className="sticky left-0 z-10 bg-slate-50 p-1.5 border-b border-r border-slate-200 font-sans text-xs text-slate-800 truncate max-w-[200px] hover:bg-slate-100 cursor-pointer"
                        title={rowArt.title}
                        onClick={() => onSelectArticle(rowArt.id)}
                      >
                        <span className="text-slate-400 font-mono text-[10px] mr-1.5">
                          {i + 1}.
                        </span>
                        {rowArt.title}
                      </td>

                      {orderedArticles.map((colArt, j) => {
                        const sim = matrix[i][j];
                        const isSelected = selectedPair?.[0] === i && selectedPair?.[1] === j;

                        return (
                          <td
                            key={colArt.id}
                            onClick={() => setSelectedPair([i, j])}
                            className={`p-0 text-center border-b border-r border-slate-100 cursor-pointer transition-all hover:ring-2 hover:ring-blue-500 hover:z-10 ${getCellColor(
                              sim
                            )} ${isSelected ? 'ring-2 ring-slate-900 z-10' : ''}`}
                            style={{ width: '28px', height: '28px' }}
                            title={`${rowArt.title}\nvs\n${colArt.title}\nCosine Similarity: ${sim.toFixed(3)}`}
                          >
                            <span className="block text-[9px] tabular-nums">
                              {sim.toFixed(2).replace('0.', '.')}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison Inspector for Clicked Cell */}
      {comparisonData ? (
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Pairwise Textual Co-occurrence Analysis
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Inspect why these two articles have a cosine similarity of{' '}
                <span className="font-mono font-bold text-blue-600">
                  {comparisonData.sim}
                </span>
                .
              </p>
            </div>
            <div className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded font-mono font-bold">
              Similarity: {(comparisonData.sim * 100).toFixed(1)}%
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Article A */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Article A</span>
                <span>{comparisonData.artA.source} · {comparisonData.artA.publishedDate}</span>
              </div>
              <h4 className="text-xs font-bold text-slate-900">
                {comparisonData.artA.title}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded border border-slate-200/50">
                {comparisonData.artA.content}
              </p>
            </div>

            {/* Article B */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Article B</span>
                <span>{comparisonData.artB.source} · {comparisonData.artB.publishedDate}</span>
              </div>
              <h4 className="text-xs font-bold text-slate-900">
                {comparisonData.artB.title}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded border border-slate-200/50">
                {comparisonData.artB.content}
              </p>
            </div>
          </div>

          {/* Shared Vocabulary Weights */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <h5 className="text-xs font-semibold text-slate-700 mb-2">
              Shared High-Weight TF-IDF Terms Driving Similarity:
            </h5>
            {comparisonData.sharedWords.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {comparisonData.sharedWords.map((sw, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded border border-slate-200 font-mono"
                  >
                    <span className="font-semibold">{sw.word}</span>
                    <span className="text-[10px] text-slate-500">
                      (A: {sw.scoreA}, B: {sw.scoreB})
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                No overlapping keywords above threshold (orthogonal vectors).
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-6 text-xs text-slate-400 bg-white border border-slate-200 rounded-lg">
          Click any cell in the similarity matrix above to inspect side-by-side article text and shared vocabulary.
        </div>
      )}
    </div>
  );
};
