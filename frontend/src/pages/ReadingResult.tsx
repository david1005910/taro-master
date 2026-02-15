import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { readingService } from '../services/readingService';
import api from '../services/api';
import { Reading } from '../types';
import TarotCard from '../components/tarot/TarotCard';
import Loading from '../components/common/Loading';
import Button from '../components/common/Button';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

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

  // 채팅 상태
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

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

  const handleSendChat = async () => {
    if (!chatInput.trim() || !id || isChatLoading) return;
    const userMsg: ChatMessage = { role: 'user', content: chatInput.trim() };
    const newHistory = [...chatMessages, userMsg];
    setChatMessages(newHistory);
    setChatInput('');
    setIsChatLoading(true);
    try {
      const { data } = await api.post('/ai/chat', {
        readingId: id,
        message: userMsg.content,
        history: chatMessages.slice(-8)
      });
      const reply: ChatMessage = { role: 'assistant', content: data.data.reply };
      setChatMessages([...newHistory, reply]);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err: any) {
      const errMsg = err?.response?.data?.error?.message ?? 'AI 응답 중 오류가 발생했습니다.';
      setChatMessages([...newHistory, { role: 'assistant', content: errMsg }]);
    } finally {
      setIsChatLoading(false);
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
        <div className="flex items-center gap-2 mb-5">
          <span className="text-2xl">🃏</span>
          <h2 className="text-xl font-semibold text-accent">카드별 상세 해석</h2>
        </div>
        <div className="space-y-8">
          {reading.cards.map((rc, index) => (
            <div key={index} className="border-b border-neon-purple/20 last:border-b-0 pb-8 last:pb-0">
              {/* 카드 헤더 */}
              <div className="flex items-center gap-3 mb-4">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-neon-purple/30 border border-neon-purple/50 flex items-center justify-center text-neon-purple text-sm font-bold">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-accent font-semibold text-lg leading-tight">
                    {rc.positionName}
                    <span className="text-gray-400 font-normal text-base mx-2">—</span>
                    {rc.card.nameKo}
                    {rc.isReversed
                      ? <span className="ml-2 text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full">역방향 ↓</span>
                      : <span className="ml-2 text-xs bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 px-2 py-0.5 rounded-full">정방향 ↑</span>
                    }
                  </h3>
                  <p className="text-gray-500 text-sm mt-0.5">{rc.positionDescription}</p>
                </div>
              </div>
              {/* 카드 이미지 + 해석 */}
              <div className="flex items-start gap-5">
                <div className="flex-shrink-0">
                  <TarotCard
                    card={rc.card}
                    isFlipped={true}
                    isReversed={rc.isReversed}
                    size="sm"
                  />
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-gray-200 leading-relaxed text-sm whitespace-pre-line">
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

      {/* Chat Interface */}
      {reading.interpretMode === 'AI' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-xl p-6 mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">💬</span>
            <h2 className="text-xl font-semibold text-neon-cyan">타로 상담사에게 질문하기</h2>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            이 리딩에 대해 궁금한 점을 자유롭게 질문하세요. 뽑힌 카드를 기반으로 답변합니다.
          </p>

          {/* Message List */}
          {chatMessages.length > 0 && (
            <div className="space-y-3 mb-4 max-h-80 overflow-y-auto pr-1">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-xl px-4 py-2 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-neon-pink/20 border border-neon-pink/30 text-white'
                        : 'bg-neon-purple/20 border border-neon-purple/30 text-gray-200'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <span className="text-neon-cyan text-xs font-semibold block mb-1">🔮 타로 상담사</span>
                    )}
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-neon-purple/20 border border-neon-purple/30 rounded-xl px-4 py-2 text-sm">
                    <span className="text-neon-cyan text-xs font-semibold block mb-1">🔮 타로 상담사</span>
                    <span className="text-gray-400 animate-pulse">답변을 준비하고 있습니다...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}

          {/* Input Area */}
          <div className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendChat()}
              placeholder="이 카드들이 말하는 것이 무엇인지 더 자세히 알고 싶어요..."
              disabled={isChatLoading}
              className="input-mystic flex-1 text-sm"
            />
            <Button
              onClick={handleSendChat}
              isLoading={isChatLoading}
              disabled={!chatInput.trim() || isChatLoading}
              variant="primary"
              size="sm"
            >
              전송
            </Button>
          </div>
        </motion.div>
      )}

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
