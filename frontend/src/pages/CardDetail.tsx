import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cardService } from '../services/cardService';
import { progressService } from '../services/progressService';
import { Card } from '../types';
import { useAuthStore } from '../store/authStore';
import TarotCard from '../components/tarot/TarotCard';
import Loading from '../components/common/Loading';
import Button from '../components/common/Button';

const CardDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReversed, setIsReversed] = useState(false);
  const [activeTab, setActiveTab] = useState<'meaning' | 'domain' | 'symbol'>('meaning');
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLearned, setIsLearned] = useState(false);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    loadCard();
  }, [id]);

  const loadCard = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await cardService.getCardById(parseInt(id));
      setCard(data);
    } catch (error) {
      console.error('Failed to load card:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!card) return;
    try {
      const result = await progressService.toggleFavorite(card.id);
      setIsFavorite(result.isFavorite);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleToggleLearned = async () => {
    if (!card) return;
    try {
      const result = await progressService.updateProgress(card.id, !isLearned);
      setIsLearned(result.isLearned);
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading size="lg" text="카드 정보를 불러오는 중..." />
      </div>
    );
  }

  if (!card) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-gray-400">카드를 찾을 수 없습니다.</p>
        <Link to="/cards" className="text-accent hover:underline mt-4 inline-block">
          카드 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/cards" className="text-accent hover:underline mb-6 inline-block">
        ← 카드 목록으로
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Card Display */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <div className="flex flex-col items-center">
              <TarotCard
                card={card}
                isFlipped={true}
                isReversed={isReversed}
                size="lg"
                showName={false}
              />

              <div className="mt-4 flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsReversed(!isReversed)}
                >
                  {isReversed ? '정방향 보기' : '역방향 보기'}
                </Button>
              </div>

              {isAuthenticated && (
                <div className="mt-4 flex gap-2">
                  <Button
                    variant={isFavorite ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={handleToggleFavorite}
                  >
                    {isFavorite ? '★ 즐겨찾기' : '☆ 즐겨찾기'}
                  </Button>
                  <Button
                    variant={isLearned ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={handleToggleLearned}
                  >
                    {isLearned ? '✓ 학습완료' : '학습하기'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card Info */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-6"
          >
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                <span className="bg-accent/20 text-accent px-2 py-1 rounded">
                  {card.type === 'MAJOR' ? '메이저 아르카나' : '마이너 아르카나'}
                </span>
                {card.suit && (
                  <span className="bg-mystic-700 px-2 py-1 rounded">
                    {card.suit === 'WANDS' && '완드'}
                    {card.suit === 'CUPS' && '컵'}
                    {card.suit === 'SWORDS' && '소드'}
                    {card.suit === 'PENTACLES' && '펜타클'}
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold text-accent">{card.nameKo}</h1>
              <p className="text-gray-400">{card.nameEn}</p>
            </div>

            {/* Keywords */}
            <div className="flex flex-wrap gap-2 mb-6">
              {card.keywords.map((keyword, index) => (
                <span
                  key={index}
                  className="bg-mystic-800 text-gray-300 px-3 py-1 rounded-full text-sm"
                >
                  {keyword}
                </span>
              ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-mystic-700 mb-6">
              {[
                { key: 'meaning', label: '기본 의미' },
                { key: 'domain', label: '분야별 해석' },
                { key: 'symbol', label: '상징 해설' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`pb-3 px-2 transition-all duration-300 ${
                    activeTab === tab.key
                      ? 'text-accent border-b-2 border-accent'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {activeTab === 'meaning' && (
                <>
                  <div>
                    <h3 className="text-lg font-semibold text-accent mb-2">정방향</h3>
                    <p className="text-gray-300 leading-relaxed">{card.uprightMeaning}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-accent mb-2">역방향</h3>
                    <p className="text-gray-300 leading-relaxed">{card.reversedMeaning}</p>
                  </div>
                </>
              )}

              {activeTab === 'domain' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: 'love', label: '사랑', icon: '💕' },
                    { key: 'career', label: '직업', icon: '💼' },
                    { key: 'health', label: '건강', icon: '🏥' },
                    { key: 'finance', label: '재정', icon: '💰' }
                  ].map((domain) => (
                    <div key={domain.key} className="bg-mystic-800/50 rounded-lg p-4">
                      <h4 className="text-accent font-semibold mb-2">
                        {domain.icon} {domain.label}
                      </h4>
                      <p className="text-gray-300 text-sm">
                        {card[domain.key as keyof Card] as string}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'symbol' && (
                <div>
                  <h3 className="text-lg font-semibold text-accent mb-2">상징과 의미</h3>
                  <p className="text-gray-300 leading-relaxed">{card.symbolism}</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CardDetail;
