import React, { useState, useMemo } from 'react';
import { ClusterInfo, NewsArticle, TFIDFModel } from '../types/ml';
import { Calendar, ChevronDown, ChevronUp, FileText, Newspaper, Search, User } from 'lucide-react';

interface NewsArticlesFeedProps {
  articles: NewsArticle[];
  clusters: ClusterInfo[];
  assignments: Map<string, number>;
  tfidf: TFIDFModel;
  onSelectArticle: (articleId: string) => void;
  selectedArticleId: string | null;
}

export const NewsArticlesFeed: React.FC<NewsArticlesFeedProps> = ({
  articles,
  clusters,
  assignments,
  tfidf,
  onSelectArticle,
  selectedArticleId
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClusterFilter, setSelectedClusterFilter] = useState<number | 'all'>('all');
  const [expandedArticleId, setExpandedArticleId] = useState<string | null>(
    selectedArticleId || (articles.length > 0 ? articles[0].id : null)
  );

  // Fast lookup maps
  const articleIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    articles.forEach((a, idx) => map.set(a.id, idx));
    return map;
  }, [articles]);

  const clusterMap = useMemo(() => {
    const map = new Map<number, ClusterInfo>();
    clusters.forEach((c) => map.set(c.clusterId, c));
    return map;
  }, [clusters]);

  // Region filter state
  const [regionScope, setRegionScope] = useState<'all' | 'india' | 'international'>('all');

  // Filtered articles
  const filteredArticles = useMemo(() => {
    return articles.filter((art) => {
      // Region filter
      const isIndia = art.id.startsWith('art-in') || /india|isro|rbi|upi|bengaluru|delhi|gujarat|mumbai/i.test(`${art.title} ${art.content}`);
      if (regionScope === 'india' && !isIndia) return false;
      if (regionScope === 'international' && isIndia) return false;

      // Cluster filter
      const cId = assignments.get(art.id) ?? -1;
      const matchesCluster =
        selectedClusterFilter === 'all' || cId === selectedClusterFilter;

      if (!matchesCluster) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      return (
        art.title.toLowerCase().includes(q) ||
        art.content.toLowerCase().includes(q) ||
        art.source.toLowerCase().includes(q) ||
        (art.author && art.author.toLowerCase().includes(q))
      );
    });
  }, [articles, regionScope, selectedClusterFilter, searchQuery, assignments]);

  // Group filtered articles by cluster
  const articlesByCluster = useMemo(() => {
    const groups: { cluster: ClusterInfo; articles: NewsArticle[] }[] = [];

    clusters.forEach((cluster) => {
      const clusterArticles = filteredArticles.filter(
        (art) => assignments.get(art.id) === cluster.clusterId
      );
      if (clusterArticles.length > 0) {
        groups.push({
          cluster,
          articles: clusterArticles
        });
      }
    });

    return groups;
  }, [clusters, filteredArticles, assignments]);

  const indiaCount = useMemo(() => {
    return articles.filter((a) => a.id.startsWith('art-in') || /india|isro|rbi|upi/i.test(`${a.title} ${a.content}`)).length;
  }, [articles]);

  const intlCount = articles.length - indiaCount;

  return (
    <div className="space-y-6">
      {/* Top Filter & Search Controls */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
        {/* Search input */}
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search news articles by headline, body text, or source..."
            className="w-full text-xs pl-9 pr-3 py-2 rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900 bg-slate-50/50"
          />
        </div>

        {/* Region Scope segmented control */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0">
          <button
            onClick={() => setRegionScope('all')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              regionScope === 'all'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All News ({articles.length})
          </button>
          <button
            onClick={() => setRegionScope('india')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              regionScope === 'india'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            India News ({indiaCount})
          </button>
          <button
            onClick={() => setRegionScope('international')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              regionScope === 'international'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            International ({intlCount})
          </button>
        </div>

        {/* Topic filter dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-500 whitespace-nowrap">Topic:</span>
          <select
            value={selectedClusterFilter}
            onChange={(e) =>
              setSelectedClusterFilter(
                e.target.value === 'all' ? 'all' : Number(e.target.value)
              )
            }
            aria-label="Filter news articles by cluster"
            className="text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="all">All Topic Clusters ({articles.length})</option>
            {clusters.map((c) => (
              <option key={c.clusterId} value={c.clusterId}>
                Cluster {c.clusterId >= 0 ? c.clusterId + 1 : 'Noise'}: {c.label} ({c.articleIds.length})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Clustered News Articles List */}
      <div className="space-y-6">
        {articlesByCluster.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg p-12 text-center space-y-2">
            <FileText className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-800">No matching news articles</h3>
            <p className="text-xs text-slate-500">
              Try adjusting your search query or topic filter.
            </p>
          </div>
        ) : (
          articlesByCluster.map(({ cluster, articles: groupArticles }) => (
            <div
              key={cluster.clusterId}
              className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs"
            >
              {/* Cluster Section Banner */}
              <div
                className="px-5 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3"
                style={{ backgroundColor: `${cluster.color}08` }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: cluster.color }}
                  />
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      {cluster.clusterId >= 0 ? `Topic Cluster ${cluster.clusterId + 1}: ` : ''}
                      {cluster.label}
                    </h2>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span className="font-mono tabular-nums font-medium text-slate-700">
                        {groupArticles.length} news article{groupArticles.length > 1 ? 's' : ''}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        Key Terms:{' '}
                        <span className="font-mono text-slate-700">
                          {cluster.centroidKeywords.slice(0, 4).map((k) => k.word).join(', ')}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-500 font-mono">
                  Intra-Cluster Coherence: {cluster.coherenceScore}
                </div>
              </div>

              {/* List of News Articles in this Cluster */}
              <div className="divide-y divide-slate-100">
                {groupArticles.map((article) => {
                  const isExpanded = expandedArticleId === article.id;
                  const artIdx = articleIndexMap.get(article.id) ?? -1;
                  const docKeywords =
                    artIdx !== -1 ? tfidf.topWordsPerDoc[artIdx] || [] : [];

                  return (
                    <article
                      key={article.id}
                      className="p-5 hover:bg-slate-50/50 transition-colors"
                    >
                      {/* Article Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1.5 flex-1">
                          <h3
                            className="text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors cursor-pointer leading-snug"
                            onClick={() => {
                              setExpandedArticleId(isExpanded ? null : article.id);
                              onSelectArticle(article.id);
                            }}
                          >
                            {article.title}
                          </h3>

                          {/* Clean unboxed metadata with separators */}
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                            <span className="font-semibold text-slate-700">{article.source}</span>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {article.publishedDate}
                            </span>
                            {article.author && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="inline-flex items-center gap-1">
                                  <User className="w-3 h-3 text-slate-400" />
                                  {article.author}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Read full article toggle */}
                        <button
                          onClick={() => {
                            setExpandedArticleId(isExpanded ? null : article.id);
                            onSelectArticle(article.id);
                          }}
                          className="shrink-0 p-1.5 rounded hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition-colors flex items-center gap-1 text-xs"
                          title={isExpanded ? 'Collapse article' : 'Read full article'}
                        >
                          <span className="hidden sm:inline font-medium text-slate-600">
                            {isExpanded ? 'Collapse' : 'Read Article'}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      {/* Lead Snippet when collapsed */}
                      {!isExpanded && (
                        <p className="text-xs text-slate-600 line-clamp-2 mt-2 leading-relaxed">
                          {article.content}
                        </p>
                      )}

                      {/* Full News Article Content when expanded */}
                      {isExpanded && (
                        <div className="mt-3.5 space-y-3 pt-3 border-t border-slate-100">
                          <div className="text-xs text-slate-800 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-200/60 font-sans space-y-2">
                            <p>{article.content}</p>
                          </div>

                          {/* Extracted TF-IDF Features for this Article */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mr-1">
                              Cluster Features:
                            </span>
                            {docKeywords.map((kw, i) => (
                              <span
                                key={i}
                                className="text-[11px] bg-white border border-slate-200 rounded px-2 py-0.5 text-slate-700 font-mono"
                              >
                                {kw.word}{' '}
                                <span className="text-blue-600 text-[10px]">
                                  ({kw.score.toFixed(2)})
                                </span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
