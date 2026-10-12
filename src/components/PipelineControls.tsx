import React from 'react';
import { PipelineConfig } from '../types/ml';
import { RefreshCw, Settings2, Sliders, Sparkles } from 'lucide-react';

interface PipelineControlsProps {
  config: PipelineConfig;
  onChangeConfig: (newConfig: Partial<PipelineConfig>) => void;
  onResetDefaults: () => void;
}

export const PipelineControls: React.FC<PipelineControlsProps> = ({
  config,
  onChangeConfig,
  onResetDefaults
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-slate-700" />
          <h2 className="text-sm font-bold text-slate-900">Unsupervised Pipeline Configuration</h2>
        </div>
        <button
          onClick={onResetDefaults}
          className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
          title="Reset to default hyperparameters"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* Algorithm Selection */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-700 block">
          Clustering Algorithm
        </label>
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => onChangeConfig({ algorithm: 'kmeans' })}
            className={`py-1.5 px-2 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              config.algorithm === 'kmeans'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            K-Means++
          </button>
          <button
            onClick={() => onChangeConfig({ algorithm: 'hierarchical' })}
            className={`py-1.5 px-2 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              config.algorithm === 'hierarchical'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Hierarchical
          </button>
          <button
            onClick={() => onChangeConfig({ algorithm: 'dbscan' })}
            className={`py-1.5 px-2 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              config.algorithm === 'dbscan'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            DBSCAN
          </button>
        </div>
      </div>

      {/* Algorithm-Specific Hyperparameters */}
      {(config.algorithm === 'kmeans' || config.algorithm === 'hierarchical') && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Number of Clusters (K)</span>
            <span className="font-mono font-bold text-blue-600 tabular-nums">{config.k}</span>
          </div>
          <input
            type="range"
            min="2"
            max="8"
            step="1"
            value={config.k}
            onChange={(e) => onChangeConfig({ k: Number(e.target.value) })}
            className="w-full accent-blue-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>2</span>
            <span>4</span>
            <span>6</span>
            <span>8</span>
          </div>
        </div>
      )}

      {config.algorithm === 'hierarchical' && (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 block">Linkage Criterion</label>
          <select
            value={config.hierarchicalLinkage}
            onChange={(e) =>
              onChangeConfig({
                hierarchicalLinkage: e.target.value as 'average' | 'complete' | 'single'
              })
            }
            className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="average">Average Linkage (UPGMA - Robust)</option>
            <option value="complete">Complete Linkage (Max Distance - Compact)</option>
            <option value="single">Single Linkage (Min Distance - Chaining)</option>
          </select>
        </div>
      )}

      {config.algorithm === 'dbscan' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Epsilon Distance (ε)</span>
              <span className="font-mono font-bold text-blue-600 tabular-nums">
                {config.dbscanEps.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.45"
              max="0.85"
              step="0.02"
              value={config.dbscanEps}
              onChange={(e) => onChangeConfig({ dbscanEps: Number(e.target.value) })}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>0.45 (Tight)</span>
              <span>0.65</span>
              <span>0.85 (Broad)</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Min Core Samples</span>
              <span className="font-mono font-bold text-blue-600 tabular-nums">
                {config.dbscanMinSamples}
              </span>
            </div>
            <input
              type="range"
              min="2"
              max="5"
              step="1"
              value={config.dbscanMinSamples}
              onChange={(e) => onChangeConfig({ dbscanMinSamples: Number(e.target.value) })}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* NLP Feature Extraction & TF-IDF Options */}
      <div className="space-y-3 pt-3 border-t border-slate-100">
        <label className="text-xs font-semibold text-slate-700 block">
          Feature Extraction (TF-IDF Vectorizer)
        </label>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600">Max Vocabulary Features</span>
            <span className="font-mono tabular-nums text-slate-800 font-medium">
              {config.maxFeatures}
            </span>
          </div>
          <input
            type="range"
            min="100"
            max="500"
            step="50"
            value={config.maxFeatures}
            onChange={(e) => onChangeConfig({ maxFeatures: Number(e.target.value) })}
            className="w-full accent-slate-800 cursor-pointer"
          />
        </div>

        <div className="space-y-2 pt-1">
          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={config.useNgrams}
              onChange={(e) => onChangeConfig({ useNgrams: e.target.checked })}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Include Bigrams (e.g. "interest_rates", "lunar_mission")</span>
          </label>

          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={config.sublinearTf}
              onChange={(e) => onChangeConfig({ sublinearTf: e.target.checked })}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Sublinear TF Scaling (1 + ln(tf))</span>
          </label>
        </div>
      </div>

      {/* 2D Projection Method */}
      <div className="space-y-2 pt-3 border-t border-slate-100">
        <label className="text-xs font-semibold text-slate-700 block">
          2D Manifold Projection
        </label>
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => onChangeConfig({ projectionMethod: 'pca' })}
            className={`py-1.5 px-2 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              config.projectionMethod === 'pca'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            PCA (Linear SVD)
          </button>
          <button
            onClick={() => onChangeConfig({ projectionMethod: 'tsne' })}
            className={`py-1.5 px-2 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              config.projectionMethod === 'tsne'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            MDS (Cosine Stress)
          </button>
        </div>
      </div>
    </div>
  );
};
