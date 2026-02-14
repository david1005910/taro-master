import { useState } from 'react';
import {
  sajuTarotService,
  SajuInfo,
  HeavenlyStem,
  EarthlyBranch,
  FiveElement,
  HybridSearchResult,
  ELEMENT_KOREAN,
  ELEMENT_COLORS,
  SUIT_KOREAN
} from '../services/sajuTarotService';

// ─────────────────────────────────────────────
// 상수 데이터
// ─────────────────────────────────────────────

const STEMS: { value: HeavenlyStem; label: string; element: string }[] = [
  { value: '갑', label: '갑(甲)', element: '목' },
  { value: '을', label: '을(乙)', element: '목' },
  { value: '병', label: '병(丙)', element: '화' },
  { value: '정', label: '정(丁)', element: '화' },
  { value: '무', label: '무(戊)', element: '토' },
  { value: '기', label: '기(己)', element: '토' },
  { value: '경', label: '경(庚)', element: '금' },
  { value: '신', label: '신(辛)', element: '금' },
  { value: '임', label: '임(壬)', element: '수' },
  { value: '계', label: '계(癸)', element: '수' },
];

const BRANCHES: { value: EarthlyBranch; label: string; zodiac: string }[] = [
  { value: '자', label: '자(子)', zodiac: '쥐' },
  { value: '축', label: '축(丑)', zodiac: '소' },
  { value: '인', label: '인(寅)', zodiac: '호랑이' },
  { value: '묘', label: '묘(卯)', zodiac: '토끼' },
  { value: '진', label: '진(辰)', zodiac: '용' },
  { value: '사', label: '사(巳)', zodiac: '뱀' },
  { value: '오', label: '오(午)', zodiac: '말' },
  { value: '미', label: '미(未)', zodiac: '양' },
  { value: '신', label: '신(申)', zodiac: '원숭이' },
  { value: '유', label: '유(酉)', zodiac: '닭' },
  { value: '술', label: '술(戌)', zodiac: '개' },
  { value: '해', label: '해(亥)', zodiac: '돼지' },
];

const PILLAR_LABELS = ['년(年)', '월(月)', '일(日)', '시(時)'];
const PILLAR_KEYS: Array<keyof SajuInfo> = ['yearPillar', 'monthPillar', 'dayPillar', 'hourPillar'];

// ─────────────────────────────────────────────
// 기본 사주 값
// ─────────────────────────────────────────────
const DEFAULT_SAJU: SajuInfo = {
  yearPillar:  { stem: '갑', branch: '자' },
  monthPillar: { stem: '기', branch: '축' },
  dayPillar:   { stem: '병', branch: '오' },
  hourPillar:  { stem: '임', branch: '자' },
};

// ─────────────────────────────────────────────
// 카드 이미지 경로
// ─────────────────────────────────────────────
function getCardImagePath(number: number, suit: string): string {
  const MAJOR_NAMES: Record<number, string> = {
    0: 'fool', 1: 'magician', 2: 'high-priestess', 3: 'empress', 4: 'emperor',
    5: 'hierophant', 6: 'lovers', 7: 'chariot', 8: 'strength', 9: 'hermit',
    10: 'wheel-of-fortune', 11: 'justice', 12: 'hanged-man', 13: 'death',
    14: 'temperance', 15: 'devil', 16: 'tower', 17: 'star', 18: 'moon',
    19: 'sun', 20: 'judgement', 21: 'world'
  };
  const COURT: Record<number, string> = { 11: 'page', 12: 'knight', 13: 'queen', 14: 'king' };

  if (suit === 'MAJOR') return `/cards/major-${String(number).padStart(2, '0')}-${MAJOR_NAMES[number] || number}.jpg`;
  const suitLower = suit.toLowerCase();
  if (number === 1) return `/cards/${suitLower}-ace.jpg`;
  if (number >= 11) return `/cards/${suitLower}-${COURT[number]}.jpg`;
  return `/cards/${suitLower}-${String(number).padStart(2, '0')}.jpg`;
}

// ─────────────────────────────────────────────
// 서브 컴포넌트
// ─────────────────────────────────────────────

function PillarSelect({
  label,
  pillar,
  onChange
}: {
  label: string;
  pillar: { stem: HeavenlyStem; branch: EarthlyBranch };
  onChange: (field: 'stem' | 'branch', value: string) => void;
}) {
  return (
    <div className="bg-mystic-800 border border-mystic-600 rounded-xl p-4 flex flex-col gap-3">
      <div className="text-center text-neon-cyan font-bold text-sm">{label}</div>
      <select
        value={pillar.stem}
        onChange={e => onChange('stem', e.target.value)}
        className="bg-mystic-700 border border-mystic-500 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-neon-cyan"
      >
        {STEMS.map(s => (
          <option key={s.value} value={s.value}>{s.label} ({s.element})</option>
        ))}
      </select>
      <select
        value={pillar.branch}
        onChange={e => onChange('branch', e.target.value)}
        className="bg-mystic-700 border border-mystic-500 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-neon-cyan"
      >
        {BRANCHES.map(b => (
          <option key={b.value} value={b.value}>{b.label} {b.zodiac}</option>
        ))}
      </select>
    </div>
  );
}

function ElementBar({ element, count, total }: { element: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const color = ELEMENT_COLORS[element as FiveElement] || '#888';
  const label = ELEMENT_KOREAN[element as FiveElement] || element;
  return (
    <div className="flex items-center gap-3">
      <div className="w-16 text-right text-xs text-gray-300">{label}</div>
      <div className="flex-1 bg-mystic-700 rounded-full h-4 relative overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <div className="w-10 text-xs text-gray-400">{count}개 ({pct}%)</div>
    </div>
  );
}

function ConflictBadge({ text, type }: { text: string; type: 'combo' | 'conflict' | 'triple' | 'six' }) {
  const styles = {
    combo:    'border-yellow-400 bg-yellow-900 text-yellow-300',
    conflict: 'border-red-400 bg-red-900 text-red-300',
    triple:   'border-purple-400 bg-purple-900 text-purple-300',
    six:      'border-cyan-400 bg-cyan-900 text-cyan-300',
  };
  const labels = {
    combo: '천간합', conflict: '지지충', triple: '삼합', six: '육합'
  };
  return (
    <div className={`border rounded-lg px-3 py-2 text-xs ${styles[type]}`}>
      <div className="font-bold text-xs opacity-70 mb-0.5">{labels[type]}</div>
      <div className="font-medium">{text}</div>
    </div>
  );
}

function GraphCard({ card, index }: {
  card: { number: number; suit: string; reason: string; strength: number; path?: string };
  index: number;
}) {
  const imgSrc = getCardImagePath(card.number, card.suit);
  const suitLabel = SUIT_KOREAN[card.suit] || card.suit;
  const pct = Math.round(card.strength * 100);

  return (
    <div className="bg-mystic-800 border border-mystic-600 rounded-xl p-3 flex gap-3 hover:border-neon-purple transition-colors">
      <div className="relative flex-shrink-0">
        <div className="w-12 h-20 rounded-lg overflow-hidden border border-mystic-500">
          <img src={imgSrc} alt={`${suitLabel} ${card.number}`} className="w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).src = '/cards/card-back.jpg'; }} />
        </div>
        <div className="absolute -top-1 -left-1 w-5 h-5 bg-neon-purple rounded-full flex items-center justify-center text-white text-xs font-bold">
          {index + 1}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-white text-xs font-semibold truncate">{suitLabel} {card.number}</div>
        <div className="mt-1">
          <div className="flex items-center gap-1">
            <div className="flex-1 bg-mystic-700 rounded-full h-1.5">
              <div className="bg-neon-purple h-1.5 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
            <span className="text-neon-purple text-xs">{pct}%</span>
          </div>
        </div>
        <div className="text-gray-400 text-xs mt-1 line-clamp-2">{card.reason}</div>
        {card.path && (
          <div className="text-mystic-400 text-xs mt-0.5 italic truncate">{card.path}</div>
        )}
      </div>
    </div>
  );
}

function RagCard({ card, index }: {
  card: HybridSearchResult['ragCards'][0];
  index: number;
}) {
  const suit = card.card.suit || card.card.type;
  const imgSrc = getCardImagePath(card.card.number, suit);
  const pct = Math.round(card.score * 100);

  return (
    <div className="bg-mystic-800 border border-mystic-600 rounded-xl p-3 flex gap-3 hover:border-neon-cyan transition-colors">
      <div className="relative flex-shrink-0">
        <div className="w-12 h-20 rounded-lg overflow-hidden border border-mystic-500">
          <img src={imgSrc} alt={card.card.nameKo} className="w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).src = '/cards/card-back.jpg'; }} />
        </div>
        <div className="absolute -top-1 -left-1 w-5 h-5 bg-neon-cyan rounded-full flex items-center justify-center text-black text-xs font-bold">
          {index + 1}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-white text-xs font-semibold">{card.card.nameKo}</div>
        <div className="text-gray-400 text-xs">{card.card.nameEn}</div>
        <div className="mt-1">
          <div className="flex items-center gap-1">
            <div className="flex-1 bg-mystic-700 rounded-full h-1.5">
              <div className="bg-neon-cyan h-1.5 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
            <span className="text-neon-cyan text-xs">{pct}%</span>
          </div>
        </div>
        <div className="text-gray-400 text-xs mt-1 line-clamp-2">
          {Array.isArray(card.card.keywords) ? card.card.keywords.slice(0, 3).join(' · ') : ''}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 메인 페이지
// ─────────────────────────────────────────────

export default function SajuGraphInsight() {
  const [saju, setSaju] = useState<SajuInfo>(DEFAULT_SAJU);
  const [result, setResult] = useState<HybridSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updatePillar = (pillarKey: keyof SajuInfo, field: 'stem' | 'branch', value: string) => {
    setSaju(prev => ({
      ...prev,
      [pillarKey]: { ...prev[pillarKey], [field]: value }
    }));
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await sajuTarotService.hybridSearch(saju, undefined, 5);
      setResult(data);
    } catch (e: any) {
      setError(e.response?.data?.error?.message || '분석 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const elementTotal = result
    ? Object.values(result.saju.elementBalance).reduce((a, b) => a + b, 0)
    : 8;

  const cha = result?.saju.conflictsAndHarmonies;
  const hasCha = cha && (
    cha.stemCombinations.length + cha.branchConflicts.length +
    cha.tripleHarmonies.length + cha.sixHarmonies.length > 0
  );

  return (
    <div className="min-h-screen bg-mystic-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            사주 <span className="text-neon-purple">그래프</span> 인사이트
          </h1>
          <p className="text-gray-400 text-sm">
            GraphDB 관계형 분석 + RAG 시맨틱 검색으로 사주와 타로를 연결합니다
          </p>
        </div>

        {/* 사주 입력 */}
        <div className="card mb-6">
          <h2 className="text-lg font-bold text-neon-cyan mb-4">사주 입력</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {PILLAR_KEYS.map((key, idx) => (
              <PillarSelect
                key={key}
                label={PILLAR_LABELS[idx]}
                pillar={saju[key]}
                onChange={(field, value) => updatePillar(key, field, value)}
              />
            ))}
          </div>
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="btn-primary w-full py-3 text-base font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                그래프 분석 중...
              </span>
            ) : '분석 시작'}
          </button>
          {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
        </div>

        {/* 결과 섹션 */}
        {result && (
          <>
            {/* 상태 배지 */}
            <div className="flex gap-2 mb-4 flex-wrap">
              <span className={`text-xs px-3 py-1 rounded-full border ${result.neo4jAvailable ? 'border-green-500 text-green-400 bg-green-900' : 'border-gray-600 text-gray-500 bg-mystic-800'}`}>
                Neo4j {result.neo4jAvailable ? '연결됨' : '미연결 (로컬)'}
              </span>
              <span className={`text-xs px-3 py-1 rounded-full border ${result.ragAvailable ? 'border-neon-cyan text-neon-cyan bg-mystic-800' : 'border-gray-600 text-gray-500 bg-mystic-800'}`}>
                RAG {result.ragAvailable ? '활성' : '비활성'}
              </span>
              <span className="text-xs px-3 py-1 rounded-full border border-mystic-500 text-gray-400 bg-mystic-800 flex-1 min-w-0 truncate">
                쿼리: {result.semanticQuery}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

              {/* 왼쪽: 오행 균형 + 충합 */}
              <div className="flex flex-col gap-5">

                {/* 오행 균형 */}
                <div className="card">
                  <h3 className="text-neon-cyan font-bold mb-4 text-sm">오행 균형</h3>
                  <div className="space-y-3">
                    {(['WOOD', 'FIRE', 'EARTH', 'METAL', 'WATER'] as FiveElement[]).map(el => (
                      <ElementBar
                        key={el}
                        element={el}
                        count={result.saju.elementBalance[el] || 0}
                        total={elementTotal}
                      />
                    ))}
                  </div>
                  <div className="mt-4 pt-3 border-t border-mystic-600">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">강한 오행</span>
                      <span style={{ color: ELEMENT_COLORS[result.saju.dominantElement] }}>
                        {ELEMENT_KOREAN[result.saju.dominantElement]}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-gray-400">약한 오행</span>
                      <span style={{ color: ELEMENT_COLORS[result.saju.weakElement] }}>
                        {ELEMENT_KOREAN[result.saju.weakElement]}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 충합 감지 */}
                <div className="card">
                  <h3 className="text-neon-pink font-bold mb-4 text-sm">충합 감지</h3>
                  {hasCha ? (
                    <div className="flex flex-col gap-2">
                      {cha!.stemCombinations.map(c => (
                        <ConflictBadge key={c.name} text={c.name} type="combo" />
                      ))}
                      {cha!.branchConflicts.map(c => (
                        <ConflictBadge key={c.name} text={c.name} type="conflict" />
                      ))}
                      {cha!.tripleHarmonies.map(h => (
                        <ConflictBadge key={h.name} text={h.name} type="triple" />
                      ))}
                      {cha!.sixHarmonies.map(h => (
                        <ConflictBadge key={h.name} text={h.name} type="six" />
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm text-center py-4">충합 없음</p>
                  )}
                </div>

                {/* 인사이트 */}
                <div className="card">
                  <h3 className="text-yellow-400 font-bold mb-3 text-sm">인사이트</h3>
                  <ul className="space-y-2">
                    {result.saju.insights.map((insight, i) => (
                      <li key={i} className="text-gray-300 text-xs flex gap-2">
                        <span className="text-neon-purple flex-shrink-0">▸</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>

              {/* 중앙: 그래프 카드 추천 */}
              <div className="card">
                <h3 className="text-neon-purple font-bold mb-4 text-sm flex items-center gap-2">
                  <span className="w-2 h-2 bg-neon-purple rounded-full"></span>
                  그래프 추천 카드
                  <span className="text-gray-500 text-xs font-normal ml-auto">
                    {result.neo4jAvailable ? 'Neo4j 멀티홉' : '로컬 데이터'}
                  </span>
                </h3>
                {result.graphCards.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {result.graphCards.map((card, i) => (
                      <GraphCard key={`${card.number}-${card.suit}-${i}`} card={card} index={i} />
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm text-center py-8">카드 추천 결과 없음</p>
                )}
                <div className="mt-4 pt-3 border-t border-mystic-600">
                  <p className="text-gray-500 text-xs">{result.saju.analysis}</p>
                </div>
              </div>

              {/* 오른쪽: RAG 카드 */}
              <div className="card">
                <h3 className="text-neon-cyan font-bold mb-4 text-sm flex items-center gap-2">
                  <span className="w-2 h-2 bg-neon-cyan rounded-full"></span>
                  RAG 시맨틱 카드
                  <span className="text-gray-500 text-xs font-normal ml-auto">Qdrant + Gemini</span>
                </h3>
                {result.ragAvailable && result.ragCards.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {result.ragCards.map((card, i) => (
                      <RagCard key={`${card.card.nameKo}-${i}`} card={card} index={i} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <p className="text-gray-500 text-sm">
                      {result.ragAvailable ? '검색 결과 없음' : 'RAG 서비스 비활성'}
                    </p>
                    {!result.ragAvailable && (
                      <p className="text-gray-600 text-xs text-center">
                        Qdrant 벡터DB가 실행되지 않았습니다
                      </p>
                    )}
                  </div>
                )}
                {result.ragAvailable && (
                  <div className="mt-4 pt-3 border-t border-mystic-600">
                    <p className="text-gray-500 text-xs">
                      사주 분석 → 시맨틱 쿼리 변환 → 벡터 검색 순서로 실행됩니다.
                    </p>
                  </div>
                )}
              </div>

            </div>
          </>
        )}

        {/* 초기 안내 */}
        {!result && !loading && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🕸️</div>
            <p className="text-gray-400 mb-2">사주 사주팔자를 입력하고 분석을 시작하세요</p>
            <p className="text-gray-600 text-sm">
              GraphDB의 관계형 쿼리와 Qdrant RAG 검색이 결합하여<br />
              사주 에너지와 공명하는 타로 카드를 추천합니다
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
