import { useState, useEffect } from 'react';
import {
  ragSearch,
  ragStatus,
  ragIndex,
  SearchMode,
  SearchResult,
  CompareResult,
  SingleSearchResult
} from '../services/ragService';

interface ModeConfig {
  key: SearchMode;
  label: string;
  titleClass: string;
  activeClass: string;
  dotClass: string;
}

const MODES: ModeConfig[] = [
  {
    key: 'semantic',
    label: 'Semantic',
    titleClass: 'text-neon-cyan',
    activeClass: 'text-neon-cyan border-neon-cyan/60 bg-neon-cyan/10',
    dotClass: 'text-neon-cyan'
  },
  {
    key: 'sparse',
    label: 'Sparse (BM25)',
    titleClass: 'text-neon-pink',
    activeClass: 'text-neon-pink border-neon-pink/60 bg-neon-pink/10',
    dotClass: 'text-neon-pink'
  },
  {
    key: 'hybrid',
    label: 'Hybrid (RRF)',
    titleClass: 'text-neon-purple',
    activeClass: 'text-neon-purple border-neon-purple/60 bg-neon-purple/10',
    dotClass: 'text-neon-purple'
  },
  {
    key: 'compare',
    label: '비교 모드',
    titleClass: 'text-accent',
    activeClass: 'text-accent border-accent/60 bg-accent/10',
    dotClass: 'text-accent'
  }
];

function ScoreBar({ score, max = 1 }: { score: number; max?: number }) {
  const pct = Math.min(100, (score / max) * 100);
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1.5 bg-mystic-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-neon-purple to-neon-cyan rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-400 w-12 text-right">{score.toFixed(4)}</span>
    </div>
  );
}

function RankBadge({ rank, colorClass }: { rank: number; colorClass: string }) {
  return (
    <span className={`inline-flex w-6 h-6 rounded-full text-xs font-bold items-center justify-center border ${colorClass}`}>
      {rank}
    </span>
  );
}

function CardItem({ result, maxScore, rankColorClass }: {
  result: SearchResult;
  maxScore: number;
  rankColorClass: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const { card } = result;
  return (
    <div
      className="glass p-3 rounded-xl mb-2 cursor-pointer hover:border-accent/40 border border-mystic-700/50 transition-all"
      onClick={() => setExpanded(e => !e)}
    >
      <div className="flex items-center gap-2">
        <RankBadge rank={result.rank} colorClass={rankColorClass} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{card.nameKo}</p>
          <p className="text-xs text-gray-400 truncate">{card.nameEn}</p>
        </div>
        <span className="text-xs text-gray-500 shrink-0">
          {card.type}{card.suit ? ` · ${card.suit}` : ''}
        </span>
      </div>
      <ScoreBar score={result.score} max={maxScore} />
      {expanded && (
        <div className="mt-2 pt-2 border-t border-mystic-700/50 text-xs text-gray-400 space-y-1">
          <p>
            <span className="text-neon-cyan">키워드:</span>{' '}
            {Array.isArray(card.keywords) ? card.keywords.join(', ') : card.keywords}
          </p>
          <p>
            <span className="text-neon-cyan">정방향:</span>{' '}
            {card.uprightMeaning.slice(0, 120)}{card.uprightMeaning.length > 120 ? '…' : ''}
          </p>
          <p>
            <span className="text-neon-pink">역방향:</span>{' '}
            {card.reversedMeaning.slice(0, 120)}{card.reversedMeaning.length > 120 ? '…' : ''}
          </p>
        </div>
      )}
    </div>
  );
}

function SearchColumn({
  title,
  titleClass,
  rankColorClass,
  results,
  timing
}: {
  title: string;
  titleClass: string;
  rankColorClass: string;
  results: SearchResult[];
  timing?: number;
}) {
  const maxScore = results.length ? Math.max(...results.map(r => r.score)) : 1;
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-3">
        <h3 className={`font-bold ${titleClass}`}>{title}</h3>
        {timing !== undefined && (
          <span className="text-xs text-gray-500 ml-auto">{timing}ms</span>
        )}
      </div>
      {results.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-8">결과 없음</p>
      ) : (
        results.map(r => (
          <CardItem
            key={r.card.id}
            result={r}
            maxScore={maxScore}
            rankColorClass={rankColorClass}
          />
        ))
      )}
    </div>
  );
}

export default function RagSearch() {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<SearchMode>('compare');
  const [limit, setLimit] = useState(5);
  const [loading, setLoading] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [compareData, setCompareData] = useState<CompareResult | null>(null);
  const [singleData, setSingleData] = useState<SingleSearchResult | null>(null);
  const [status, setStatus] = useState<{ qdrant: boolean; cardCount: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ragStatus().then(r => setStatus(r.data.data)).catch(() => {});
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setCompareData(null);
    setSingleData(null);
    try {
      const res = await ragSearch(query.trim(), mode, limit);
      if (mode === 'compare') {
        setCompareData(res.data.data as CompareResult);
      } else {
        setSingleData(res.data.data as SingleSearchResult);
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err.message || '검색 오류');
    } finally {
      setLoading(false);
    }
  }

  async function handleIndex() {
    setIndexing(true);
    try {
      await ragIndex();
      const s = await ragStatus();
      setStatus(s.data.data);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err.message || '인덱싱 오류');
    } finally {
      setIndexing(false);
    }
  }

  const modeConfig = MODES.find(m => m.key === mode) || MODES[3];

  const columnConfigs = [
    { key: 'semantic' as const, title: 'Semantic', titleClass: 'text-neon-cyan', rankColorClass: 'text-neon-cyan border-neon-cyan/40' },
    { key: 'sparse'   as const, title: 'Sparse (BM25)', titleClass: 'text-neon-pink', rankColorClass: 'text-neon-pink border-neon-pink/40' },
    { key: 'hybrid'   as const, title: 'Hybrid (RRF)', titleClass: 'text-neon-purple', rankColorClass: 'text-neon-purple border-neon-purple/40' }
  ];

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-accent mb-2">타로 RAG 검색</h1>
          <p className="text-gray-400 text-sm">
            Qdrant + Voyage AI &nbsp;·&nbsp; Semantic / Sparse BM25 / Hybrid RRF
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="glass p-6 rounded-2xl mb-6">
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="예: 새로운 시작, 실패 극복, 사랑의 시작..."
              className="flex-1 bg-mystic-800 border border-mystic-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="btn-primary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {loading ? '검색 중…' : '검색'}
            </button>
          </div>

          {/* Mode tabs */}
          <div className="flex gap-2 flex-wrap items-center">
            {MODES.map(m => (
              <button
                key={m.key}
                type="button"
                onClick={() => setMode(m.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                  mode === m.key ? m.activeClass : 'text-gray-400 border-mystic-600 hover:border-gray-500'
                }`}
              >
                {m.label}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2">
              <label className="text-sm text-gray-400">결과 수</label>
              <select
                value={limit}
                onChange={e => setLimit(Number(e.target.value))}
                className="bg-mystic-800 border border-mystic-600 rounded-lg px-2 py-1 text-sm text-white"
              >
                {[3, 5, 7, 10].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-4 mb-6 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Compare Mode: 3 columns */}
        {compareData && (
          <div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-4 text-xs text-gray-500">
              <span>쿼리: <span className="text-white font-medium">"{compareData.query}"</span></span>
              <span>Semantic {compareData.timing.semantic_ms}ms</span>
              <span>Sparse {compareData.timing.sparse_ms}ms</span>
              <span>Hybrid {compareData.timing.hybrid_ms}ms</span>
            </div>
            <div className="flex gap-4">
              {columnConfigs.map(col => (
                <SearchColumn
                  key={col.key}
                  title={col.title}
                  titleClass={col.titleClass}
                  rankColorClass={col.rankColorClass}
                  results={compareData[col.key]}
                  timing={compareData.timing[`${col.key}_ms` as keyof typeof compareData.timing]}
                />
              ))}
            </div>
          </div>
        )}

        {/* Single mode results */}
        {singleData && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <h2 className={`font-bold ${modeConfig.titleClass}`}>{modeConfig.label} 결과</h2>
              <span className="text-sm text-gray-400">"{singleData.query}"</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {singleData.results.map(r => {
                const maxScore = Math.max(...singleData.results.map(x => x.score));
                return (
                  <CardItem
                    key={r.card.id}
                    result={r}
                    maxScore={maxScore}
                    rankColorClass={modeConfig.activeClass}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Developer Panel */}
        <div className="mt-10 pt-6 border-t border-mystic-700">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">개발자 패널</h3>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${status?.qdrant ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className="text-sm text-gray-400">
                Qdrant {status?.qdrant ? `연결됨 · ${status.cardCount}개 카드` : '미연결'}
              </span>
            </div>
            <button
              onClick={handleIndex}
              disabled={indexing}
              className="text-sm px-4 py-2 rounded-lg border border-mystic-600 text-gray-300 hover:border-accent hover:text-accent transition-all disabled:opacity-50"
            >
              {indexing ? '인덱싱 중…' : '카드 재인덱싱'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
