import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';

const Home = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-6xl mb-6 block">🔮</span>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="text-accent">타로 마스터</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              AI 기반 타로 학습 및 리딩 플랫폼으로<br />
              78장의 타로 카드가 전하는 메시지를 발견하세요
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            {isAuthenticated ? (
              <>
                <Link to="/reading" className="btn-primary text-lg py-3 px-8">
                  리딩 시작하기
                </Link>
                <Link to="/daily" className="btn-secondary text-lg py-3 px-8">
                  오늘의 카드
                </Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn-primary text-lg py-3 px-8">
                  무료로 시작하기
                </Link>
                <Link to="/cards" className="btn-secondary text-lg py-3 px-8">
                  카드 둘러보기
                </Link>
              </>
            )}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-accent mb-12">주요 기능</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: '📚',
              title: '78장 카드 백과',
              description: '메이저 아르카나 22장과 마이너 아르카나 56장의 상세한 의미와 해석을 학습하세요.'
            },
            {
              icon: '🎴',
              title: '다양한 스프레드',
              description: '원카드부터 켈틱 크로스까지, 6가지 스프레드로 다양한 질문에 답을 얻으세요.'
            },
            {
              icon: '🤖',
              title: 'AI 맞춤 해석',
              description: 'Claude AI가 당신의 질문과 뽑은 카드를 분석하여 깊이 있는 해석을 제공합니다.'
            },
            {
              icon: '📊',
              title: '학습 진도 추적',
              description: '학습한 카드를 체크하고 즐겨찾기와 메모로 나만의 타로 학습을 관리하세요.'
            },
            {
              icon: '🌟',
              title: '오늘의 카드',
              description: '매일 하나의 카드로 하루를 시작하세요. 오늘의 메시지가 당신을 안내합니다.'
            },
            {
              icon: '📝',
              title: '리딩 기록',
              description: '모든 리딩 기록을 저장하고 되돌아보며 성찰의 시간을 가지세요.'
            },
            {
              icon: '🔗',
              title: '사주 × 타로 융합',
              description: '동양의 사주팔자와 서양의 타로를 연결하여 깊은 통찰을 얻으세요.'
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="glass p-6 rounded-xl hover:border-accent/50 transition-all duration-300"
            >
              <span className="text-4xl mb-4 block">{feature.icon}</span>
              <h3 className="text-xl font-semibold text-accent mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="glass rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-3xl font-bold text-accent mb-4">
            당신의 타로 여정을 시작하세요
          </h2>
          <p className="text-gray-300 mb-8 max-w-xl mx-auto">
            타로는 단순한 점술이 아닌, 자신을 돌아보고 성찰하는 도구입니다.
            타로 마스터와 함께 내면의 목소리에 귀 기울여 보세요.
          </p>
          {!isAuthenticated && (
            <Link to="/register" className="btn-primary text-lg py-3 px-8">
              지금 시작하기
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
