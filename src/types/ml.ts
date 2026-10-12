export interface NewsArticle {
  id: string;
  title: string;
  content: string;
  source: string;
  publishedDate: string;
  author?: string;
}

export interface PreprocessedDoc {
  id: string;
  tokens: string[];
  tokenCounts: Map<string, number>;
  totalTokens: number;
}

export interface TFIDFModel {
  vocabulary: string[]; // Ordered list of terms
  vocabIndex: Map<string, number>;
  idf: number[];
  docVectors: number[][]; // L2 normalized TF-IDF vectors
  topWordsPerDoc: { word: string; score: number }[][];
}

export interface ClusterInfo {
  clusterId: number;
  label: string; // Auto-generated topic name (e.g., "Macroeconomics & Monetary Policy")
  color: string;
  articleIds: string[];
  centroidKeywords: { word: string; score: number }[];
  coherenceScore: number; // Average intra-cluster cosine similarity
  representativeArticleId: string;
}

export interface ClusteringResult {
  algorithm: 'kmeans' | 'dbscan' | 'hierarchical';
  assignments: Map<string, number>; // articleId -> clusterId (-1 for noise in DBSCAN)
  clusters: ClusterInfo[];
  noiseCount: number;
  silhouetteScore: number;
  clusterSilhouettes: { clusterId: number; score: number }[];
  daviesBouldinIndex: number;
  inertia?: number; // For K-Means (WCSS)
  elapsedTimeMs: number;
}

export interface Projection2DPoint {
  articleId: string;
  x: number;
  y: number;
  clusterId: number;
  title: string;
  source: string;
}

export interface DendrogramNode {
  id: string;
  isLeaf: boolean;
  articleId?: string;
  distance: number;
  children?: [DendrogramNode, DendrogramNode];
  x?: number;
  y?: number;
  clusterId?: number;
}

export interface PipelineConfig {
  algorithm: 'kmeans' | 'dbscan' | 'hierarchical';
  k: number;
  dbscanEps: number;
  dbscanMinSamples: number;
  hierarchicalLinkage: 'average' | 'complete' | 'single';
  maxFeatures: number;
  minDf: number;
  useNgrams: boolean; // include bigrams
  sublinearTf: boolean;
  projectionMethod: 'pca' | 'tsne';
}

export interface ElbowPoint {
  k: number;
  inertia: number;
}
