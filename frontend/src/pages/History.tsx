import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { readingService } from '../services/readingService';
import { ReadingPreview } from '../types';
import Loading from '../components/common/Loading';
import Button from '../components/common/Button';

const History = () => {
  const [readings, setReadings] = useState<ReadingPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadReadings();
  }, [page]);

  const loadReadings = async () => {
    setLoading(true);
    try {
      const response = await readingService.getReadings({ page, limit: 10 });
      setReadings(response.readings);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('Failed to load readings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 리딩을 삭제하시겠습니까?')) return;

    try {
      await readingService.deleteReading(id);
      setReadings(readings.filter(r => r.id !== id));
    } catch (error) {
      console.error('Failed to delete reading:', error);
    }
  };

  if (loading && page === 1) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading size="lg" text="리딩 기록을 불러오는 중..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-accent mb-2">리딩 기록</h1>
        <p className="text-gray-400">과거의 리딩을 되돌아보세요</p>
      </div>

      {readings.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 mb-4">아직 리딩 기록이 없습니다.</p>
          <Link to="/reading">
            <Button>첫 리딩 시작하기</Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {readings.map((reading, index) => (
              <motion.div
                key={reading.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass rounded-xl p-4 hover:border-accent/50 transition-all duration-300"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Preview Cards */}
                  <div className="flex gap-2">
                    {reading.previewCards.map((card, i) => (
                      <div
                        key={i}
                        className={`w-12 h-18 rounded bg-gradient-to-br from-mystic-900 to-secondary border border-accent/50 flex items-center justify-center ${
                          card.isReversed ? 'rotate-180' : ''
                        }`}
                      >
                        <span className="text-accent text-xs">✦</span>
                      </div>
                    ))}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-accent font-semibold">{reading.spreadName}</span>
                      <span className="text-xs bg-mystic-700 px-2 py-0.5 rounded">
                        {reading.interpretMode === 'AI' ? '🤖 AI' : '📚 전통'}
                      </span>
                    </div>
                    {reading.question && (
                      <p className="text-gray-400 text-sm truncate mb-1">
                        "{reading.question}"
                      </p>
                    )}
                    <p className="text-gray-500 text-xs">
                      {new Date(reading.createdAt).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link to={`/reading/result/${reading.id}`}>
                      <Button variant="secondary" size="sm">보기</Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(reading.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      삭제
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                이전
              </Button>
              <span className="flex items-center text-gray-400 px-4">
                {page} / {totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                다음
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default History;
