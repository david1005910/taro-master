import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { readingService } from '../services/readingService';
import { Reading } from '../types';
import TarotCard from '../components/tarot/TarotCard';
import Loading from '../components/common/Loading';
import Button from '../components/common/Button';

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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-accent mb-2">{reading.spreadName}</h1>
        {reading.question && (
          <p className="text-gray-400">"{reading.question}"</p>
        )}
        <p className="text-gray-500 text-sm mt-2">
          {new Date(reading.createdAt).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>

      {/* Cards Display */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-6 mb-8"
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

      {/* Interpretation */}
      {reading.interpretation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-xl p-6 mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">{reading.interpretMode === 'AI' ? '🤖' : '📚'}</span>
            <h2 className="text-xl font-semibold text-accent">
              {reading.interpretMode === 'AI' ? 'AI 해석' : '전통 해석'}
            </h2>
          </div>
          <p className="text-gray-300 leading-relaxed whitespace-pre-line">
            {reading.interpretation}
          </p>
        </motion.div>
      )}

      {/* Individual Card Interpretations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-xl p-6 mb-8"
      >
        <h2 className="text-xl font-semibold text-accent mb-4">카드별 해석</h2>
        <div className="space-y-6">
          {reading.cards.map((rc, index) => (
            <div key={index} className="border-b border-mystic-700 last:border-b-0 pb-6 last:pb-0">
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
                    {rc.isReversed && <span className="text-gray-500"> (역방향)</span>}
                  </h3>
                  <p className="text-gray-400 text-sm mb-2">{rc.positionDescription}</p>
                  <p className="text-gray-300">
                    {rc.interpretation || (rc.isReversed ? rc.card.reversedMeaning : rc.card.uprightMeaning)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Personal Note */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
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
