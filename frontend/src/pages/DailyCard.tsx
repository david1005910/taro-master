import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { readingService } from '../services/readingService';
import { DailyCardResponse } from '../types';
import TarotCard from '../components/tarot/TarotCard';
import Loading from '../components/common/Loading';
import Button from '../components/common/Button';

const DailyCard = () => {
  const [dailyCard, setDailyCard] = useState<DailyCardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    loadDailyCard();
  }, []);

  const loadDailyCard = async () => {
    try {
      const data = await readingService.getDailyCard();
      setDailyCard(data);
      if (!data.isNew) {
        setIsRevealed(true);
      }
    } catch (error) {
      console.error('Failed to load daily card:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReveal = () => {
    setIsRevealed(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading size="lg" text="오늘의 카드를 준비하는 중..." />
      </div>
    );
  }

  if (!dailyCard) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-gray-400">오늘의 카드를 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-accent mb-2">오늘의 카드</h1>
        <p className="text-gray-400">
          {new Date(dailyCard.date).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>

      <div className="max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-8"
        >
          <div className="flex flex-col items-center">
            {/* Card Display */}
            <div className="mb-6">
              <TarotCard
                card={dailyCard.card}
                isFlipped={isRevealed}
                isReversed={dailyCard.card.isReversed}
                size="lg"
                onClick={!isRevealed ? handleReveal : undefined}
              />
            </div>

            <AnimatePresence mode="wait">
              {!isRevealed ? (
                <motion.div
                  key="unrevealed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <p className="text-gray-300 mb-4">
                    카드를 클릭하거나 버튼을 눌러 오늘의 카드를 확인하세요
                  </p>
                  <Button onClick={handleReveal}>
                    카드 확인하기
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="revealed"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center w-full"
                >
                  {/* Card Name */}
                  <h2 className="text-2xl font-bold text-accent mb-1">
                    {dailyCard.card.nameKo}
                  </h2>
                  <p className="text-gray-400 mb-2">
                    {dailyCard.card.nameEn}
                    {dailyCard.card.isReversed && ' (역방향)'}
                  </p>

                  {/* Keywords */}
                  <div className="flex flex-wrap justify-center gap-2 mb-6">
                    {dailyCard.card.keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="bg-mystic-800 text-gray-300 px-3 py-1 rounded-full text-sm"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>

                  {/* Message */}
                  {dailyCard.message && (
                    <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 mb-6">
                      <p className="text-accent font-medium">
                        ✨ {dailyCard.message}
                      </p>
                    </div>
                  )}

                  {/* Card Meaning */}
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-accent mb-2">
                      오늘의 메시지
                    </h3>
                    <p className="text-gray-300 leading-relaxed">
                      {dailyCard.card.meaning}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 text-center"
        >
          <p className="text-gray-500 text-sm">
            💡 오늘의 카드는 매일 자정에 초기화됩니다.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default DailyCard;
