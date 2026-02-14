import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { readingService } from '../services/readingService';
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

const ReadingResult = () => {
  const { id } = useParams<{ id: string }>();
  const [reading, setReading] = useState<Reading | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadReading();
  }, [id]);

  const loadReading = async () => {
    if (!id) return;
    try {
      const data = await readingService.getReadingById(id);
      setReading(data);
      setNote(data.note || '');
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
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">{reading.interpretMode === 'AI' ? '🤖' : '📚'}</span>
            <h2 className="text-xl font-semibold text-accent">
              {reading.interpretMode === 'AI' ? 'AI 종합 해석' : '전통 해석'}
            </h2>
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
