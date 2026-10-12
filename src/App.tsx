import React, { useState, useMemo, useCallback } from 'react';
import {
  ClusteringResult,
  DendrogramNode,
  NewsArticle,
  PipelineConfig,
  Projection2DPoint
} from './types/ml';
import { INITIAL_ARTICLES } from './data/newsArticles';
import { buildTFIDFModel, preprocessArticles } from './ml/nlp';
import {
  buildClusterSummaries,
  runDBSCAN,
  runHierarchical,
  runKMeans
} from './ml/clustering';
import { computeMDS2D, computePCA2D } from './ml/projection';
import {
  computeDaviesBouldin,
  computeElbowCurve,
  computeSilhouetteScores
} from './ml/metrics';
import { Header, NavTab } from './components/Header';
import { NewsArticlesFeed } from './components/NewsArticlesFeed';
import { ClusterMap } from './components/ClusterMap';
import { ClusterSummaryCards } from './components/ClusterSummaryCards';
import { SimilarityHeatmap } from './components/SimilarityHeatmap';
import { DendrogramView } from './components/DendrogramView';
import { ModelEvaluation } from './components/ModelEvaluation';
import { PipelineControls } from './components/PipelineControls';
import { ArticleInspectorModal } from './components/ArticleInspectorModal';
import { QueryClassifierModal } from './components/QueryClassifierModal';
import { AddArticleModal } from './components/AddArticleModal';
import { Download, SlidersHorizontal } from 'lucide-react';

const DEFAULT_CONFIG: PipelineConfig = {
  algorithm: 'kmeans',
  k: 6,
  dbscanEps: 0.65,
  dbscanMinSamples: 2,
  hierarchicalLinkage: 'average',
  maxFeatures: 300,
  minDf: 1,
  useNgrams: true,
  sublinearTf: true,
  projectionMethod: 'pca'
};

export default function App() {
  const [articles, setArticles] = useState<NewsArticle[]>(INITIAL_ARTICLES);
  const [config, setConfig] = useState<PipelineConfig>(DEFAULT_CONFIG);
  const [activeTab, setActiveTab] = useState<NavTab>('feed');
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [isTestQueryOpen, setIsTestQueryOpen] = useState(false);
  const [isAddArticleOpen, setIsAddArticleOpen] = useState(false);
  const [showControlsDrawer, setShowControlsDrawer] = useState(false);

  // 1. NLP Preprocessing & Feature Extraction
  const preprocessedDocs = useMemo(() => {
    return preprocessArticles(articles, config.useNgrams, true);
  }, [articles, config.useNgrams]);

  // 2. TF-IDF Model Build
  const tfidfModel = useMemo(() => {
    return buildTFIDFModel(
      preprocessedDocs,
      config.maxFeatures,
      config.minDf,
      config.sublinearTf
    );
  }, [preprocessedDocs, config.maxFeatures, config.minDf, config.sublinearTf]);

  // 3. Unsupervised Clustering Execution
  const { clusteringResult, dendrogramRoot } = useMemo(() => {
    const startTime = performance.now();
    let assignments = new Map<string, number>();
    let noiseCount = 0;
    let inertia: number | undefined;
    let dendroRoot: DendrogramNode | undefined;

    if (config.algorithm === 'kmeans') {
      const res = runKMeans(articles, tfidfModel, config.k);
      assignments = res.assignments;
      inertia = res.inertia;
    } else if (config.algorithm === 'dbscan') {
      const res = runDBSCAN(articles, tfidfModel, config.dbscanEps, config.dbscanMinSamples);
      assignments = res.assignments;
      noiseCount = res.noiseCount;
    } else if (config.algorithm === 'hierarchical') {
      const res = runHierarchical(
        articles,
        tfidfModel,
        config.k,
        config.hierarchicalLinkage
      );
      assignments = res.assignments;
      dendroRoot = res.dendrogramRoot;
    }

    const clusters = buildClusterSummaries(articles, tfidfModel, assignments);

    // Compute evaluation metrics
    const { overall: silhouetteScore, perCluster: clusterSilhouettes } =
      computeSilhouetteScores(articles, tfidfModel, assignments);
    const daviesBouldinIndex = computeDaviesBouldin(articles, tfidfModel, assignments);

    const endTime = performance.now();

    const result: ClusteringResult = {
      algorithm: config.algorithm,
      assignments,
      clusters,
      noiseCount,
      silhouetteScore,
      clusterSilhouettes,
      daviesBouldinIndex,
      inertia,
      elapsedTimeMs: Math.round((endTime - startTime) * 10) / 10
    };

    return { clusteringResult: result, dendrogramRoot: dendroRoot };
  }, [articles, tfidfModel, config]);

  // 4. Dimensionality Reduction & 2D Projection
  const { projectionPoints, explainedVariance } = useMemo(() => {
    if (config.projectionMethod === 'pca') {
      const { points, explainedVariance } = computePCA2D(
        articles,
        tfidfModel,
        clusteringResult.assignments
      );
      return { projectionPoints: points, explainedVariance };
    } else {
      const points = computeMDS2D(articles, tfidfModel, clusteringResult.assignments);
      return { projectionPoints: points, explainedVariance: undefined };
    }
  }, [articles, tfidfModel, clusteringResult.assignments, config.projectionMethod]);

  // 5. Elbow Curve Computation (for Model Evaluation)
  const elbowData = useMemo(() => {
    return computeElbowCurve(articles, tfidfModel);
  }, [articles, tfidfModel]);

  // Config handlers
  const handleUpdateConfig = useCallback((patch: Partial<PipelineConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleResetDefaults = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
  }, []);

  const handleAddArticle = useCallback((newArt: NewsArticle) => {
    setArticles((prev) => [newArt, ...prev]);
  }, []);

  const handleResetBenchmark = useCallback(() => {
    setArticles(INITIAL_ARTICLES);
  }, []);

  // Export clustered dataset as JSON
  const handleExportJSON = () => {
    const exportData = articles.map((art) => {
      const clusterId = clusteringResult.assignments.get(art.id) ?? -1;
      const cluster = clusteringResult.clusters.find((c) => c.clusterId === clusterId);
      return {
        id: art.id,
        title: art.title,
        source: art.source,
        publishedDate: art.publishedDate,
        assignedClusterId: clusterId,
        clusterTopicLabel: cluster?.label || 'Noise',
        contentSnippet: art.content.slice(0, 160) + '...'
      };
    });

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `news_clusters_${config.algorithm}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* 3-Zone Top Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenTestQuery={() => setIsTestQueryOpen(true)}
        onOpenAddArticle={() => setIsAddArticleOpen(true)}
        articleCount={articles.length}
      />

      {/* Main Workspace Frame */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col gap-6">
        {/* Unsupervised Pipeline Status Strip */}
        <section className="bg-white border border-slate-200 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
            <div>
              <span className="text-slate-500">Algorithm:</span>{' '}
              <span className="font-semibold text-slate-800 uppercase font-mono">
                {config.algorithm === 'kmeans'
                  ? `K-Means++ (K=${config.k})`
                  : config.algorithm === 'dbscan'
                  ? `DBSCAN (ε=${config.dbscanEps})`
                  : `Hierarchical (${config.hierarchicalLinkage})`}
              </span>
            </div>

            <div className="hidden sm:block text-slate-200" aria-hidden="true">|</div>

            <div>
              <span className="text-slate-500">Corpus:</span>{' '}
              <span className="font-semibold text-slate-800 font-mono tabular-nums">
                {articles.length} Articles
              </span>
            </div>

            <div className="hidden sm:block text-slate-200" aria-hidden="true">|</div>

            <div>
              <span className="text-slate-500">Discovered Clusters:</span>{' '}
              <span className="font-semibold text-blue-600 font-mono tabular-nums">
                {clusteringResult.clusters.length}
              </span>
              {clusteringResult.noiseCount > 0 && (
                <span className="text-slate-400 ml-1">
                  ({clusteringResult.noiseCount} noise)
                </span>
              )}
            </div>

            <div className="hidden sm:block text-slate-200" aria-hidden="true">|</div>

            <div>
              <span className="text-slate-500">Mean Silhouette:</span>{' '}
              <span
                className={`font-semibold font-mono tabular-nums ${
                  clusteringResult.silhouetteScore >= 0.3
                    ? 'text-emerald-600'
                    : 'text-amber-600'
                }`}
              >
                {clusteringResult.silhouetteScore}
              </span>
            </div>

            <div className="hidden sm:block text-slate-200" aria-hidden="true">|</div>

            <div>
              <span className="text-slate-500">Davies-Bouldin:</span>{' '}
              <span className="font-semibold text-slate-800 font-mono tabular-nums">
                {clusteringResult.daviesBouldinIndex}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowControlsDrawer(!showControlsDrawer)}
              className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Pipeline Settings</span>
            </button>

            <button
              onClick={handleExportJSON}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors"
              title="Download cluster assignments as JSON"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export JSON</span>
            </button>
          </div>
        </section>

        {/* 2-Column Responsive Workspace: Sidebar Controls + Interactive Canvas */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Left Column: Pipeline Controls (Desktop sticky sidebar, mobile toggle) */}
          <div className={`${showControlsDrawer ? 'block' : 'hidden lg:block'} lg:col-span-1`}>
            <PipelineControls
              config={config}
              onChangeConfig={handleUpdateConfig}
              onResetDefaults={handleResetDefaults}
            />
          </div>

          {/* Right Column: Active Viewport */}
          <div className="lg:col-span-3 space-y-6">
            {activeTab === 'feed' && (
              <NewsArticlesFeed
                articles={articles}
                clusters={clusteringResult.clusters}
                assignments={clusteringResult.assignments}
                tfidf={tfidfModel}
                onSelectArticle={(id) => setSelectedArticleId(id)}
                selectedArticleId={selectedArticleId}
              />
            )}

            {activeTab === 'map' && (
              <ClusterMap
                points={projectionPoints}
                clusters={clusteringResult.clusters}
                articles={articles}
                explainedVariance={explainedVariance}
                projectionMethod={config.projectionMethod}
                onSelectArticle={(id) => setSelectedArticleId(id)}
                selectedArticleId={selectedArticleId}
              />
            )}

            {activeTab === 'clusters' && (
              <ClusterSummaryCards
                clusters={clusteringResult.clusters}
                articles={articles}
                totalArticles={articles.length}
                onSelectArticle={(id) => setSelectedArticleId(id)}
              />
            )}

            {activeTab === 'heatmap' && (
              <SimilarityHeatmap
                articles={articles}
                tfidf={tfidfModel}
                clusters={clusteringResult.clusters}
                assignments={clusteringResult.assignments}
                onSelectArticle={(id) => setSelectedArticleId(id)}
              />
            )}

            {activeTab === 'dendrogram' && (
              <DendrogramView
                root={
                  dendrogramRoot || {
                    id: 'root',
                    isLeaf: false,
                    distance: 1.0,
                    children: [
                      { id: '1', isLeaf: true, distance: 0 },
                      { id: '2', isLeaf: true, distance: 0 }
                    ]
                  }
                }
                articles={articles}
                clusters={clusteringResult.clusters}
                assignments={clusteringResult.assignments}
                onSelectArticle={(id) => setSelectedArticleId(id)}
                targetK={config.k}
              />
            )}

            {activeTab === 'evaluation' && (
              <ModelEvaluation
                clusteringResult={clusteringResult}
                elbowData={elbowData}
                tfidf={tfidfModel}
                currentK={config.k}
                onSelectK={(k) => handleUpdateConfig({ k })}
                clusters={clusteringResult.clusters}
              />
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <ArticleInspectorModal
        articleId={selectedArticleId}
        articles={articles}
        tfidf={tfidfModel}
        clusters={clusteringResult.clusters}
        assignments={clusteringResult.assignments}
        onClose={() => setSelectedArticleId(null)}
        onSelectArticle={(id) => setSelectedArticleId(id)}
      />

      <QueryClassifierModal
        isOpen={isTestQueryOpen}
        onClose={() => setIsTestQueryOpen(false)}
        tfidf={tfidfModel}
        clusters={clusteringResult.clusters}
        articles={articles}
        assignments={clusteringResult.assignments}
        onSelectArticle={(id) => setSelectedArticleId(id)}
      />

      <AddArticleModal
        isOpen={isAddArticleOpen}
        onClose={() => setIsAddArticleOpen(false)}
        onAddArticle={handleAddArticle}
        onResetBenchmark={handleResetBenchmark}
      />
    </div>
  );
}
