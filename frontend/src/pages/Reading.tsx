import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { spreadService } from '../services/spreadService';
import { cardService } from '../services/cardService';
import { useReadingStore } from '../store/readingStore';
import { Spread } from '../types';
import SpreadSelector from '../components/tarot/SpreadSelector';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';

const Reading = () => {
  const [spreads, setSpreads] = useState<Spread[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const {
    selectedSpread,
    question,
    interpretMode,
    setSpread,
    setQuestion,
    setInterpretMode,
    setAvailableCards,
    resetSession
  } = useReadingStore();

  useEffect(() => {
    resetSession();
    loadSpreads();
  }, []);

  const loadSpreads = async () => {
    try {
      const data = await spreadService.getSpreads();
      setSpreads(data);
    } catch (error) {
      console.error('Failed to load spreads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartReading = async () => {
    if (!selectedSpread) return;

    try {
      const response = await cardService.getCards({ limit: 78 });
      setAvailableCards(response.cards);
      navigate('/reading/session');
    } catch (error) {
      console.error('Failed to load cards:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading size="lg" text="스프레드를 불러오는 중..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-accent mb-2">타로 리딩</h1>
        <p className="text-gray-400">스프레드를 선택하고 질문을 입력하세요</p>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Step 1: Select Spread */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-6"
        >
          <h2 className="text-xl font-semibold text-accent mb-4">
            1. 스프레드 선택
          </h2>
          <SpreadSelector
            spreads={spreads}
            selectedSpread={selectedSpread}
            onSelect={setSpread}
          />
        </motion.div>

        {/* Step 2: Enter Question */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-xl p-6"
        >
          <h2 className="text-xl font-semibold text-accent mb-4">
            2. 질문 입력 <span className="text-gray-500 text-sm">(선택)</span>
          </h2>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="무엇이 궁금하신가요? 구체적인 질문일수록 더 정확한 해석을 받을 수 있습니다."
            className="input-mystic min-h-[100px] resize-none"
          />
        </motion.div>

        {/* Step 3: Select Interpretation Mode */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-xl p-6"
        >
          <h2 className="text-xl font-semibold text-accent mb-4">
            3. 해석 모드 선택
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setInterpretMode('TRADITIONAL')}
              className={`p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                interpretMode === 'TRADITIONAL'
                  ? 'border-accent bg-accent/10'
                  : 'border-mystic-700 hover:border-accent/50'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">📚</span>
                <span className="font-semibold text-accent">전통 해석</span>
              </div>
              <p className="text-gray-400 text-sm">
                각 카드의 전통적인 의미를 기반으로 해석을 제공합니다.
              </p>
            </button>

            <button
              onClick={() => setInterpretMode('AI')}
              className={`p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                interpretMode === 'AI'
                  ? 'border-accent bg-accent/10'
                  : 'border-mystic-700 hover:border-accent/50'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">🤖</span>
                <span className="font-semibold text-accent">AI 해석</span>
              </div>
              <p className="text-gray-400 text-sm">
                AI가 질문과 카드를 분석하여 맞춤형 해석을 제공합니다.
              </p>
            </button>
          </div>
        </motion.div>

        {/* Start Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <Button
            onClick={handleStartReading}
            disabled={!selectedSpread}
            size="lg"
            className="min-w-[200px]"
          >
            리딩 시작하기
          </Button>
          {!selectedSpread && (
            <p className="text-gray-500 text-sm mt-2">
              스프레드를 선택해주세요
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Reading;
