import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useReadingStore } from '../store/readingStore';
import { readingService } from '../services/readingService';
import { spreadService } from '../services/spreadService';
import TarotCard from '../components/tarot/TarotCard';
import CardDeck from '../components/tarot/CardDeck';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';

const ReadingSession = () => {
  const [step, setStep] = useState<'shuffle' | 'select' | 'loading'>('shuffle');
  const [spreadDetail, setSpreadDetail] = useState<any>(null);
  const navigate = useNavigate();

  const {
    selectedSpread,
    question,
    interpretMode,
    selectedCards,
    availableCards,
    isShuffled,
    shuffleCards,
    selectCard
  } = useReadingStore();

  useEffect(() => {
    if (!selectedSpread) {
      navigate('/reading');
      return;
    }
    loadSpreadDetail();
  }, [selectedSpread]);

  const loadSpreadDetail = async () => {
    if (!selectedSpread) return;
    try {
      const detail = await spreadService.getSpreadById(selectedSpread.id);
      setSpreadDetail(detail);
    } catch (error) {
      console.error('Failed to load spread detail:', error);
    }
  };

  const handleShuffle = () => {
    shuffleCards();
    setTimeout(() => setStep('select'), 500);
  };

  const handleCardSelect = (cardId: number) => {
    const nextPosition = selectedCards.length;
    if (nextPosition >= (selectedSpread?.cardCount || 0)) return;

    // Check if card is already selected
    if (selectedCards.some(c => c.cardId === cardId)) return;

    selectCard(cardId, nextPosition);
  };

  const handleComplete = async () => {
    if (!selectedSpread) return;

    setStep('loading');

    try {
      const result = await readingService.createReading({
        spreadId: selectedSpread.id,
        question: question || undefined,
        interpretMode,
        cards: selectedCards
      });

      navigate(`/reading/result/${result.id}`);
    } catch (error) {
      console.error('Failed to create reading:', error);
      setStep('select');
    }
  };

  const isComplete = selectedCards.length === (selectedSpread?.cardCount || 0);

  if (!selectedSpread) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-accent mb-2">{selectedSpread.name}</h1>
        {question && (
          <p className="text-gray-400">"{question}"</p>
        )}
      </div>

      {/* Shuffle Step */}
      <AnimatePresence mode="wait">
        {step === 'shuffle' && (
          <motion.div
            key="shuffle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center py-10"
          >
            <p className="text-gray-300 mb-8 text-center">
              카드를 섞으며 질문에 집중하세요.<br />
              마음의 준비가 되면 카드를 섞어주세요.
            </p>
            <CardDeck onShuffle={handleShuffle} isShuffled={isShuffled} />
          </motion.div>
        )}

        {step === 'select' && (
          <motion.div
            key="select"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Position Guide */}
            {spreadDetail && (
              <div className="glass rounded-xl p-4 mb-6">
                <h3 className="text-accent font-semibold mb-3">
                  {selectedCards.length + 1}번째 카드 선택: {
                    spreadDetail.positions[selectedCards.length]?.name
                  }
                </h3>
                <p className="text-gray-400 text-sm">
                  {spreadDetail.positions[selectedCards.length]?.description}
                </p>
              </div>
            )}

            {/* Selected Cards */}
            {selectedCards.length > 0 && (
              <div className="glass rounded-xl p-4 mb-6">
                <h3 className="text-accent font-semibold mb-3">선택한 카드</h3>
                <div className="flex flex-wrap gap-3">
                  {selectedCards.map((sc, index) => {
                    const card = availableCards.find(c => c.id === sc.cardId);
                    if (!card) return null;
                    return (
                      <div key={index} className="text-center">
                        <TarotCard
                          card={card}
                          isFlipped={true}
                          isReversed={sc.isReversed}
                          size="sm"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          {spreadDetail?.positions[index]?.name}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>진행률</span>
                <span>{selectedCards.length} / {selectedSpread.cardCount}</span>
              </div>
              <div className="h-2 bg-mystic-800 rounded-full">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-300"
                  style={{
                    width: `${(selectedCards.length / selectedSpread.cardCount) * 100}%`
                  }}
                />
              </div>
            </div>

            {/* Card Selection */}
            {!isComplete ? (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                {availableCards.map((card) => {
                  const isSelected = selectedCards.some(c => c.cardId === card.id);
                  return (
                    <motion.div
                      key={card.id}
                      whileHover={!isSelected ? { scale: 1.1, y: -5 } : {}}
                      className={isSelected ? 'opacity-30' : 'cursor-pointer'}
                      onClick={() => !isSelected && handleCardSelect(card.id)}
                    >
                      <TarotCard
                        card={card}
                        isFlipped={false}
                        size="sm"
                        disabled={isSelected}
                        showName={false}
                      />
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-xl text-accent mb-6">
                  모든 카드를 선택했습니다!
                </p>
                <Button onClick={handleComplete} size="lg">
                  결과 보기
                </Button>
              </div>
            )}
          </motion.div>
        )}

        {step === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center py-20"
          >
            <Loading size="lg" text={
              interpretMode === 'AI'
                ? 'AI가 카드를 해석하고 있습니다...'
                : '결과를 준비하고 있습니다...'
            } />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReadingSession;
