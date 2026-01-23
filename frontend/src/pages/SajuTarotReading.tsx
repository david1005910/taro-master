import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  sajuTarotService,
  SajuInfo,
  RecommendedCardsResult,
  ElementAnalysisResult,
  ELEMENT_KOREAN,
  ELEMENT_COLORS,
  SUIT_KOREAN,
  FiveElement,
  HeavenlyStem,
  EarthlyBranch
} from '../services/sajuTarotService';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';

// 천간 목록
const HEAVENLY_STEMS: HeavenlyStem[] = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];

// 지지 목록
const EARTHLY_BRANCHES: EarthlyBranch[] = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

// 지지 시간 설명
const BRANCH_TIME: Record<EarthlyBranch, string> = {
  '자': '23:00-01:00',
  '축': '01:00-03:00',
  '인': '03:00-05:00',
  '묘': '05:00-07:00',
  '진': '07:00-09:00',
  '사': '09:00-11:00',
  '오': '11:00-13:00',
  '미': '13:00-15:00',
  '신': '15:00-17:00',
  '유': '17:00-19:00',
  '술': '19:00-21:00',
  '해': '21:00-23:00'
};

const SajuTarotReading = () => {
  const [step, setStep] = useState<'input' | 'result'>('input');
  const [loading, setLoading] = useState(false);
  const [neo4jStatus, setNeo4jStatus] = useState<{ connected: boolean; message: string } | null>(null);

  // 사주 입력 상태
  const [saju, setSaju] = useState<SajuInfo>({
    yearPillar: { stem: '갑', branch: '자' },
    monthPillar: { stem: '갑', branch: '자' },
    dayPillar: { stem: '갑', branch: '자' },
    hourPillar: { stem: '갑', branch: '자' }
  });

  // 결과 상태
  const [recommendedCards, setRecommendedCards] = useState<RecommendedCardsResult | null>(null);
  const [elementAnalysis, setElementAnalysis] = useState<ElementAnalysisResult | null>(null);

  useEffect(() => {
    checkNeo4jStatus();
  }, []);

  const checkNeo4jStatus = async () => {
    try {
      const status = await sajuTarotService.getStatus();
      setNeo4jStatus({ connected: status.neo4jConnected, message: status.message });
    } catch {
      setNeo4jStatus({ connected: false, message: '서버에 연결할 수 없습니다.' });
    }
  };

  const updatePillar = (pillar: keyof SajuInfo, field: 'stem' | 'branch', value: string) => {
    setSaju(prev => ({
      ...prev,
      [pillar]: {
        ...prev[pillar],
        [field]: value
      }
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const [cards, elements] = await Promise.all([
        sajuTarotService.getRecommendedCards(saju),
        sajuTarotService.analyzeElements(saju)
      ]);

      setRecommendedCards(cards);
      setElementAnalysis(elements);
      setStep('result');
    } catch (error) {
      console.error('Failed to get Saju-Tarot reading:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderPillarInput = (label: string, pillar: keyof SajuInfo) => (
    <div className="glass rounded-xl p-4">
      <h3 className="text-accent font-semibold mb-3">{label}</h3>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-gray-400 text-sm block mb-1">천간</label>
          <select
            value={saju[pillar].stem}
            onChange={(e) => updatePillar(pillar, 'stem', e.target.value)}
            className="input-mystic w-full"
          >
            {HEAVENLY_STEMS.map(stem => (
              <option key={stem} value={stem}>{stem}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-gray-400 text-sm block mb-1">지지</label>
          <select
            value={saju[pillar].branch}
            onChange={(e) => updatePillar(pillar, 'branch', e.target.value)}
            className="input-mystic w-full"
          >
            {EARTHLY_BRANCHES.map(branch => (
              <option key={branch} value={branch}>
                {branch} ({pillar === 'hourPillar' ? BRANCH_TIME[branch] : ''})
              </option>
            ))}
          </select>
        </div>
      </div>
      <p className="text-center text-white/80 mt-2 text-lg">
        {saju[pillar].stem}{saju[pillar].branch}
      </p>
    </div>
  );

  const renderElementChart = () => {
    if (!elementAnalysis) return null;

    return (
      <div className="glass rounded-xl p-6">
        <h2 className="text-xl font-semibold text-accent mb-4">오행 분석</h2>
        <div className="space-y-3">
          {elementAnalysis.elements.map((el) => (
            <div key={el.element} className="flex items-center gap-3">
              <span
                className="w-16 text-center py-1 rounded font-semibold"
                style={{
                  backgroundColor: ELEMENT_COLORS[el.element as FiveElement] + '30',
                  color: ELEMENT_COLORS[el.element as FiveElement]
                }}
              >
                {ELEMENT_KOREAN[el.element as FiveElement]}
              </span>
              <div className="flex-1 h-6 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${el.percentage}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: ELEMENT_COLORS[el.element as FiveElement] }}
                />
              </div>
              <span className="w-12 text-right text-white/80">{el.percentage}%</span>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-white/5 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400">강한 오행</span>
            <span
              className="font-semibold"
              style={{ color: ELEMENT_COLORS[elementAnalysis.dominant as FiveElement] }}
            >
              {ELEMENT_KOREAN[elementAnalysis.dominant as FiveElement]}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">약한 오행</span>
            <span
              className="font-semibold"
              style={{ color: ELEMENT_COLORS[elementAnalysis.weak as FiveElement] }}
            >
              {ELEMENT_KOREAN[elementAnalysis.weak as FiveElement]}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderRecommendedCards = () => {
    if (!recommendedCards) return null;

    return (
      <div className="glass rounded-xl p-6">
        <h2 className="text-xl font-semibold text-accent mb-4">추천 타로 카드</h2>

        <p className="text-white/80 mb-6 leading-relaxed">
          {recommendedCards.analysis}
        </p>

        <div className="space-y-4">
          {recommendedCards.cards.map((card, index) => (
            <motion.div
              key={`${card.suit}-${card.number}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-neon-purple/20"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-pink to-neon-purple flex items-center justify-center">
                <span className="text-2xl">
                  {card.suit === 'MAJOR' ? '★' :
                    card.suit === 'WANDS' ? '🔥' :
                    card.suit === 'CUPS' ? '💧' :
                    card.suit === 'SWORDS' ? '⚔️' : '💰'}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-neon-cyan">
                  {SUIT_KOREAN[card.suit]} {card.number === 0 ? '0 (바보)' : card.number}번
                </h3>
                <p className="text-gray-400 text-sm">{card.reason}</p>
              </div>
              <div className="text-right">
                <div className="text-neon-pink font-semibold">
                  {Math.round(card.strength * 100)}%
                </div>
                <div className="text-gray-500 text-xs">공명도</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  const renderOhangRelationship = () => {
    return (
      <div className="glass rounded-xl p-6">
        <h2 className="text-xl font-semibold text-accent mb-4">오행 상생상극</h2>

        <div className="relative w-64 h-64 mx-auto">
          {/* 오행 원형 배치 */}
          {(['FIRE', 'EARTH', 'METAL', 'WATER', 'WOOD'] as FiveElement[]).map((el, index) => {
            const angle = (index * 72 - 90) * (Math.PI / 180);
            const x = 100 + 80 * Math.cos(angle);
            const y = 100 + 80 * Math.sin(angle);

            return (
              <motion.div
                key={el}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="absolute w-16 h-16 rounded-full flex items-center justify-center text-white font-bold"
                style={{
                  left: x - 32,
                  top: y - 32,
                  backgroundColor: ELEMENT_COLORS[el],
                  boxShadow: `0 0 20px ${ELEMENT_COLORS[el]}60`
                }}
              >
                {ELEMENT_KOREAN[el].charAt(0)}
              </motion.div>
            );
          })}

          {/* 중앙 설명 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-neon-cyan text-sm">상생 →</p>
              <p className="text-neon-pink text-sm">상극 ⊣</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div className="p-3 bg-white/5 rounded-lg">
            <h4 className="text-neon-cyan font-semibold mb-2">상생 (생성)</h4>
            <ul className="space-y-1 text-gray-400">
              <li>목 → 화 (목생화)</li>
              <li>화 → 토 (화생토)</li>
              <li>토 → 금 (토생금)</li>
              <li>금 → 수 (금생수)</li>
              <li>수 → 목 (수생목)</li>
            </ul>
          </div>
          <div className="p-3 bg-white/5 rounded-lg">
            <h4 className="text-neon-pink font-semibold mb-2">상극 (억제)</h4>
            <ul className="space-y-1 text-gray-400">
              <li>목 ⊣ 토 (목극토)</li>
              <li>토 ⊣ 수 (토극수)</li>
              <li>수 ⊣ 화 (수극화)</li>
              <li>화 ⊣ 금 (화극금)</li>
              <li>금 ⊣ 목 (금극목)</li>
            </ul>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading size="lg" text="사주-타로 관계를 분석하는 중..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-bold bg-gradient-to-r from-neon-pink via-neon-purple to-neon-cyan bg-clip-text text-transparent">
          사주 × 타로 융합 리딩
        </h1>
        <p className="text-gray-400 mt-2">
          동양의 사주팔자와 서양의 타로를 연결하여 깊은 통찰을 얻으세요
        </p>

        {neo4jStatus && (
          <div className={`inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full text-sm ${
            neo4jStatus.connected ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              neo4jStatus.connected ? 'bg-green-400' : 'bg-yellow-400'
            }`} />
            {neo4jStatus.message}
          </div>
        )}
      </motion.div>

      {step === 'input' ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-2xl mx-auto space-y-6"
        >
          {/* 사주 입력 폼 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderPillarInput('년주 (年柱)', 'yearPillar')}
            {renderPillarInput('월주 (月柱)', 'monthPillar')}
            {renderPillarInput('일주 (日柱)', 'dayPillar')}
            {renderPillarInput('시주 (時柱)', 'hourPillar')}
          </div>

          {/* 오행 관계도 */}
          {renderOhangRelationship()}

          {/* 분석 버튼 */}
          <div className="text-center">
            <Button
              onClick={handleSubmit}
              variant="primary"
              size="lg"
              className="bg-gradient-to-r from-neon-pink to-neon-purple hover:shadow-neon-pink"
            >
              사주-타로 관계 분석
            </Button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-4xl mx-auto space-y-6"
        >
          {/* 사주 요약 */}
          <div className="glass rounded-xl p-6">
            <h2 className="text-xl font-semibold text-accent mb-4">입력된 사주</h2>
            <div className="flex justify-center gap-4 text-center">
              {(['yearPillar', 'monthPillar', 'dayPillar', 'hourPillar'] as const).map((pillar, index) => (
                <div key={pillar} className="px-4">
                  <div className="text-gray-400 text-sm mb-1">
                    {['년주', '월주', '일주', '시주'][index]}
                  </div>
                  <div className="text-2xl text-neon-cyan">
                    {saju[pillar].stem}{saju[pillar].branch}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 오행 분석 */}
          {renderElementChart()}

          {/* 추천 타로 카드 */}
          {renderRecommendedCards()}

          {/* 액션 버튼 */}
          <div className="flex justify-center gap-4">
            <Button
              onClick={() => setStep('input')}
              variant="secondary"
            >
              다시 분석
            </Button>
            <Link to="/reading">
              <Button variant="primary">
                타로 리딩 시작
              </Button>
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default SajuTarotReading;
