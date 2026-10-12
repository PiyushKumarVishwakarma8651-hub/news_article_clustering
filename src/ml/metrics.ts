import { ElbowPoint, NewsArticle, TFIDFModel } from '../types/ml';
import { runKMeans } from './clustering';
import { cosineDistance } from './nlp';

/**
 * Compute Silhouette Score for clustering results
 */
export function computeSilhouetteScores(
  articles: NewsArticle[],
  tfidf: TFIDFModel,
  assignments: Map<string, number>
): {
  overall: number;
  perCluster: { clusterId: number; score: number }[];
} {
  const n = articles.length;
  const vectors = tfidf.docVectors;

  // Filter out noise (-1) points
  const validIndices: number[] = [];
  const clusterMemberIndices = new Map<number, number[]>();

  articles.forEach((art, idx) => {
    const cId = assignments.get(art.id) ?? -1;
    if (cId !== -1) {
      validIndices.push(idx);
      if (!clusterMemberIndices.has(cId)) {
        clusterMemberIndices.set(cId, []);
      }
      clusterMemberIndices.get(cId)!.push(idx);
    }
  });

  const clusterIds = Array.from(clusterMemberIndices.keys());
  if (clusterIds.length <= 1 || validIndices.length <= clusterIds.length) {
    return { overall: 0, perCluster: [] };
  }

  // Precompute pairwise distances
  const distMatrix: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = cosineDistance(vectors[i], vectors[j]);
      distMatrix[i][j] = d;
      distMatrix[j][i] = d;
    }
  }

  const individualSilhouettes = new Map<number, number>(); // idx -> s(i)

  for (const i of validIndices) {
    const ownCluster = assignments.get(articles[i].id)!;
    const ownMembers = clusterMemberIndices.get(ownCluster)!;

    // 1. Calculate a(i) - mean intra-cluster distance
    let a_i = 0;
    if (ownMembers.length > 1) {
      let sumDist = 0;
      for (const m of ownMembers) {
        if (m !== i) sumDist += distMatrix[i][m];
      }
      a_i = sumDist / (ownMembers.length - 1);
    } else {
      a_i = 0;
    }

    // 2. Calculate b(i) - min mean distance to other clusters
    let b_i = Infinity;
    for (const otherC of clusterIds) {
      if (otherC === ownCluster) continue;
      const otherMembers = clusterMemberIndices.get(otherC)!;
      if (otherMembers.length === 0) continue;

      let sumOther = 0;
      for (const om of otherMembers) {
        sumOther += distMatrix[i][om];
      }
      const meanDistOther = sumOther / otherMembers.length;
      if (meanDistOther < b_i) {
        b_i = meanDistOther;
      }
    }

    // 3. Silhouette s(i)
    const maxVal = Math.max(a_i, b_i);
    const s_i = maxVal > 0 ? (b_i - a_i) / maxVal : 0;
    individualSilhouettes.set(i, Math.max(-1, Math.min(1, s_i)));
  }

  // Calculate per-cluster averages and overall average
  let totalScore = 0;
  validIndices.forEach((i) => {
    totalScore += individualSilhouettes.get(i) || 0;
  });
  const overall = validIndices.length > 0 ? totalScore / validIndices.length : 0;

  const perCluster: { clusterId: number; score: number }[] = clusterIds.map((cId) => {
    const members = clusterMemberIndices.get(cId) || [];
    let cTotal = 0;
    members.forEach((m) => {
      cTotal += individualSilhouettes.get(m) || 0;
    });
    const avg = members.length > 0 ? cTotal / members.length : 0;
    return {
      clusterId: cId,
      score: Math.round(avg * 100) / 100
    };
  });

  return {
    overall: Math.round(overall * 100) / 100,
    perCluster
  };
}

/**
 * Compute Davies-Bouldin Index (lower is better, < 1.5 indicates good clustering)
 */
export function computeDaviesBouldin(
  articles: NewsArticle[],
  tfidf: TFIDFModel,
  assignments: Map<string, number>
): number {
  const vectors = tfidf.docVectors;
  const dim = tfidf.vocabulary.length;

  const clusterMemberMap = new Map<number, number[]>();
  articles.forEach((art, idx) => {
    const cId = assignments.get(art.id) ?? -1;
    if (cId !== -1) {
      if (!clusterMemberMap.has(cId)) clusterMemberMap.set(cId, []);
      clusterMemberMap.get(cId)!.push(idx);
    }
  });

  const clusterIds = Array.from(clusterMemberMap.keys());
  if (clusterIds.length <= 1) return 0;

  // Compute centroids & average dispersion S_i
  const centroids = new Map<number, number[]>();
  const dispersions = new Map<number, number>();

  clusterIds.forEach((cId) => {
    const members = clusterMemberMap.get(cId)!;
    const center = new Array(dim).fill(0);
    members.forEach((m) => {
      for (let d = 0; d < dim; d++) center[d] += vectors[m][d];
    });
    for (let d = 0; d < dim; d++) center[d] /= members.length;
    centroids.set(cId, center);

    let sumDist = 0;
    members.forEach((m) => {
      sumDist += cosineDistance(vectors[m], center);
    });
    dispersions.set(cId, sumDist / members.length);
  });

  let sumD = 0;
  for (let i = 0; i < clusterIds.length; i++) {
    const c1 = clusterIds[i];
    let maxR = -Infinity;

    for (let j = 0; j < clusterIds.length; j++) {
      if (i === j) continue;
      const c2 = clusterIds[j];
      const dCentroids = cosineDistance(centroids.get(c1)!, centroids.get(c2)!);
      if (dCentroids > 0) {
        const r = (dispersions.get(c1)! + dispersions.get(c2)!) / dCentroids;
        if (r > maxR) maxR = r;
      }
    }
    if (maxR > -Infinity) sumD += maxR;
  }

  return Math.round((sumD / clusterIds.length) * 100) / 100;
}

/**
 * Compute Elbow Method WCSS Curve across k = 2..8
 */
export function computeElbowCurve(
  articles: NewsArticle[],
  tfidf: TFIDFModel
): ElbowPoint[] {
  const points: ElbowPoint[] = [];
  const maxK = Math.min(8, Math.floor(articles.length / 2));

  for (let k = 2; k <= maxK; k++) {
    const result = runKMeans(articles, tfidf, k, 40);
    points.push({
      k,
      inertia: Math.round(result.inertia * 100) / 100
    });
  }

  return points;
}
