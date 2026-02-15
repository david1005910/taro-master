import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { graphService, CardRelationships, UserPatterns, GraphStatus } from '../services/graphService';
import { cardService } from '../services/cardService';

type Tab = 'patterns' | 'explore';

const ELEMENT_COLORS: Record<string, string> = {
  FIRE:    'text-neon-pink',
  WATER:   'text-neon-cyan',
  AIR:     'text-neon-purple',
  EARTH:   'text-amber-400',
  SPIRIT:  'text-white'
};

const ELEMENT_BG: Record<string, string> = {
  FIRE:    'bg-neon-pink/20 border-neon-pink/30',
  WATER:   'bg-neon-cyan/20 border-neon-cyan/30',
  AIR:     'bg-neon-purple/20 border-neon-purple/30',
  EARTH:   'bg-amber-400/20 border-amber-400/30',
  SPIRIT:  'bg-white/10 border-white/20'
};

const ELEMENT_LABEL: Record<string, string> = {
  FIRE:    '🔥 불 (의지/열정)',
  WATER:   '💧 물 (직관/감정)',
  AIR:     '💨 공기 (지성/소통)',
  EARTH:   '🌍 흙 (물질/안정)',
  SPIRIT:  '✨ 정신 (초월/영혼)'
};

const GraphExplorer = () => {
  const [tab, setTab] = useState<Tab>('patterns');
  const [status, setStatus] = useState<GraphStatus | null>(null);
  const [patterns, setPatterns] = useState<UserPatterns | null>(null);
  const [patternsLoading, setPatternsLoading] = useState(false);

  // Card Explorer
  const [cards, setCards] = useState<Array<{ id: number; nameKo: string; nameEn: string }>>([]);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [relationships, setRelationships] = useState<CardRelationships | null>(null);
  const [relLoading, setRelLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadStatus();
    loadCards();
  }, []);

  useEffect(() => {
    if (tab === 'patterns') loadPatterns();
  }, [tab]);

  useEffect(() => {
    if (selectedCardId !== null) loadRelationships(selectedCardId);
  }, [selectedCardId]);

  const loadStatus = async () => {
    try {
      const s = await graphService.getStatus();
      setStatus(s);
    } catch {
      setStatus({ connected: false, nodeCount: 0, relationshipCount: 0 });
    }
  };

  const loadCards = async () => {
    try {
      const data = await cardService.getCards({ limit: 78 });
      setCards(data.cards.map(c => ({ id: c.id, nameKo: c.nameKo, nameEn: c.nameEn })));
    } catch {
      // 카드 목록 로드 실패 시 무시
    }
  };

  const loadPatterns = async () => {
    if (patterns) return;
    setPatternsLoading(true);
    try {
      const p = await graphService.getUserPatterns();
      setPatterns(p);
    } catch {
      setPatterns(null);
    } finally {
      setPatternsLoading(false);
    }
  };

  const loadRelationships = async (cardId: number) => {
    setRelLoading(true);
    setRelationships(null);
    try {
      const rel = await graphService.getCardRelationships(cardId);
      setRelationships(rel);
    } catch {
      setRelationships(null);
    } finally {
      setRelLoading(false);
    }
  };

  const filteredCards = cards.filter(c =>
    c.nameKo.includes(searchTerm) || c.nameEn.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalElem = patterns
    ? Object.values(patterns.elementDistribution).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-bold text-accent mb-2">그래프 탐험</h1>
        <p className="text-gray-400 text-sm">Neo4j 그래프 DB로 타로 카드 간의 숨겨진 관계를 탐험하세요</p>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 mt-3 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs">
          <span className={`w-2 h-2 rounded-full ${status?.connected ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-gray-400">
            {status?.connected
              ? `그래프 연결됨 · ${status.nodeCount}개 카드 노드 · ${status.relationshipCount}개 관계`
              : 'Neo4j 미연결 (일부 기능 제한)'}
          </span>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-lg mb-6">
        <button
          onClick={() => setTab('patterns')}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
            tab === 'patterns'
              ? 'bg-neon-purple/30 text-white border border-neon-purple/50'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          내 리딩 패턴
        </button>
        <button
          onClick={() => setTab('explore')}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
            tab === 'explore'
              ? 'bg-neon-cyan/30 text-white border border-neon-cyan/50'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          카드 관계 탐험
        </button>
      </div>

      {/* Tab: 내 리딩 패턴 */}
      {tab === 'patterns' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {patternsLoading && (
            <div className="text-center py-12 text-gray-400">
              <div className="animate-spin w-8 h-8 border-2 border-neon-purple border-t-transparent rounded-full mx-auto mb-3" />
              패턴 분석 중...
            </div>
          )}

          {!patternsLoading && !patterns && (
            <div className="glass rounded-xl p-8 text-center">
              <span className="text-4xl mb-3 block">🔮</span>
              <p className="text-gray-400">
                {status?.connected
                  ? '리딩 기록이 없거나 패턴을 분석할 수 없습니다.'
                  : 'Neo4j 그래프 서비스가 연결되지 않아 패턴을 분석할 수 없습니다.'}
              </p>
              <p className="text-gray-500 text-sm mt-1">AI 모드로 리딩을 진행하면 패턴이 기록됩니다.</p>
            </div>
          )}

          {patterns && (
            <>
              {/* Total Readings */}
              <div className="glass rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-neon-cyan">{patterns.totalReadings}</p>
                <p className="text-gray-400 text-sm">총 리딩 횟수</p>
              </div>

              {/* Top Cards */}
              {patterns.topCards.length > 0 && (
                <div className="glass rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-accent mb-4">자주 등장한 카드 Top 5</h3>
                  <div className="space-y-3">
                    {patterns.topCards.map((card, i) => (
                      <div key={card.cardId} className="flex items-center gap-3">
                        <span className="text-neon-purple font-bold w-5 text-right">{i + 1}</span>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-white text-sm">{card.nameKo}</span>
                            <span className="text-gray-400 text-xs">{card.count}회</span>
                          </div>
                          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-neon-purple to-neon-pink rounded-full"
                              style={{ width: `${Math.min(100, (card.count / (patterns.topCards[0]?.count || 1)) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Element Distribution */}
              {Object.keys(patterns.elementDistribution).length > 0 && (
                <div className="glass rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-accent mb-4">원소 분포</h3>
                  <div className="space-y-3">
                    {Object.entries(patterns.elementDistribution)
                      .sort((a, b) => b[1] - a[1])
                      .map(([elem, cnt]) => (
                        <div key={elem}>
                          <div className="flex justify-between items-center mb-1">
                            <span className={`text-sm font-medium ${ELEMENT_COLORS[elem] ?? 'text-gray-300'}`}>
                              {ELEMENT_LABEL[elem] ?? elem}
                            </span>
                            <span className="text-gray-400 text-xs">{cnt}장</span>
                          </div>
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                elem === 'FIRE'   ? 'bg-neon-pink' :
                                elem === 'WATER'  ? 'bg-neon-cyan' :
                                elem === 'AIR'    ? 'bg-neon-purple' :
                                elem === 'EARTH'  ? 'bg-amber-400' :
                                'bg-white'
                              }`}
                              style={{ width: `${totalElem > 0 ? (cnt / totalElem) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      )}

      {/* Tab: 카드 관계 탐험 */}
      {tab === 'explore' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {/* Card Search */}
          <div className="glass rounded-xl p-4">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="카드 이름으로 검색..."
              className="input-mystic w-full text-sm mb-3"
            />
            <div className="max-h-48 overflow-y-auto space-y-1">
              {filteredCards.slice(0, 30).map(card => (
                <button
                  key={card.id}
                  onClick={() => setSelectedCardId(card.id)}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all ${
                    selectedCardId === card.id
                      ? 'bg-neon-cyan/20 border border-neon-cyan/40 text-white'
                      : 'text-gray-300 hover:bg-white/5'
                  }`}
                >
                  {card.nameKo}
                  <span className="text-gray-500 ml-2 text-xs">{card.nameEn}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Relationship Panel */}
          {selectedCardId !== null && (
            <div className="space-y-4">
              {relLoading && (
                <div className="text-center py-8 text-gray-400">
                  <div className="animate-spin w-6 h-6 border-2 border-neon-cyan border-t-transparent rounded-full mx-auto mb-2" />
                  관계 탐색 중...
                </div>
              )}

              {!relLoading && !relationships && (
                <div className="glass rounded-xl p-6 text-center text-gray-400">
                  관계 정보를 불러올 수 없습니다.
                </div>
              )}

              {relationships && (
                <>
                  {/* Card Info */}
                  <div className={`glass rounded-xl p-4 border ${ELEMENT_BG[relationships.element] ?? 'border-white/10'}`}>
                    <h3 className="text-lg font-semibold text-white">{relationships.nameKo}</h3>
                    <p className="text-gray-400 text-sm">{relationships.nameEn}</p>
                    <span className={`mt-2 inline-block text-sm font-medium ${ELEMENT_COLORS[relationships.element] ?? 'text-gray-300'}`}>
                      {ELEMENT_LABEL[relationships.element] ?? relationships.element}
                    </span>
                  </div>

                  {/* Shared Element */}
                  {relationships.sharedElement.length > 0 && (
                    <div className="glass rounded-xl p-4">
                      <h4 className="text-neon-cyan font-semibold mb-3">
                        같은 원소 카드 ({relationships.sharedElement.length}장)
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {relationships.sharedElement.slice(0, 12).map(c => (
                          <button
                            key={c.cardId}
                            onClick={() => setSelectedCardId(c.cardId)}
                            className="px-2 py-1 bg-neon-cyan/10 border border-neon-cyan/20 rounded-lg text-xs text-neon-cyan hover:bg-neon-cyan/20 transition-colors"
                          >
                            {c.nameKo}
                          </button>
                        ))}
                        {relationships.sharedElement.length > 12 && (
                          <span className="text-gray-500 text-xs px-2 py-1">+{relationships.sharedElement.length - 12}개</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Numerological */}
                  {relationships.numerological.length > 0 && (
                    <div className="glass rounded-xl p-4">
                      <h4 className="text-neon-purple font-semibold mb-3">
                        수비학 연결 (숫자 {relationships.numerological[0]?.number})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {relationships.numerological.map(c => (
                          <button
                            key={c.cardId}
                            onClick={() => setSelectedCardId(c.cardId)}
                            className="px-2 py-1 bg-neon-purple/10 border border-neon-purple/20 rounded-lg text-xs text-neon-purple hover:bg-neon-purple/20 transition-colors"
                          >
                            {c.nameKo}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Archetypal Pairs */}
                  {relationships.archetypal.length > 0 && (
                    <div className="glass rounded-xl p-4">
                      <h4 className="text-neon-pink font-semibold mb-3">원형 쌍</h4>
                      <div className="space-y-2">
                        {relationships.archetypal.map(c => (
                          <button
                            key={c.cardId}
                            onClick={() => setSelectedCardId(c.cardId)}
                            className="flex items-center justify-between w-full px-3 py-2 bg-neon-pink/10 border border-neon-pink/20 rounded-lg hover:bg-neon-pink/20 transition-colors"
                          >
                            <span className="text-sm text-white">{c.nameKo}</span>
                            <span className="text-xs text-neon-pink">{c.theme}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {relationships.sharedElement.length === 0 &&
                   relationships.numerological.length === 0 &&
                   relationships.archetypal.length === 0 && (
                    <div className="glass rounded-xl p-4 text-center text-gray-400 text-sm">
                      이 카드와 특별한 그래프 관계가 없습니다.
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default GraphExplorer;
