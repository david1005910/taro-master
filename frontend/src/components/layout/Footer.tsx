import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="glass mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-2xl">🔮</span>
              <span className="text-xl font-bold text-accent">타로 마스터</span>
            </div>
            <p className="text-gray-400 text-sm">
              AI 기반 타로 학습 및 리딩 플랫폼으로<br />
              타로의 신비로운 세계를 경험하세요.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-accent font-semibold mb-4">빠른 링크</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/cards" className="text-gray-400 hover:text-accent text-sm transition-colors">
                  카드 백과사전
                </Link>
              </li>
              <li>
                <Link to="/reading" className="text-gray-400 hover:text-accent text-sm transition-colors">
                  타로 리딩
                </Link>
              </li>
              <li>
                <Link to="/daily" className="text-gray-400 hover:text-accent text-sm transition-colors">
                  오늘의 카드
                </Link>
              </li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="text-accent font-semibold mb-4">안내</h3>
            <p className="text-gray-400 text-sm">
              타로 리딩은 재미와 자기 성찰을 위한 것입니다.<br />
              중요한 결정은 전문가와 상담하세요.
            </p>
          </div>
        </div>

        <div className="border-t border-mystic-700 mt-8 pt-8 text-center">
          <p className="text-gray-500 text-sm">
            © 2024 타로 마스터. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
