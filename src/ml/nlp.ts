import { NewsArticle, PreprocessedDoc, TFIDFModel } from '../types/ml';

// Comprehensive English stopwords + news reporting boilerplate words
export const STOPWORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from',
  'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself',
  'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me', 'more', 'most',
  'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'our',
  'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some', 'such', 'than',
  'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this',
  'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when',
  'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would', 'you', 'your', 'yours', 'yourself',
  'yourselves',
  // News-reporting boilerplate & conversational fillers
  'said', 'reported', 'according', 'told', 'also', 'new', 'year', 'years', 'month', 'months', 'day', 'days',
  'time', 'times', 'first', 'two', 'three', 'four', 'five', 'six', 'hundred', 'thousand', 'million', 'billion',
  'percent', 'per', 'announced', 'added', 'noted', 'confirmed', 'including', 'following', 'across', 'well',
  'many', 'much', 'still', 'today', 'recent', 'recently', 'weekly', 'daily', 'sources', 'spokesperson',
  'states', 'state', 'public', 'private', 'made', 'make', 'make', 'may', 'will', 'like', 'take', 'last'
]);

/**
 * Lightweight rule-based stemmer to unify plurals, gerunds, and standard inflections
 */
export function simpleStem(word: string): string {
  if (word.length <= 4) return word;
  
  let w = word.toLowerCase();

  // Common endings
  if (w.endsWith('ies') && w.length > 5) return w.slice(0, -3) + 'y';
  if (w.endsWith('sses')) return w.slice(0, -2);
  if (w.endsWith('s') && !w.endsWith('ss') && !w.endsWith('us') && !w.endsWith('is')) {
    w = w.slice(0, -1);
  }
  if (w.endsWith('ing') && w.length > 5) {
    w = w.slice(0, -3);
    if (w.endsWith('tt') || w.endsWith('pp') || w.endsWith('nn')) w = w.slice(0, -1);
  } else if (w.endsWith('ed') && w.length > 5) {
    w = w.slice(0, -2);
    if (w.endsWith('tt') || w.endsWith('pp') || w.endsWith('nn')) w = w.slice(0, -1);
  } else if (w.endsWith('ly') && w.length > 5) {
    w = w.slice(0, -2);
  } else if (w.endsWith('tion') && w.length > 6) {
    w = w.slice(0, -4) + 't';
  } else if (w.endsWith('ment') && w.length > 6) {
    w = w.slice(0, -4);
  }

  return w;
}

/**
 * Tokenize raw text into normalized words and n-grams
 */
export function tokenizeText(text: string, useNgrams = true, stem = true): string[] {
  // Normalize, strip non-alphanumeric, lowercase
  const cleaned = text
    .toLowerCase()
    .replace(/['’]/g, '') // remove apostrophes so "o'connor" -> "oconnor"
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const rawWords = cleaned.split(' ');
  const unigrams: string[] = [];

  for (const raw of rawWords) {
    const word = raw.trim();
    if (word.length >= 3 && !/^\d+$/.test(word) && !STOPWORDS.has(word)) {
      const processed = stem ? simpleStem(word) : word;
      if (!STOPWORDS.has(processed) && processed.length >= 3) {
        unigrams.push(processed);
      }
    }
  }

  const tokens = [...unigrams];

  // Generate bigrams if enabled
  if (useNgrams && unigrams.length >= 2) {
    for (let i = 0; i < unigrams.length - 1; i++) {
      const bigram = `${unigrams[i]}_${unigrams[i + 1]}`;
      tokens.push(bigram);
    }
  }

  return tokens;
}

/**
 * Preprocess an array of news articles
 */
export function preprocessArticles(
  articles: NewsArticle[],
  useNgrams = true,
  stem = true
): PreprocessedDoc[] {
  return articles.map((article) => {
    // Title words are weighted slightly more heavily by including them twice in token stream
    const combinedText = `${article.title}. ${article.title}. ${article.content}`;
    const tokens = tokenizeText(combinedText, useNgrams, stem);
    const tokenCounts = new Map<string, number>();

    for (const t of tokens) {
      tokenCounts.set(t, (tokenCounts.get(t) || 0) + 1);
    }

    return {
      id: article.id,
      tokens,
      tokenCounts,
      totalTokens: tokens.length
    };
  });
}

/**
 * Calculate TF-IDF Model from preprocessed documents
 */
export function buildTFIDFModel(
  docs: PreprocessedDoc[],
  maxFeatures = 300,
  minDf = 1,
  sublinearTf = true
): TFIDFModel {
  const N = docs.length;
  if (N === 0) {
    return {
      vocabulary: [],
      vocabIndex: new Map(),
      idf: [],
      docVectors: [],
      topWordsPerDoc: []
    };
  }

  // 1. Calculate Document Frequency (DF) for all terms
  const docFrequency = new Map<string, number>();
  const totalCorpusFrequency = new Map<string, number>();

  docs.forEach((doc) => {
    doc.tokenCounts.forEach((count, term) => {
      docFrequency.set(term, (docFrequency.get(term) || 0) + 1);
      totalCorpusFrequency.set(term, (totalCorpusFrequency.get(term) || 0) + count);
    });
  });

  // 2. Filter terms by minDf and maxDf (> 85% of documents ignored as corpus stopword)
  const maxDfThreshold = Math.max(2, Math.floor(N * 0.85));
  let candidateTerms = Array.from(docFrequency.keys()).filter((term) => {
    const df = docFrequency.get(term)!;
    return df >= minDf && df <= maxDfThreshold;
  });

  // 3. Rank terms by total corpus importance to pick top `maxFeatures`
  candidateTerms.sort((a, b) => {
    const scoreA = (totalCorpusFrequency.get(a) || 0) * Math.log(1 + N / (docFrequency.get(a) || 1));
    const scoreB = (totalCorpusFrequency.get(b) || 0) * Math.log(1 + N / (docFrequency.get(b) || 1));
    return scoreB - scoreA;
  });

  const vocabulary = candidateTerms.slice(0, maxFeatures);
  const vocabIndex = new Map<string, number>();
  vocabulary.forEach((term, idx) => vocabIndex.set(term, idx));

  // 4. Calculate IDF for selected vocabulary (Smooth IDF formula: ln((1 + N)/(1 + df)) + 1)
  const idf = vocabulary.map((term) => {
    const df = docFrequency.get(term) || 0;
    return Math.log((1 + N) / (1 + df)) + 1.0;
  });

  // 5. Construct L2 Normalized TF-IDF vectors for each document
  const docVectors: number[][] = [];
  const topWordsPerDoc: { word: string; score: number }[][] = [];

  docs.forEach((doc) => {
    const vector = new Array(vocabulary.length).fill(0);
    const wordScores: { word: string; score: number }[] = [];

    vocabulary.forEach((term, termIdx) => {
      const count = doc.tokenCounts.get(term) || 0;
      if (count > 0) {
        // Sublinear TF: 1 + ln(tf)
        const tf = sublinearTf ? 1 + Math.log(count) : count;
        const val = tf * idf[termIdx];
        vector[termIdx] = val;
        wordScores.push({ word: term.replace('_', ' '), score: val });
      }
    });

    // L2 Normalize: vector / norm
    let sumSq = 0;
    for (let i = 0; i < vector.length; i++) {
      sumSq += vector[i] * vector[i];
    }
    const norm = Math.sqrt(sumSq);

    if (norm > 0) {
      for (let i = 0; i < vector.length; i++) {
        vector[i] /= norm;
      }
      wordScores.forEach((ws) => {
        ws.score /= norm;
      });
    }

    wordScores.sort((a, b) => b.score - a.score);

    docVectors.push(vector);
    topWordsPerDoc.push(wordScores.slice(0, 8));
  });

  return {
    vocabulary,
    vocabIndex,
    idf,
    docVectors,
    topWordsPerDoc
  };
}

/**
 * Vectorize a novel text string (query, headline, test article) against an existing TF-IDF model
 */
export function vectorizeQuery(
  text: string,
  model: TFIDFModel,
  useNgrams = true,
  stem = true,
  sublinearTf = true
): number[] {
  const tokens = tokenizeText(text, useNgrams, stem);
  const tokenCounts = new Map<string, number>();
  for (const t of tokens) {
    tokenCounts.set(t, (tokenCounts.get(t) || 0) + 1);
  }

  const vector = new Array(model.vocabulary.length).fill(0);
  model.vocabulary.forEach((term, idx) => {
    const count = tokenCounts.get(term) || 0;
    if (count > 0) {
      const tf = sublinearTf ? 1 + Math.log(count) : count;
      vector[idx] = tf * model.idf[idx];
    }
  });

  // L2 normalize
  let sumSq = 0;
  for (let i = 0; i < vector.length; i++) {
    sumSq += vector[i] * vector[i];
  }
  const norm = Math.sqrt(sumSq);
  if (norm > 0) {
    for (let i = 0; i < vector.length; i++) {
      vector[i] /= norm;
    }
  }

  return vector;
}

/**
 * Compute Cosine Similarity between two L2 normalized vectors
 * (Dot product of normalized vectors = Cosine Similarity)
 */
export function cosineSimilarity(v1: number[], v2: number[]): number {
  if (v1.length !== v2.length || v1.length === 0) return 0;
  let dot = 0;
  for (let i = 0; i < v1.length; i++) {
    dot += v1[i] * v2[i];
  }
  // Clamp between -1 and 1
  return Math.max(-1, Math.min(1, dot));
}

/**
 * Cosine distance = 1 - cosine_similarity
 */
export function cosineDistance(v1: number[], v2: number[]): number {
  return 1 - cosineSimilarity(v1, v2);
}
