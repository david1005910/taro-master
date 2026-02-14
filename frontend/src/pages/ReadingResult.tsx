import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { readingService } from '../services/readingService';
import { sajuTarotService, ELEMENT_KOREAN, ELEMENT_COLORS, FiveElement } from '../services/sajuTarotService';
import { Reading } from '../types';
import TarotCard from '../components/tarot/TarotCard';
import Loading from '../components/common/Loading';
import Button from '../components/common/Button';

// 해석 파싱 유틸리티
interface ParsedInterpretation {
  questionAnswer: string | null;
  overall: string | null;
  conclusion: string | null;
  raw: string;
}

const parseInterpretation = (interpretation: string | null | undefined): ParsedInterpretation => {
  if (!interpretation) {
    return { questionAnswer: null, overall: null, conclusion: null, raw: '' };
  }

  // 섹션 마커로 파싱 시도
  const questionAnswerMatch = interpretation.match(/\[QUESTION_ANSWER\]\s*([\s\S]*?)(?=\[OVERALL\]|$)/);
  const overallMatch = interpretation.match(/\[OVERALL\]\s*([\s\S]*?)(?=\[CONCLUSION\]|$)/);
  const conclusionMatch = interpretation.match(/\[CONCLUSION\]\s*([\s\S]*?)$/);

  // 섹션 마커가 있는 경우
  if (questionAnswerMatch || overallMatch || conclusionMatch) {
    return {
      questionAnswer: questionAnswerMatch ? questionAnswerMatch[1].trim() : null,
      overall: overallMatch ? overallMatch[1].trim() : null,
      conclusion: conclusionMatch ? conclusionMatch[1].trim() : null,
      raw: interpretation
    };
  }

  // 섹션 마커가 없는 경우 (기존 데이터 호환)
  return {
    questionAnswer: null,
    overall: interpretation,
    conclusion: null,
    raw: interpretation
  };
};

interface GraphAnalysis {
  elementDistribution: Record<FiveElement, number>;
  missingElements: FiveElement[];
  cardRelationships: Array<{
    from: { number: number; suit: string };
    to: { number: number; suit: string };
    type: string;
    detail: string;
  }>;
  energyDynamics: { generating: number; depleting: number; balanced: boolean };
  insights: string[];
}

const REL_TYPE_LABEL: Record<string, { label: string; color: string }> = {
  SAME_ELEMENT: { label: '동일 오행', color: 'text-neon-cyan' },
  GENERATES_ENERGY: { label: '상생 ↑', color: 'text-green-400' },
  DEPLETES_ENERGY: { label: '상극 ↓', color: 'text-red-400' },
  FOLLOWS: { label: '여정 연속', color: 'text-neon-purple' }
};

const ReadingResult = () => {
  const { id } = useParams<{ id: string }>();
  const [reading, setReading] = useState<Reading | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [graphAnalysis, setGraphAnalysis] = useState<GraphAnalysis | null>(null);

  useEffect(() => {
    loadReading();
  }, [id]);

  const loadReading = async () => {
    if (!id) return;
    try {
      const data = await readingService.getReadingById(id);
      setReading(data);
      setNote(data.note || '');

      // 비동기로 카드 그래프 분석 요청
      if (data.cards.length > 0) {
        const cardParams = data.cards.map(rc => ({
          number: rc.card.number,
          suit: rc.card.type === 'MAJOR' ? 'MAJOR' : (rc.card.suit || 'MAJOR')
        }));
        sajuTarotService.readingAnalysis(cardParams)
          .then(result => setGraphAnalysis(result))
          .catch(() => {}); // 그래프 분석 실패는 무시
      }
    } catch (error) {
      console.error('Failed to load reading:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!id) return;
    setIsSaving(true);
    try {
      await readingService.updateReading(id, note);
    } catch (error) {
      console.error('Failed to save note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading size="lg" text="결과를 불러오는 중..." />
      </div>
    );
  }

  if (!reading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-gray-400">리딩을 찾을 수 없습니다.</p>
        <Link to="/history" className="text-accent hover:underline mt-4 inline-block">
          리딩 기록으로 돌아가기
        </Link>
      </div>
    );
  }

  // 해석 파싱
  const parsedInterpretation = parseInterpretation(reading.interpretation);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-bold text-accent mb-2">{reading.spreadName}</h1>
        <p className="text-gray-500 text-sm mt-2">
          {new Date(reading.createdAt).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </motion.div>

      {/* Question Display */}
      {reading.question && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass rounded-xl p-6 mb-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">❓</span>
            <h2 className="text-xl font-semibold text-neon-cyan">질문</h2>
          </div>
          <p className="text-white/90 text-lg italic">"{reading.question}"</p>
        </motion.div>
      )}

      {/* Question Answer Section (AI 모드에서 질문이 있는 경우) */}
      {reading.interpretMode === 'AI' && parsedInterpretation.questionAnswer && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-xl p-6 mb-6 border-l-4 border-neon-pink"
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">💡</span>
            <h2 className="text-xl font-semibold text-neon-pink">질문에 대한 답변</h2>
          </div>
          <p className="text-white/90 leading-relaxed text-lg">
            {parsedInterpretation.questionAnswer}
          </p>
        </motion.div>
      )}

      {/* Cards Display */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass rounded-xl p-6 mb-6"
      >
        <h2 className="text-xl font-semibold text-accent mb-4">선택한 카드</h2>
        <div className="flex flex-wrap justify-center gap-4">
          {reading.cards.map((rc, index) => (
            <div key={index} className="text-center">
              <TarotCard
                card={rc.card}
                isFlipped={true}
                isReversed={rc.isReversed}
                size="md"
              />
              <p className="text-accent font-semibold mt-2">{rc.positionName}</p>
              <p className="text-gray-500 text-xs">{rc.positionDescription}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Overall Interpretation */}
      {(parsedInterpretation.overall || (!parsedInterpretation.questionAnswer && reading.interpretation)) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-xl p-6 mb-6"
        >
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-2xl">{reading.interpretMode === 'AI' ? '🤖' : '📚'}</span>
            <h2 className="text-xl font-semibold text-accent">
              {reading.interpretMode === 'AI' ? 'AI 종합 해석' : '전통 해석'}
            </h2>
            {reading.interpretMode === 'AI' && (
              <span className="text-xs bg-neon-cyan/10 text-neon-cyan px-2 py-0.5 rounded-full border border-neon-cyan/30">
                RAG + 사주 연동
              </span>
            )}
          </div>
          <p className="text-gray-300 leading-relaxed whitespace-pre-line">
            {parsedInterpretation.overall || reading.interpretation}
          </p>
        </motion.div>
      )}

      {/* Individual Card Interpretations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass rounded-xl p-6 mb-6"
      >
        <h2 className="text-xl font-semibold text-accent mb-4">카드별 해석</h2>
        <div className="space-y-6">
          {reading.cards.map((rc, index) => (
            <div key={index} className="border-b border-neon-purple/20 last:border-b-0 pb-6 last:pb-0">
              <div className="flex items-start gap-4">
                <TarotCard
                  card={rc.card}
                  isFlipped={true}
                  isReversed={rc.isReversed}
                  size="sm"
                />
                <div className="flex-1">
                  <h3 className="text-accent font-semibold">
                    {rc.positionName}: {rc.card.nameKo}
                    {rc.isReversed && <span className="text-red-400 ml-2">(역방향)</span>}
                  </h3>
                  <p className="text-gray-500 text-sm mb-2">{rc.positionDescription}</p>
                  <p className="text-gray-300">
                    {rc.interpretation || (rc.isReversed ? rc.card.reversedMeaning : rc.card.uprightMeaning)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Graph Analysis Section */}
      {graphAnalysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-xl p-6 mb-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <span className="text-2xl">🔯</span>
            <h2 className="text-xl font-semibold text-neon-purple">카드 에너지 분석</h2>
            <span className="text-xs bg-neon-purple/20 text-neon-purple px-2 py-0.5 rounded-full border border-neon-purple/30">
              오행 그래프
            </span>
          </div>

          {/* 오행 분포 */}
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">오행 분포</h3>
            <div className="space-y-2">
              {(Object.entries(graphAnalysis.elementDistribution) as [FiveElement, number][])
                .filter(([, v]) => v > 0)
                .sort(([, a], [, b]) => b - a)
                .map(([el, count]) => {
                  const total = Object.values(graphAnalysis.elementDistribution).reduce((a, b) => a + b, 0) || 1;
                  const pct = Math.round(count / total * 100);
                  return (
                    <div key={el} className="flex items-center gap-3">
                      <span className="text-xs w-14 text-right text-gray-300">{ELEMENT_KOREAN[el]}</span>
                      <div className="flex-1 bg-white/5 rounded-full h-4 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, backgroundColor: ELEMENT_COLORS[el] }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-10">{count}개 ({pct}%)</span>
                    </div>
                  );
                })}
            </div>
            {graphAnalysis.missingElements.length > 0 && (
              <p className="text-xs text-yellow-400/80 mt-3">
                ⚠️ 부족한 오행: {graphAnalysis.missingElements.map(e => ELEMENT_KOREAN[e]).join(', ')}
              </p>
            )}
          </div>

          {/* 카드 간 관계 */}
          {graphAnalysis.cardRelationships.length > 0 && (
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">카드 간 관계</h3>
              <div className="space-y-2">
                {graphAnalysis.cardRelationships.map((rel, i) => {
                  const relInfo = REL_TYPE_LABEL[rel.type] || { label: rel.type, color: 'text-gray-400' };
                  const fromCard = reading?.cards.find(rc =>
                    rc.card.number === rel.from.number &&
                    (rc.card.type === 'MAJOR' ? 'MAJOR' : rc.card.suit) === rel.from.suit
                  );
                  const toCard = reading?.cards.find(rc =>
                    rc.card.number === rel.to.number &&
                    (rc.card.type === 'MAJOR' ? 'MAJOR' : rc.card.suit) === rel.to.suit
                  );
                  return (
                    <div key={i} className="flex items-start gap-2 text-sm bg-white/5 rounded-lg px-3 py-2">
                      <span className={`font-semibold shrink-0 ${relInfo.color}`}>[{relInfo.label}]</span>
                      <span className="text-gray-300">
                        {fromCard?.card.nameKo || `#${rel.from.number}`}
                        <span className="text-gray-500 mx-1">→</span>
                        {toCard?.card.nameKo || `#${rel.to.number}`}:
                        <span className="text-gray-400 ml-1">{rel.detail}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 에너지 다이내믹스 */}
          <div className="flex gap-4 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-green-400">▲</span>
              <span className="text-gray-400">상생: {graphAnalysis.energyDynamics.generating}개</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-red-400">▼</span>
              <span className="text-gray-400">상극: {graphAnalysis.energyDynamics.depleting}개</span>
            </div>
            <div className={`text-sm font-semibold ${graphAnalysis.energyDynamics.balanced ? 'text-neon-cyan' : graphAnalysis.energyDynamics.generating > graphAnalysis.energyDynamics.depleting ? 'text-green-400' : 'text-red-400'}`}>
              {graphAnalysis.energyDynamics.balanced ? '⚖ 균형' : graphAnalysis.energyDynamics.generating > graphAnalysis.energyDynamics.depleting ? '✨ 상생 우세' : '⚡ 상극 긴장'}
            </div>
          </div>

          {/* 그래프 인사이트 */}
          {graphAnalysis.insights.length > 0 && (
            <div className="space-y-2">
              {graphAnalysis.insights.map((insight, i) => (
                <p key={i} className="text-sm text-neon-cyan/80 flex items-start gap-2">
                  <span className="shrink-0 mt-0.5">✦</span>
                  <span>{insight}</span>
                </p>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Final Conclusion Section */}
      {parsedInterpretation.conclusion && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-xl p-6 mb-6 border-2 border-neon-cyan/50"
          style={{ boxShadow: '0 0 20px rgba(0, 240, 255, 0.2)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🔮</span>
            <h2 className="text-xl font-semibold text-neon-cyan">최종 결론 및 조언</h2>
          </div>
          <p className="text-white leading-relaxed text-lg">
            {parsedInterpretation.conclusion}
          </p>
        </motion.div>
      )}

      {/* Personal Note */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="glass rounded-xl p-6 mb-8"
      >
        <h2 className="text-xl font-semibold text-accent mb-4">개인 메모</h2>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="이 리딩에 대한 생각이나 느낌을 기록해보세요..."
          className="input-mystic min-h-[100px] resize-none mb-4"
        />
        <Button onClick={handleSaveNote} isLoading={isSaving} variant="secondary" size="sm">
          메모 저장
        </Button>
      </motion.div>

      {/* Actions */}
      <div className="flex justify-center gap-4">
        <Link to="/reading">
          <Button variant="primary">새 리딩 시작</Button>
        </Link>
        <Link to="/history">
          <Button variant="secondary">리딩 기록</Button>
        </Link>
      </div>
    </div>
  );
};

export default ReadingResult;
