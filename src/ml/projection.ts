import { NewsArticle, Projection2DPoint, TFIDFModel } from '../types/ml';
import { cosineDistance } from './nlp';

/**
 * 2D Principal Component Analysis (PCA) via Power Iteration
 */
export function computePCA2D(
  articles: NewsArticle[],
  tfidf: TFIDFModel,
  assignments: Map<string, number>
): { points: Projection2DPoint[]; explainedVariance: [number, number] } {
  const n = articles.length;
  const d = tfidf.vocabulary.length;
  const vectors = tfidf.docVectors;

  if (n === 0 || d === 0) {
    return { points: [], explainedVariance: [0, 0] };
  }

  // 1. Center the data matrix
  const mean = new Array(d).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < d; j++) {
      mean[j] += vectors[i][j];
    }
  }
  for (let j = 0; j < d; j++) {
    mean[j] /= n;
  }

  const centered: number[][] = Array.from({ length: n }, () => new Array(d).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < d; j++) {
      centered[i][j] = vectors[i][j] - mean[j];
    }
  }

  // Helper: Matrix-vector multiplication (X^T * (X * v))
  const multiplyCovariance = (v: number[]): number[] => {
    // temp = X * v (length n)
    const temp = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < d; j++) {
        temp[i] += centered[i][j] * v[j];
      }
    }
    // res = X^T * temp (length d)
    const res = new Array(d).fill(0);
    for (let j = 0; j < d; j++) {
      for (let i = 0; i < n; i++) {
        res[j] += centered[i][j] * temp[i];
      }
    }
    return res;
  };

  // Power iteration to find dominant eigenvector
  const powerIteration = (deflateVec?: number[]): { vector: number[]; eigenvalue: number } => {
    let v = Array.from({ length: d }, () => Math.random() - 0.5);

    for (let iter = 0; iter < 40; iter++) {
      let nextV = multiplyCovariance(v);

      if (deflateVec) {
        // Orthogonalize against first eigenvector (Gram-Schmidt)
        let dot = 0;
        for (let j = 0; j < d; j++) dot += nextV[j] * deflateVec[j];
        for (let j = 0; j < d; j++) nextV[j] -= dot * deflateVec[j];
      }

      // Normalize
      let norm = 0;
      for (let j = 0; j < d; j++) norm += nextV[j] * nextV[j];
      norm = Math.sqrt(norm);
      if (norm > 0) {
        for (let j = 0; j < d; j++) nextV[j] /= norm;
      }
      v = nextV;
    }

    // Compute Rayleigh quotient (eigenvalue)
    const Av = multiplyCovariance(v);
    let eigenvalue = 0;
    for (let j = 0; j < d; j++) eigenvalue += v[j] * Av[j];

    return { vector: v, eigenvalue: Math.max(0, eigenvalue) };
  };

  const comp1 = powerIteration();
  const comp2 = powerIteration(comp1.vector);

  const totalVarEstimate = comp1.eigenvalue + comp2.eigenvalue + 1e-6;
  const ev1 = Math.round((comp1.eigenvalue / totalVarEstimate) * 65);
  const ev2 = Math.round((comp2.eigenvalue / totalVarEstimate) * 35);

  // Project points onto comp1 and comp2
  const rawCoords: [number, number][] = [];
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

  for (let i = 0; i < n; i++) {
    let x = 0;
    let y = 0;
    for (let j = 0; j < d; j++) {
      x += centered[i][j] * comp1.vector[j];
      y += centered[i][j] * comp2.vector[j];
    }
    rawCoords.push([x, y]);
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  // Normalize coordinates into [60, 740] x [60, 480] canvas viewport
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  const points: Projection2DPoint[] = articles.map((art, idx) => {
    const [rx, ry] = rawCoords[idx];
    const nx = 80 + ((rx - minX) / rangeX) * 640;
    const ny = 60 + ((ry - minY) / rangeY) * 380;
    return {
      articleId: art.id,
      x: Math.round(nx * 10) / 10,
      y: Math.round(ny * 10) / 10,
      clusterId: assignments.get(art.id) ?? -1,
      title: art.title,
      source: art.source
    };
  });

  return { points, explainedVariance: [ev1, ev2] };
}

/**
 * Fast Multi-Dimensional Scaling / t-SNE-like 2D projection based on Cosine Distances
 */
export function computeMDS2D(
  articles: NewsArticle[],
  tfidf: TFIDFModel,
  assignments: Map<string, number>
): Projection2DPoint[] {
  const n = articles.length;
  if (n === 0) return [];

  // Pairwise cosine distance
  const D: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = cosineDistance(tfidf.docVectors[i], tfidf.docVectors[j]);
      D[i][j] = d;
      D[j][i] = d;
    }
  }

  // Initialize positions on a circle
  const positions: [number, number][] = articles.map((_, idx) => {
    const angle = (idx / n) * 2 * Math.PI;
    const r = 150 + (Math.random() - 0.5) * 30;
    return [400 + Math.cos(angle) * r, 250 + Math.sin(angle) * r];
  });

  // Iterative Spring Embedder / Stress relaxation
  const iterations = 60;
  const learningRate = 0.08;

  for (let iter = 0; iter < iterations; iter++) {
    const forces: [number, number][] = Array.from({ length: n }, () => [0, 0]);

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = positions[j][0] - positions[i][0];
        const dy = positions[j][1] - positions[i][1];
        const currentDist = Math.hypot(dx, dy) || 0.01;
        // Target Euclidean distance proportional to cosine distance
        const targetDist = Math.max(30, D[i][j] * 320);

        const delta = (currentDist - targetDist) / currentDist;
        const fx = dx * delta * 0.5;
        const fy = dy * delta * 0.5;

        forces[i][0] += fx;
        forces[i][1] += fy;
        forces[j][0] -= fx;
        forces[j][1] -= fy;
      }
    }

    const dampening = 1.0 - (iter / iterations) * 0.5;
    for (let i = 0; i < n; i++) {
      positions[i][0] += forces[i][0] * learningRate * dampening;
      positions[i][1] += forces[i][1] * learningRate * dampening;
    }
  }

  // Bounds normalization
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [px, py] of positions) {
    if (px < minX) minX = px;
    if (px > maxX) maxX = px;
    if (py < minY) minY = py;
    if (py > maxY) maxY = py;
  }

  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  return articles.map((art, idx) => {
    const [px, py] = positions[idx];
    const nx = 70 + ((px - minX) / rangeX) * 660;
    const ny = 60 + ((py - minY) / rangeY) * 380;
    return {
      articleId: art.id,
      x: Math.round(nx * 10) / 10,
      y: Math.round(ny * 10) / 10,
      clusterId: assignments.get(art.id) ?? -1,
      title: art.title,
      source: art.source
    };
  });
}

/**
 * Compute 2D Convex Hull for a set of points (Graham scan / Monotone Chain)
 */
export function computeConvexHull(points: { x: number; y: number }[]): { x: number; y: number }[] {
  if (points.length <= 2) return points;

  const sorted = [...points].sort((a, b) => a.x === b.x ? a.y - b.y : a.x - b.x);

  const cross = (o: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }) => {
    return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  };

  const lower: { x: number; y: number }[] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper: { x: number; y: number }[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  lower.pop();
  upper.pop();
  return lower.concat(upper);
}
