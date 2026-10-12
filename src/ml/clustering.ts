import { ClusterInfo, ClusteringResult, DendrogramNode, NewsArticle, TFIDFModel } from '../types/ml';
import { cosineDistance, cosineSimilarity } from './nlp';

// Distinctive palette for clusters (accessible, high contrast, clean)
export const CLUSTER_PALETTES = [
  '#2563EB', // Blue (AI & Computing)
  '#059669', // Emerald (Clean Energy & Climate)
  '#D97706', // Amber (Finance & Markets)
  '#7C3AED', // Purple (Space Exploration)
  '#DC2626', // Red (Biomedicine)
  '#0891B2', // Cyan (Sports & Athletics)
  '#EA580C', // Orange
  '#4F46E5', // Indigo
  '#475569', // Slate (Noise/Outliers)
];

/**
 * Automatically synthesizes a clean, human-readable topic title from top centroid keywords
 */
export function generateClusterTitle(topWords: { word: string; score: number }[]): string {
  if (!topWords || topWords.length === 0) return 'Uncategorized News Cluster';

  const words = topWords.map((w) => w.word.replace('_', ' '));
  const wStr = words.slice(0, 6).join(' ').toLowerCase();

  // ISRO & Indian Space
  if (wStr.includes('isro') || wStr.includes('gaganyaan') || wStr.includes('aditya') || wStr.includes('pragyan') || wStr.includes('chandrayaan') || wStr.includes('sslv') || wStr.includes('sriharikota') || wStr.includes('antariksh')) {
    return 'ISRO Space Missions & Space Exploration';
  }

  // Indian Economy, RBI, UPI, Sensex
  if (wStr.includes('rbi') || wStr.includes('repo') || wStr.includes('upi') || wStr.includes('sensex') || wStr.includes('nifty') || wStr.includes('bse') || wStr.includes('gdp') || wStr.includes('rupee') || (wStr.includes('bank') && wStr.includes('inflat'))) {
    return 'Indian Economy, RBI & Digital Finance';
  }

  // India Semiconductor & Tech
  if (wStr.includes('semiconductor') || wStr.includes('tata') || wStr.includes('dholera') || wStr.includes('micron') || wStr.includes('sanand') || wStr.includes('bhashini') || (wStr.includes('indic') || wStr.includes('bengaluru'))) {
    return 'India Semiconductor Mission & Tech Startups';
  }

  // Clean Energy & Railways Infrastructure
  if (wStr.includes('khavda') || wStr.includes('vande') || wStr.includes('bharat') || wStr.includes('railway') || wStr.includes('solar') || wStr.includes('hydrogen') || wStr.includes('surya') || wStr.includes('renew')) {
    return 'Clean Energy & Infrastructure in India';
  }

  // Healthcare, Vaccines & Pharma
  if (wStr.includes('vaccin') || wStr.includes('serum') || wStr.includes('aiims') || wStr.includes('pharma') || wStr.includes('car-t') || wStr.includes('cancer') || wStr.includes('biomarker') || wStr.includes('malaria') || wStr.includes('blood')) {
    return 'Healthcare, Vaccines & Medical Biotechnology';
  }

  // Sports & Cricket
  if (wStr.includes('cricket') || wStr.includes('ipl') || wStr.includes('bcci') || wStr.includes('chopra') || wStr.includes('javelin') || wStr.includes('chess') || wStr.includes('grandmaster') || wStr.includes('olympic') || wStr.includes('trophy')) {
    return 'Indian Cricket & Championship Athletics';
  }

  // International Macroeconomics & Central Banks
  if (wStr.includes('fed') || wStr.includes('ecb') || wStr.includes('imf') || wStr.includes('interest_rate') || wStr.includes('eurozone') || wStr.includes('payroll')) {
    return 'International Macroeconomics & Central Banks';
  }

  // International AI & Deep Tech
  if (wStr.includes('openai') || wStr.includes('nvidia') || wStr.includes('tensor') || wStr.includes('qubit') || wStr.includes('reason') || wStr.includes('transformer')) {
    return 'Global Frontier AI & Supercomputing';
  }

  // International Deep Space & Telescopes
  if (wStr.includes('telescope') || wStr.includes('webb') || wStr.includes('artemis') || wStr.includes('lunar') || wStr.includes('space') || wStr.includes('star')) {
    return 'Deep Space Astrophysics & Lunar Missions';
  }

  // International Climate & Diplomacy
  if (wStr.includes('climate') || wStr.includes('maritime') || wStr.includes('shipping') || wStr.includes('summit') || wStr.includes('treaty') || wStr.includes('accord')) {
    return 'Global Climate Accords & Maritime Security';
  }

  // Fallback: capitalize top 2 keywords
  const titleWords = words.slice(0, 2).map((w) => w.charAt(0).toUpperCase() + w.slice(1));
  return `${titleWords.join(' & ')} Focus`;
}

/**
 * K-Means++ Centroid Initialization
 */
function initializeKMeansPlusPlus(vectors: number[][], k: number): number[][] {
  const n = vectors.length;
  const centroids: number[][] = [];

  // 1. Choose first centroid uniformly at random
  const firstIdx = Math.floor(Math.random() * n);
  centroids.push([...vectors[firstIdx]]);

  // 2. Choose remaining k - 1 centroids with probability proportional to D(x)^2
  while (centroids.length < k) {
    const distSq: number[] = [];
    let sumDistSq = 0;

    for (let i = 0; i < n; i++) {
      let minDist = Infinity;
      for (const centroid of centroids) {
        const d = cosineDistance(vectors[i], centroid);
        if (d < minDist) minDist = d;
      }
      const d2 = minDist * minDist;
      distSq.push(d2);
      sumDistSq += d2;
    }

    // Weighted random selection
    const r = Math.random() * sumDistSq;
    let accumulated = 0;
    let selectedIdx = 0;

    for (let i = 0; i < n; i++) {
      accumulated += distSq[i];
      if (accumulated >= r) {
        selectedIdx = i;
        break;
      }
    }

    centroids.push([...vectors[selectedIdx]]);
  }

  return centroids;
}

/**
 * Run K-Means Clustering
 */
export function runKMeans(
  articles: NewsArticle[],
  tfidf: TFIDFModel,
  k: number,
  maxIterations = 100
): { assignments: Map<string, number>; centroids: number[][]; inertia: number } {
  const vectors = tfidf.docVectors;
  const n = vectors.length;
  const dim = tfidf.vocabulary.length;

  if (n === 0 || k <= 0) {
    return { assignments: new Map(), centroids: [], inertia: 0 };
  }

  const effectiveK = Math.min(k, n);
  let centroids = initializeKMeansPlusPlus(vectors, effectiveK);
  let assignments = new Array<number>(n).fill(0);
  let converged = false;
  let iteration = 0;

  while (!converged && iteration < maxIterations) {
    iteration++;
    let changed = false;

    // 1. Assignment step
    for (let i = 0; i < n; i++) {
      let closestCluster = 0;
      let minDistance = Infinity;

      for (let c = 0; c < effectiveK; c++) {
        const dist = cosineDistance(vectors[i], centroids[c]);
        if (dist < minDistance) {
          minDistance = dist;
          closestCluster = c;
        }
      }

      if (assignments[i] !== closestCluster) {
        assignments[i] = closestCluster;
        changed = true;
      }
    }

    if (!changed && iteration > 1) {
      converged = true;
      break;
    }

    // 2. Update centroids
    const newCentroids: number[][] = Array.from({ length: effectiveK }, () => new Array(dim).fill(0));
    const clusterSizes = new Array(effectiveK).fill(0);

    for (let i = 0; i < n; i++) {
      const c = assignments[i];
      clusterSizes[c]++;
      for (let d = 0; d < dim; d++) {
        newCentroids[c][d] += vectors[i][d];
      }
    }

    for (let c = 0; c < effectiveK; c++) {
      if (clusterSizes[c] > 0) {
        let normSq = 0;
        for (let d = 0; d < dim; d++) {
          newCentroids[c][d] /= clusterSizes[c];
          normSq += newCentroids[c][d] * newCentroids[c][d];
        }
        // Normalize centroid back to unit sphere for cosine distance
        const norm = Math.sqrt(normSq);
        if (norm > 0) {
          for (let d = 0; d < dim; d++) {
            newCentroids[c][d] /= norm;
          }
        }
      } else {
        // Re-seed empty cluster with random vector
        newCentroids[c] = [...vectors[Math.floor(Math.random() * n)]];
      }
    }

    centroids = newCentroids;
  }

  // Calculate inertia (WCSS - Within-Cluster Sum of Squares)
  let inertia = 0;
  for (let i = 0; i < n; i++) {
    const c = assignments[i];
    const dist = cosineDistance(vectors[i], centroids[c]);
    inertia += dist * dist;
  }

  const assignmentMap = new Map<string, number>();
  articles.forEach((art, idx) => {
    assignmentMap.set(art.id, assignments[idx]);
  });

  return { assignments: assignmentMap, centroids, inertia };
}

/**
 * Run DBSCAN (Density-Based Spatial Clustering of Applications with Noise)
 */
export function runDBSCAN(
  articles: NewsArticle[],
  tfidf: TFIDFModel,
  eps = 0.65,
  minSamples = 2
): { assignments: Map<string, number>; noiseCount: number } {
  const vectors = tfidf.docVectors;
  const n = vectors.length;
  const labels = new Array<number>(n).fill(-2); // -2: unvisited, -1: noise, >= 0: cluster
  let currentCluster = 0;

  // Precompute pairwise cosine distances
  const distMatrix: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = cosineDistance(vectors[i], vectors[j]);
      distMatrix[i][j] = d;
      distMatrix[j][i] = d;
    }
  }

  const regionQuery = (pointIdx: number): number[] => {
    const neighbors: number[] = [];
    for (let i = 0; i < n; i++) {
      if (distMatrix[pointIdx][i] <= eps) {
        neighbors.push(i);
      }
    }
    return neighbors;
  };

  for (let i = 0; i < n; i++) {
    if (labels[i] !== -2) continue; // Already processed

    const neighbors = regionQuery(i);
    if (neighbors.length < minSamples) {
      labels[i] = -1; // Mark as noise
    } else {
      labels[i] = currentCluster;
      const seedQueue = [...neighbors];

      while (seedQueue.length > 0) {
        const currentPt = seedQueue.shift()!;
        if (labels[currentPt] === -1) {
          labels[currentPt] = currentCluster; // Convert noise to border point
        }
        if (labels[currentPt] !== -2) continue;

        labels[currentPt] = currentCluster;
        const ptNeighbors = regionQuery(currentPt);
        if (ptNeighbors.length >= minSamples) {
          for (const neighbor of ptNeighbors) {
            if (labels[neighbor] === -2 || labels[neighbor] === -1) {
              seedQueue.push(neighbor);
            }
          }
        }
      }

      currentCluster++;
    }
  }

  const assignmentMap = new Map<string, number>();
  let noiseCount = 0;
  articles.forEach((art, idx) => {
    const l = labels[idx];
    if (l === -1) noiseCount++;
    assignmentMap.set(art.id, l);
  });

  return { assignments: assignmentMap, noiseCount };
}

/**
 * Hierarchical Agglomerative Clustering
 */
export function runHierarchical(
  articles: NewsArticle[],
  tfidf: TFIDFModel,
  targetK: number,
  linkage: 'average' | 'complete' | 'single' = 'average'
): { assignments: Map<string, number>; dendrogramRoot: DendrogramNode } {
  const vectors = tfidf.docVectors;
  const n = vectors.length;

  if (n === 0) {
    return {
      assignments: new Map(),
      dendrogramRoot: { id: 'root', isLeaf: true, distance: 0 }
    };
  }

  // Initial clusters: each point is its own cluster
  interface ClusterTracker {
    id: string;
    indices: number[];
    node: DendrogramNode;
  }

  let clusters: ClusterTracker[] = articles.map((art, idx) => ({
    id: `leaf-${idx}`,
    indices: [idx],
    node: {
      id: `node-${idx}`,
      isLeaf: true,
      articleId: art.id,
      distance: 0
    }
  }));

  // Precompute pairwise distance matrix
  const distMatrix: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = cosineDistance(vectors[i], vectors[j]);
      distMatrix[i][j] = d;
      distMatrix[j][i] = d;
    }
  }

  // Calculate distance between two clusters based on linkage
  const clusterDistance = (c1: ClusterTracker, c2: ClusterTracker): number => {
    let sum = 0;
    let minD = Infinity;
    let maxD = -Infinity;
    let count = 0;

    for (const i of c1.indices) {
      for (const j of c2.indices) {
        const d = distMatrix[i][j];
        sum += d;
        if (d < minD) minD = d;
        if (d > maxD) maxD = d;
        count++;
      }
    }

    if (linkage === 'single') return minD;
    if (linkage === 'complete') return maxD;
    return count > 0 ? sum / count : 0; // average
  };

  // Merge history for dendrogram
  let nodeCounter = n;
  let snapshotAtTargetK: ClusterTracker[] = [...clusters];

  while (clusters.length > 1) {
    let minD = Infinity;
    let bestPair: [number, number] = [0, 1];

    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const d = clusterDistance(clusters[i], clusters[j]);
        if (d < minD) {
          minD = d;
          bestPair = [i, j];
        }
      }
    }

    const [c1Idx, c2Idx] = bestPair;
    const c1 = clusters[c1Idx];
    const c2 = clusters[c2Idx];

    const mergedNode: DendrogramNode = {
      id: `merge-${nodeCounter++}`,
      isLeaf: false,
      distance: minD,
      children: [c1.node, c2.node]
    };

    const mergedCluster: ClusterTracker = {
      id: mergedNode.id,
      indices: [...c1.indices, ...c2.indices],
      node: mergedNode
    };

    // Remove merged clusters and insert new one
    clusters = clusters.filter((_, idx) => idx !== c1Idx && idx !== c2Idx);
    clusters.push(mergedCluster);

    if (clusters.length === targetK) {
      snapshotAtTargetK = clusters.map((c) => ({ ...c, indices: [...c.indices] }));
    }
  }

  // Dendrogram root is the single remaining cluster node
  const dendrogramRoot = clusters[0].node;

  // Assign cluster IDs 0 to targetK - 1 based on snapshot
  const assignmentMap = new Map<string, number>();
  snapshotAtTargetK.forEach((cl, clusterId) => {
    cl.indices.forEach((idx) => {
      assignmentMap.set(articles[idx].id, clusterId);
    });
  });

  return { assignments: assignmentMap, dendrogramRoot };
}

/**
 * Compile detailed ClusterInfo list (keywords, coherence, representative article)
 */
export function buildClusterSummaries(
  articles: NewsArticle[],
  tfidf: TFIDFModel,
  assignments: Map<string, number>
): ClusterInfo[] {
  const clusterArticleMap = new Map<number, string[]>();

  articles.forEach((art) => {
    const cId = assignments.get(art.id) ?? -1;
    if (!clusterArticleMap.has(cId)) {
      clusterArticleMap.set(cId, []);
    }
    clusterArticleMap.get(cId)!.push(art.id);
  });

  const articleIndexMap = new Map<string, number>();
  articles.forEach((art, idx) => articleIndexMap.set(art.id, idx));

  const clusters: ClusterInfo[] = [];

  // Sort cluster IDs ascending, putting noise (-1) at the end if present
  const sortedClusterIds = Array.from(clusterArticleMap.keys()).sort((a, b) => {
    if (a === -1) return 1;
    if (b === -1) return -1;
    return a - b;
  });

  sortedClusterIds.forEach((cId) => {
    const artIds = clusterArticleMap.get(cId) || [];
    if (artIds.length === 0) return;

    const isNoise = cId === -1;
    const color = isNoise
      ? '#64748B' // slate gray
      : CLUSTER_PALETTES[cId % (CLUSTER_PALETTES.length - 1)];

    // Calculate centroid vector
    const dim = tfidf.vocabulary.length;
    const centroidVec = new Array(dim).fill(0);

    artIds.forEach((id) => {
      const idx = articleIndexMap.get(id);
      if (idx !== undefined) {
        const vec = tfidf.docVectors[idx];
        for (let d = 0; d < dim; d++) {
          centroidVec[d] += vec[d];
        }
      }
    });

    if (artIds.length > 0) {
      for (let d = 0; d < dim; d++) {
        centroidVec[d] /= artIds.length;
      }
    }

    // Extract top centroid keywords
    const keywordScores: { word: string; score: number }[] = [];
    tfidf.vocabulary.forEach((word, d) => {
      if (centroidVec[d] > 0) {
        keywordScores.push({ word: word.replace('_', ' '), score: centroidVec[d] });
      }
    });
    keywordScores.sort((a, b) => b.score - a.score);
    const topKeywords = keywordScores.slice(0, 6);

    // Compute intra-cluster coherence (average pairwise cosine similarity)
    let totalSim = 0;
    let pairs = 0;
    for (let i = 0; i < artIds.length; i++) {
      for (let j = i + 1; j < artIds.length; j++) {
        const idx1 = articleIndexMap.get(artIds[i])!;
        const idx2 = articleIndexMap.get(artIds[j])!;
        totalSim += cosineSimilarity(tfidf.docVectors[idx1], tfidf.docVectors[idx2]);
        pairs++;
      }
    }
    const coherenceScore = pairs > 0 ? totalSim / pairs : 1.0;

    // Identify representative article (closest to cluster centroid)
    let bestDist = Infinity;
    let repId = artIds[0];
    artIds.forEach((id) => {
      const idx = articleIndexMap.get(id)!;
      const d = cosineDistance(tfidf.docVectors[idx], centroidVec);
      if (d < bestDist) {
        bestDist = d;
        repId = id;
      }
    });

    const label = isNoise ? 'Unclustered Outlier Reports (Noise)' : generateClusterTitle(topKeywords);

    clusters.push({
      clusterId: cId,
      label,
      color,
      articleIds: artIds,
      centroidKeywords: topKeywords,
      coherenceScore: Math.round(coherenceScore * 100) / 100,
      representativeArticleId: repId
    });
  });

  return clusters;
}
