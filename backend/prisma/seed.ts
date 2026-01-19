import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 메이저 아르카나 22장
const majorArcana = [
  {
    number: 0,
    nameKo: '바보',
    nameEn: 'The Fool',
    keywords: ['새로운 시작', '순수', '모험', '자유', '무한한 가능성'],
    uprightMeaning: '새로운 시작과 무한한 가능성을 상징합니다. 순수한 마음으로 미지의 세계로 첫 발을 내딛는 여정을 의미합니다. 두려움 없이 새로운 모험을 시작할 때입니다.',
    reversedMeaning: '무모함, 경솔한 결정, 준비 없는 도전을 경고합니다. 현실적인 계획 없이 행동하거나 주변의 조언을 무시하고 있을 수 있습니다.',
    symbolism: '절벽 위에 선 젊은이는 무한한 가능성을 상징합니다. 흰 장미는 순수를, 작은 개는 본능적 지혜를, 배낭은 경험을 나타냅니다.',
    love: '새로운 만남의 시작, 순수한 사랑, 설레는 연애의 시작을 암시합니다.',
    career: '새로운 직장이나 분야로의 전환, 창업, 프리랜서 도전에 좋은 시기입니다.',
    health: '활력 넘치는 에너지와 새로운 건강 습관을 시작하기 좋은 때입니다.',
    finance: '새로운 투자 기회가 있지만, 신중한 접근이 필요합니다.'
  },
  {
    number: 1,
    nameKo: '마법사',
    nameEn: 'The Magician',
    keywords: ['창조', '의지력', '기술', '집중', '무한한 잠재력'],
    uprightMeaning: '당신은 목표를 달성할 모든 도구와 능력을 가지고 있습니다. 창의력과 집중력을 발휘하여 원하는 것을 현실로 만들 수 있는 시기입니다.',
    reversedMeaning: '재능의 낭비, 조작이나 속임수, 자신감 부족을 의미할 수 있습니다. 능력이 있지만 제대로 활용하지 못하고 있습니다.',
    symbolism: '한 손은 하늘을, 다른 손은 땅을 가리키며 영적 세계와 물질 세계를 연결합니다. 테이블 위 도구들은 네 원소를 상징합니다.',
    love: '매력적인 커뮤니케이션으로 관계를 발전시킬 수 있습니다. 적극적인 표현이 중요합니다.',
    career: '새로운 프로젝트 시작, 리더십 발휘, 창의적인 해결책을 찾을 수 있는 시기입니다.',
    health: '정신력과 의지력이 건강에 긍정적 영향을 미칩니다. 명상이 도움이 됩니다.',
    finance: '사업적 기회를 잡을 수 있는 시기, 계획적인 투자가 좋은 결과를 가져옵니다.'
  },
  {
    number: 2,
    nameKo: '여사제',
    nameEn: 'The High Priestess',
    keywords: ['직관', '신비', '내면의 지혜', '무의식', '비밀'],
    uprightMeaning: '직관과 내면의 목소리에 귀 기울일 때입니다. 표면적인 것 너머의 숨겨진 진실이 있습니다. 명상과 자기 성찰이 필요한 시기입니다.',
    reversedMeaning: '직관을 무시하거나 비밀이 드러날 수 있습니다. 표면적인 것에만 집착하고 있을 수 있습니다.',
    symbolism: '두 기둥 사이에 앉아 있는 모습은 이중성과 균형을 상징합니다. 달과 석류는 여성성과 풍요를 나타냅니다.',
    love: '직감을 따르세요. 숨겨진 감정이나 비밀이 있을 수 있습니다. 인내가 필요합니다.',
    career: '정보 수집과 분석이 필요한 시기, 급하게 결정하지 마세요.',
    health: '호르몬 균형, 여성 건강에 주의가 필요합니다. 스트레스 관리가 중요합니다.',
    finance: '숨겨진 정보에 주의하세요. 충동적인 결정보다 신중한 분석이 필요합니다.'
  },
  {
    number: 3,
    nameKo: '여황제',
    nameEn: 'The Empress',
    keywords: ['풍요', '양육', '자연', '창조성', '여성성'],
    uprightMeaning: '풍요와 성장의 시기입니다. 창조적 에너지가 넘치며, 양육하고 돌보는 활동이 축복받습니다. 자연과의 교감이 도움이 됩니다.',
    reversedMeaning: '창조적 막힘, 의존성, 과잉보호를 의미할 수 있습니다. 자신을 돌보는 것을 잊고 있을 수 있습니다.',
    symbolism: '풍성한 자연 속의 여황제는 대지의 풍요를 상징합니다. 금성 기호는 사랑과 아름다움을 나타냅니다.',
    love: '사랑이 풍요로워지는 시기, 임신이나 결혼의 가능성, 관계의 성장을 암시합니다.',
    career: '창의적인 프로젝트가 결실을 맺습니다. 팀을 이끌고 양육하는 역할에 적합합니다.',
    health: '임신, 출산과 관련된 시기일 수 있습니다. 자연 치유와 휴식이 도움이 됩니다.',
    finance: '투자가 성장하는 시기, 풍요로운 재정 상태를 기대할 수 있습니다.'
  },
  {
    number: 4,
    nameKo: '황제',
    nameEn: 'The Emperor',
    keywords: ['권위', '안정', '구조', '리더십', '아버지'],
    uprightMeaning: '안정과 질서를 확립할 때입니다. 리더십을 발휘하고 명확한 경계를 설정하세요. 체계적인 접근이 성공을 가져옵니다.',
    reversedMeaning: '과도한 통제, 독재적 태도, 경직된 사고를 경고합니다. 융통성이 필요할 수 있습니다.',
    symbolism: '왕좌에 앉은 황제는 권위와 안정을 상징합니다. 숫양 머리는 용기와 리더십을 나타냅니다.',
    love: '안정적인 관계, 책임감 있는 파트너십을 의미합니다. 헌신과 보호를 추구합니다.',
    career: '리더십 역할, 승진, 안정적인 직장 환경을 암시합니다. 체계적인 접근이 필요합니다.',
    health: '규칙적인 생활 습관이 건강에 도움이 됩니다. 근육과 뼈 건강에 신경 쓰세요.',
    finance: '재정적 안정, 장기적인 투자 계획이 좋은 결과를 가져옵니다.'
  },
  {
    number: 5,
    nameKo: '교황',
    nameEn: 'The Hierophant',
    keywords: ['전통', '영적 지혜', '교육', '제도', '믿음'],
    uprightMeaning: '전통적인 가르침과 제도를 따르는 것이 도움이 됩니다. 스승이나 멘토의 조언을 구하세요. 영적 성장의 시기입니다.',
    reversedMeaning: '관습에 대한 반항, 비전통적 접근, 독자적인 길을 찾아야 할 때를 의미합니다.',
    symbolism: '교황의 의복과 왕관은 영적 권위를 상징합니다. 두 제자는 전통의 전수를 나타냅니다.',
    love: '전통적인 가치관, 결혼이나 공식적인 약속을 암시합니다. 공유된 믿음이 중요합니다.',
    career: '교육, 종교, 전통적인 기관에서의 성공, 멘토링 역할에 적합합니다.',
    health: '전통적인 치료법, 검증된 건강 관리 방법이 효과적입니다.',
    finance: '보수적인 투자, 전통적인 금융 기관을 통한 거래가 안전합니다.'
  },
  {
    number: 6,
    nameKo: '연인',
    nameEn: 'The Lovers',
    keywords: ['사랑', '조화', '선택', '가치관', '파트너십'],
    uprightMeaning: '중요한 선택의 시간입니다. 사랑과 관계에서 조화를 찾고, 진정한 가치관에 따라 결정하세요. 깊은 연결이 가능합니다.',
    reversedMeaning: '불화, 불균형한 관계, 잘못된 선택을 의미할 수 있습니다. 가치관의 충돌이 있을 수 있습니다.',
    symbolism: '천사 아래 아담과 이브는 영적 축복 아래의 결합을 상징합니다. 선악과 나무는 선택을 나타냅니다.',
    love: '진정한 사랑, 영혼의 동반자, 깊은 유대감을 의미합니다. 중요한 관계 결정이 있을 수 있습니다.',
    career: '파트너십, 협력 프로젝트, 중요한 비즈니스 결정의 시기입니다.',
    health: '균형 잡힌 생활, 파트너와 함께하는 건강 활동이 도움이 됩니다.',
    finance: '공동 투자, 파트너십을 통한 재정적 이익이 있을 수 있습니다.'
  },
  {
    number: 7,
    nameKo: '전차',
    nameEn: 'The Chariot',
    keywords: ['승리', '의지력', '결단력', '통제', '전진'],
    uprightMeaning: '강한 의지로 장애물을 극복하고 승리를 향해 전진하세요. 방향을 정하고 집중하면 성공을 거둘 수 있습니다.',
    reversedMeaning: '방향 상실, 공격성, 통제력 부족을 의미합니다. 내적 갈등을 해결해야 합니다.',
    symbolism: '전사는 두 마리 스핑크스가 끄는 전차를 몰며 의지력으로 상반된 힘을 조종합니다.',
    love: '관계에서 주도권을 잡거나, 사랑을 향해 적극적으로 나아가는 시기입니다.',
    career: '목표 달성, 승진, 프로젝트 성공을 암시합니다. 강한 추진력이 필요합니다.',
    health: '활력이 넘치지만 스트레스 관리가 필요합니다. 운동이 도움이 됩니다.',
    finance: '재정적 목표 달성, 적극적인 재테크가 좋은 결과를 가져옵니다.'
  },
  {
    number: 8,
    nameKo: '힘',
    nameEn: 'Strength',
    keywords: ['용기', '인내', '내면의 힘', '자기 통제', '연민'],
    uprightMeaning: '내면의 힘과 용기로 어려움을 극복할 수 있습니다. 부드러운 접근이 강압보다 효과적입니다. 인내심을 가지세요.',
    reversedMeaning: '자신감 부족, 자기 의심, 내적 힘을 잃은 상태를 나타냅니다.',
    symbolism: '여인이 부드럽게 사자를 다루는 모습은 본능을 지혜롭게 다스리는 내면의 힘을 상징합니다.',
    love: '인내와 이해로 관계를 강화하세요. 부드러운 접근이 효과적입니다.',
    career: '어려운 상황에서도 침착함을 유지하면 성공합니다. 인내가 필요한 시기입니다.',
    health: '정신적 강인함이 신체 건강에 긍정적 영향을 미칩니다. 요가가 도움이 됩니다.',
    finance: '장기적인 관점에서 인내심을 가지고 투자하세요.'
  },
  {
    number: 9,
    nameKo: '은둔자',
    nameEn: 'The Hermit',
    keywords: ['성찰', '고독', '내면 탐구', '지혜', '명상'],
    uprightMeaning: '혼자만의 시간을 통해 내면을 탐구할 때입니다. 외부 세계에서 물러나 진정한 답을 내면에서 찾으세요.',
    reversedMeaning: '지나친 고립, 외로움, 현실 회피를 의미할 수 있습니다. 균형이 필요합니다.',
    symbolism: '등불을 든 은둔자는 어둠 속에서 진리를 찾는 구도자를 상징합니다.',
    love: '혼자만의 시간이 필요하거나, 관계에서 깊은 성찰이 필요한 시기입니다.',
    career: '전문 지식 심화, 연구, 독립적인 작업에 적합한 시기입니다.',
    health: '정신 건강에 집중하세요. 명상과 자기 돌봄이 중요합니다.',
    finance: '신중한 분석과 연구 후 결정하세요. 조용히 자산을 축적하는 시기입니다.'
  },
  {
    number: 10,
    nameKo: '운명의 수레바퀴',
    nameEn: 'Wheel of Fortune',
    keywords: ['변화', '운명', '순환', '기회', '전환점'],
    uprightMeaning: '인생의 전환점에 있습니다. 변화의 바람이 불어오며 운명이 좋은 방향으로 돌아갑니다. 기회를 잡으세요.',
    reversedMeaning: '불운, 변화에 대한 저항, 통제할 수 없는 상황을 의미합니다.',
    symbolism: '회전하는 바퀴와 네 생명체는 삶의 순환과 변화의 불가피함을 상징합니다.',
    love: '관계에 새로운 전환점, 운명적인 만남의 가능성이 있습니다.',
    career: '새로운 기회, 예상치 못한 변화, 행운의 시기입니다.',
    health: '변화하는 건강 상태, 순환적인 건강 관리가 필요합니다.',
    finance: '재정적 변화, 투자 수익의 변동, 새로운 기회가 올 수 있습니다.'
  },
  {
    number: 11,
    nameKo: '정의',
    nameEn: 'Justice',
    keywords: ['공정', '진실', '균형', '법', '책임'],
    uprightMeaning: '진실과 정의가 승리합니다. 공정한 결과가 다가오며, 자신의 행동에 책임을 지게 됩니다. 균형을 추구하세요.',
    reversedMeaning: '불공정, 편견, 책임 회피를 의미할 수 있습니다. 자기 기만에 주의하세요.',
    symbolism: '천칭과 검을 든 정의의 여신은 공정한 판단과 진실을 상징합니다.',
    love: '관계에서 공정함과 균형이 필요합니다. 정직한 대화가 중요합니다.',
    career: '법적 문제, 계약, 공정한 평가와 관련된 시기입니다.',
    health: '균형 잡힌 생활 방식이 건강에 중요합니다.',
    finance: '재정적 균형, 공정한 거래, 법적 문제 해결이 있을 수 있습니다.'
  },
  {
    number: 12,
    nameKo: '매달린 사람',
    nameEn: 'The Hanged Man',
    keywords: ['희생', '새로운 관점', '기다림', '항복', '깨달음'],
    uprightMeaning: '다른 관점에서 상황을 바라볼 때입니다. 잠시 멈추고 상황을 받아들이면 새로운 통찰을 얻을 수 있습니다.',
    reversedMeaning: '쓸데없는 희생, 무의미한 기다림, 정체된 상황을 의미합니다.',
    symbolism: '거꾸로 매달린 남자는 자발적 희생과 새로운 관점을 통한 깨달음을 상징합니다.',
    love: '관계에서 양보와 이해가 필요한 시기입니다. 기다림이 필요할 수 있습니다.',
    career: '일시적 정체, 다른 접근법을 고려해야 할 때입니다.',
    health: '휴식이 필요합니다. 치유를 위한 시간을 가지세요.',
    finance: '투자 결정을 잠시 보류하세요. 새로운 관점이 필요합니다.'
  },
  {
    number: 13,
    nameKo: '죽음',
    nameEn: 'Death',
    keywords: ['변화', '종말', '변형', '새로운 시작', '해방'],
    uprightMeaning: '하나의 장이 끝나고 새로운 장이 시작됩니다. 변화를 받아들이면 새로운 기회가 열립니다. 과거를 놓아주세요.',
    reversedMeaning: '변화에 대한 저항, 정체, 끝나야 할 것을 붙잡고 있음을 의미합니다.',
    symbolism: '검은 갑옷의 기사는 피할 수 없는 변화를 상징합니다. 떠오르는 해는 새로운 시작을 나타냅니다.',
    love: '관계의 변화, 끝과 새로운 시작, 깊은 변형의 시기입니다.',
    career: '직업적 전환, 한 시대의 종말, 새로운 방향으로의 전환입니다.',
    health: '나쁜 습관을 버리고 건강한 생활로 전환할 때입니다.',
    finance: '재정 구조의 변화, 낡은 투자를 정리하고 새로 시작하세요.'
  },
  {
    number: 14,
    nameKo: '절제',
    nameEn: 'Temperance',
    keywords: ['균형', '중용', '인내', '조화', '통합'],
    uprightMeaning: '극단을 피하고 중용을 지키세요. 서로 다른 요소들을 조화롭게 결합할 때입니다. 인내심이 성공을 가져옵니다.',
    reversedMeaning: '불균형, 과잉, 조화의 부재를 의미합니다. 극단적인 행동에 주의하세요.',
    symbolism: '천사가 두 잔 사이로 물을 옮기는 모습은 균형과 조화로운 결합을 상징합니다.',
    love: '관계에서 균형과 조화를 찾을 수 있습니다. 인내가 필요합니다.',
    career: '팀워크, 협력, 다양한 기술의 통합이 성공을 가져옵니다.',
    health: '균형 잡힌 식단과 생활 방식이 중요합니다. 중독에 주의하세요.',
    finance: '절제된 소비, 균형 잡힌 투자 포트폴리오가 필요합니다.'
  },
  {
    number: 15,
    nameKo: '악마',
    nameEn: 'The Devil',
    keywords: ['속박', '물질주의', '욕망', '중독', '그림자'],
    uprightMeaning: '자신을 속박하는 것이 무엇인지 인식하세요. 중독이나 부정적 패턴에서 벗어날 힘이 당신에게 있습니다.',
    reversedMeaning: '해방, 속박에서 벗어남, 두려움 극복을 의미합니다.',
    symbolism: '사슬에 묶인 두 사람은 스스로 선택한 속박을 상징합니다. 악마는 내면의 그림자를 나타냅니다.',
    love: '관계에서 불건강한 패턴, 집착, 의존성에 주의하세요.',
    career: '직장에 대한 속박감, 물질적 성공에 대한 과도한 집착에 주의하세요.',
    health: '중독, 나쁜 습관에 주의하세요. 자기 파괴적 행동을 인식하세요.',
    finance: '물질적 욕망에 대한 경고, 빚이나 재정적 속박에 주의하세요.'
  },
  {
    number: 16,
    nameKo: '탑',
    nameEn: 'The Tower',
    keywords: ['급변', '충격', '깨달음', '해체', '새로운 시작'],
    uprightMeaning: '예상치 못한 변화가 찾아옵니다. 기존의 구조가 무너지지만, 이는 더 튼튼한 기반을 만들기 위함입니다.',
    reversedMeaning: '변화를 피하거나 지연시킴, 내부적인 변화, 충격의 회피를 의미합니다.',
    symbolism: '번개에 맞아 무너지는 탑은 갑작스러운 깨달음과 거짓된 구조의 붕괴를 상징합니다.',
    love: '관계의 급격한 변화, 진실의 드러남, 관계 재정립이 있을 수 있습니다.',
    career: '갑작스러운 변화, 해고, 구조조정이 있을 수 있지만 새로운 기회가 됩니다.',
    health: '갑작스러운 건강 문제에 주의하세요. 스트레스 관리가 중요합니다.',
    finance: '재정적 충격에 대비하세요. 위험한 투자에 주의하세요.'
  },
  {
    number: 17,
    nameKo: '별',
    nameEn: 'The Star',
    keywords: ['희망', '영감', '평화', '치유', '믿음'],
    uprightMeaning: '어려운 시기가 지나고 희망이 찾아옵니다. 우주가 당신을 돕고 있으며, 꿈을 향해 나아갈 때입니다.',
    reversedMeaning: '희망 상실, 영감 부족, 믿음의 위기를 의미할 수 있습니다.',
    symbolism: '별 아래 물을 붓는 여인은 영적 치유와 희망을 상징합니다. 큰 별은 영감을 나타냅니다.',
    love: '희망적인 관계, 진정한 사랑을 향한 믿음을 가지세요.',
    career: '영감받는 시기, 창의적 작업, 꿈을 향한 진전이 있습니다.',
    health: '치유의 시기, 건강 회복, 정신적 평화를 찾을 수 있습니다.',
    finance: '재정적 희망, 상황 개선의 신호, 긍정적인 변화가 옵니다.'
  },
  {
    number: 18,
    nameKo: '달',
    nameEn: 'The Moon',
    keywords: ['환상', '직관', '불안', '무의식', '꿈'],
    uprightMeaning: '모든 것이 보이는 대로가 아닙니다. 직관에 의존하되 환상에 빠지지 마세요. 두려움을 직면할 때입니다.',
    reversedMeaning: '혼란에서 벗어남, 진실의 드러남, 두려움 극복을 의미합니다.',
    symbolism: '달, 개, 가재는 무의식의 세계와 본능, 숨겨진 두려움을 상징합니다.',
    love: '감정적 혼란, 오해, 불확실성의 시기입니다. 직관을 믿되 명확한 소통이 필요합니다.',
    career: '불확실한 상황, 숨겨진 정보에 주의하세요. 직관을 따르되 신중하세요.',
    health: '정신 건강, 수면 문제, 불안에 주의하세요. 꿈 해석이 도움이 될 수 있습니다.',
    finance: '숨겨진 비용, 불투명한 거래에 주의하세요. 신중한 결정이 필요합니다.'
  },
  {
    number: 19,
    nameKo: '태양',
    nameEn: 'The Sun',
    keywords: ['성공', '기쁨', '활력', '낙관', '명확함'],
    uprightMeaning: '성공과 행복이 찾아옵니다. 모든 것이 밝게 빛나며 긍정적인 에너지가 넘칩니다. 자신감을 가지세요.',
    reversedMeaning: '일시적인 실패, 낙관의 과잉, 기대에 미치지 못함을 의미할 수 있습니다.',
    symbolism: '밝은 태양과 아이는 순수한 기쁨, 성공, 생명력을 상징합니다.',
    love: '행복한 관계, 결혼, 임신, 기쁨이 넘치는 시기입니다.',
    career: '성공, 인정, 성취의 시기입니다. 자신감을 가지고 도전하세요.',
    health: '활력이 넘칩니다. 야외 활동이 건강에 좋습니다.',
    finance: '재정적 성공, 투자 수익, 풍요로운 시기입니다.'
  },
  {
    number: 20,
    nameKo: '심판',
    nameEn: 'Judgement',
    keywords: ['부활', '각성', '평가', '용서', '소명'],
    uprightMeaning: '과거를 되돌아보고 자신을 평가할 때입니다. 새로운 시작을 위한 준비가 되었습니다. 소명을 따르세요.',
    reversedMeaning: '자기 의심, 과거에 대한 집착, 결정 회피를 의미합니다.',
    symbolism: '천사의 나팔과 부활하는 사람들은 영적 각성과 최종 판단을 상징합니다.',
    love: '관계에 대한 재평가, 과거 해결, 새로운 시작의 기회입니다.',
    career: '커리어 재평가, 새로운 방향, 소명 발견의 시기입니다.',
    health: '건강 점검, 생활 습관 재평가가 필요한 시기입니다.',
    finance: '재정 상태 점검, 투자 평가, 새로운 전략이 필요합니다.'
  },
  {
    number: 21,
    nameKo: '세계',
    nameEn: 'The World',
    keywords: ['완성', '성취', '통합', '여행', '새로운 주기'],
    uprightMeaning: '하나의 여정이 완성됩니다. 목표를 달성하고 새로운 시작을 준비할 때입니다. 축하받아 마땅합니다.',
    reversedMeaning: '미완성, 지연, 완결되지 않은 일을 의미합니다. 마무리가 필요합니다.',
    symbolism: '월계관 안의 춤추는 인물과 네 생명체는 완전한 성취와 우주적 조화를 상징합니다.',
    love: '관계의 완성, 행복한 결합, 만족스러운 파트너십입니다.',
    career: '프로젝트 완료, 목표 달성, 다음 단계로의 진전입니다.',
    health: '전반적인 건강 균형, 완전한 웰빙 상태입니다.',
    finance: '재정적 목표 달성, 성공적인 투자 완료입니다.'
  }
];

// 마이너 아르카나 - 각 수트별 14장
const suits = ['WANDS', 'CUPS', 'SWORDS', 'PENTACLES'];
const suitKo: Record<string, string> = {
  WANDS: '완드',
  CUPS: '컵',
  SWORDS: '소드',
  PENTACLES: '펜타클'
};

const suitElements: Record<string, string> = {
  WANDS: '불',
  CUPS: '물',
  SWORDS: '공기',
  PENTACLES: '흙'
};

const suitThemes: Record<string, { keywords: string[]; domain: string }> = {
  WANDS: {
    keywords: ['열정', '창의성', '행동', '의지', '영감'],
    domain: '열정, 창의성, 영적 성장, 직업적 야망'
  },
  CUPS: {
    keywords: ['감정', '사랑', '직관', '관계', '상상력'],
    domain: '감정, 관계, 사랑, 직관'
  },
  SWORDS: {
    keywords: ['지성', '진실', '갈등', '결단', '명확성'],
    domain: '지성, 소통, 갈등, 진실'
  },
  PENTACLES: {
    keywords: ['물질', '건강', '재정', '안정', '현실'],
    domain: '물질, 재정, 건강, 현실적 문제'
  }
};

const minorArcanaTemplates = [
  { name: 'Ace', nameKo: '에이스', theme: '새로운 시작', number: 1 },
  { name: 'Two', nameKo: '2', theme: '균형과 선택', number: 2 },
  { name: 'Three', nameKo: '3', theme: '성장과 확장', number: 3 },
  { name: 'Four', nameKo: '4', theme: '안정과 기초', number: 4 },
  { name: 'Five', nameKo: '5', theme: '도전과 갈등', number: 5 },
  { name: 'Six', nameKo: '6', theme: '조화와 교류', number: 6 },
  { name: 'Seven', nameKo: '7', theme: '평가와 성찰', number: 7 },
  { name: 'Eight', nameKo: '8', theme: '움직임과 변화', number: 8 },
  { name: 'Nine', nameKo: '9', theme: '완성에 가까움', number: 9 },
  { name: 'Ten', nameKo: '10', theme: '완성과 순환', number: 10 },
  { name: 'Page', nameKo: '시종', theme: '학습과 시작', number: 11 },
  { name: 'Knight', nameKo: '기사', theme: '행동과 추진', number: 12 },
  { name: 'Queen', nameKo: '여왕', theme: '수용과 양육', number: 13 },
  { name: 'King', nameKo: '왕', theme: '지배와 완성', number: 14 }
];

function generateMinorArcana() {
  const cards: any[] = [];

  suits.forEach(suit => {
    minorArcanaTemplates.forEach(template => {
      const suitName = suitKo[suit];
      const element = suitElements[suit];
      const themes = suitThemes[suit];

      cards.push({
        number: template.number,
        nameKo: `${suitName}의 ${template.nameKo}`,
        nameEn: `${template.name} of ${suit.charAt(0) + suit.slice(1).toLowerCase()}`,
        type: 'MINOR',
        suit: suit,
        keywords: [...themes.keywords, template.theme],
        uprightMeaning: `${themes.domain}의 영역에서 ${template.theme}을(를) 나타냅니다. ${element}의 에너지가 이 카드에 깃들어 있으며, ${template.nameKo} 단계의 특성이 드러납니다.`,
        reversedMeaning: `${themes.domain}의 영역에서 ${template.theme}이(가) 차단되거나 지연됨을 의미합니다. ${element}의 에너지가 막혀있거나 과잉될 수 있습니다.`,
        symbolism: `${suitName} 수트는 ${element}의 원소와 연결되어 ${themes.domain}과 관련됩니다. ${template.nameKo}은(는) ${template.theme}의 에너지를 담고 있습니다.`,
        love: `감정적 ${template.theme}의 시기입니다. ${suitName}의 에너지가 관계에 영향을 미칩니다.`,
        career: `직업적 ${template.theme}의 시기입니다. ${themes.domain}과 관련된 기회가 있을 수 있습니다.`,
        health: `${element}의 에너지와 관련된 건강 사항에 주의하세요. ${template.theme}의 시기입니다.`,
        finance: `재정적으로 ${template.theme}의 시기입니다. ${suitName}의 특성에 맞게 접근하세요.`
      });
    });
  });

  return cards;
}

// 6개 스프레드 데이터
const spreads = [
  {
    name: '원카드',
    description: '간단한 질문에 대한 빠른 답변을 얻을 수 있는 가장 기본적인 스프레드입니다.',
    cardCount: 1,
    difficulty: 1,
    category: 'general',
    positions: JSON.stringify([
      { index: 0, name: '답변', description: '질문에 대한 직접적인 답변' }
    ])
  },
  {
    name: '쓰리카드',
    description: '과거, 현재, 미래의 흐름을 파악하는 클래식한 스프레드입니다.',
    cardCount: 3,
    difficulty: 2,
    category: 'general',
    positions: JSON.stringify([
      { index: 0, name: '과거', description: '상황의 배경, 과거의 영향' },
      { index: 1, name: '현재', description: '현재 상황, 당면한 문제' },
      { index: 2, name: '미래', description: '예상되는 결과, 미래 방향' }
    ])
  },
  {
    name: '켈틱 크로스',
    description: '가장 전통적이고 상세한 스프레드로, 복잡한 상황을 깊이 분석합니다.',
    cardCount: 10,
    difficulty: 4,
    category: 'general',
    positions: JSON.stringify([
      { index: 0, name: '현재 상황', description: '질문의 핵심, 현재 상태' },
      { index: 1, name: '도전/장애물', description: '가로막는 요소' },
      { index: 2, name: '의식', description: '의식적으로 인지하는 것' },
      { index: 3, name: '무의식', description: '무의식적 영향' },
      { index: 4, name: '과거', description: '최근 과거의 영향' },
      { index: 5, name: '가까운 미래', description: '곧 일어날 일' },
      { index: 6, name: '자신', description: '질문자의 태도' },
      { index: 7, name: '환경', description: '주변 환경과 타인의 영향' },
      { index: 8, name: '희망/두려움', description: '내면의 희망과 두려움' },
      { index: 9, name: '최종 결과', description: '궁극적인 결과' }
    ])
  },
  {
    name: '연애 스프레드',
    description: '연애와 관계에 특화된 스프레드로, 두 사람의 관계를 분석합니다.',
    cardCount: 5,
    difficulty: 3,
    category: 'love',
    positions: JSON.stringify([
      { index: 0, name: '나', description: '관계에서의 나의 상태' },
      { index: 1, name: '상대방', description: '상대방의 상태/감정' },
      { index: 2, name: '관계', description: '두 사람 사이의 관계' },
      { index: 3, name: '장애물', description: '관계의 장애 요소' },
      { index: 4, name: '조언', description: '관계 발전을 위한 조언' }
    ])
  },
  {
    name: '진로 스프레드',
    description: '커리어와 직업에 관한 결정을 도와주는 스프레드입니다.',
    cardCount: 6,
    difficulty: 3,
    category: 'career',
    positions: JSON.stringify([
      { index: 0, name: '현재 직업 상황', description: '현재 커리어 상태' },
      { index: 1, name: '강점', description: '활용할 수 있는 강점' },
      { index: 2, name: '약점', description: '개선이 필요한 부분' },
      { index: 3, name: '기회', description: '다가오는 기회' },
      { index: 4, name: '위협', description: '주의해야 할 위험' },
      { index: 5, name: '조언', description: '커리어 발전을 위한 조언' }
    ])
  },
  {
    name: '예/아니오',
    description: '단순한 예/아니오 질문에 대한 답을 구하는 스프레드입니다.',
    cardCount: 1,
    difficulty: 1,
    category: 'general',
    positions: JSON.stringify([
      { index: 0, name: '답변', description: '정방향은 예, 역방향은 아니오 또는 보류를 의미합니다' }
    ])
  }
];

async function main() {
  console.log('Seeding database...');

  // 기존 데이터 삭제
  await prisma.dailyCard.deleteMany();
  await prisma.readingCard.deleteMany();
  await prisma.reading.deleteMany();
  await prisma.userProgress.deleteMany();
  await prisma.spread.deleteMany();
  await prisma.card.deleteMany();

  // 메이저 아르카나 시드
  console.log('Seeding Major Arcana...');
  for (const card of majorArcana) {
    await prisma.card.create({
      data: {
        nameKo: card.nameKo,
        nameEn: card.nameEn,
        type: 'MAJOR',
        suit: null,
        number: card.number,
        imageUrl: `/images/cards/major-${card.number.toString().padStart(2, '0')}-${card.nameEn.toLowerCase().replace(/\s+/g, '-')}.jpg`,
        keywords: JSON.stringify(card.keywords),
        uprightMeaning: card.uprightMeaning,
        reversedMeaning: card.reversedMeaning,
        symbolism: card.symbolism,
        love: card.love,
        career: card.career,
        health: card.health,
        finance: card.finance
      }
    });
  }

  // 마이너 아르카나 시드
  console.log('Seeding Minor Arcana...');
  const minorCards = generateMinorArcana();
  for (const card of minorCards) {
    await prisma.card.create({
      data: {
        nameKo: card.nameKo,
        nameEn: card.nameEn,
        type: card.type,
        suit: card.suit,
        number: card.number,
        imageUrl: `/images/cards/minor-${card.suit.toLowerCase()}-${card.number.toString().padStart(2, '0')}.jpg`,
        keywords: JSON.stringify(card.keywords),
        uprightMeaning: card.uprightMeaning,
        reversedMeaning: card.reversedMeaning,
        symbolism: card.symbolism,
        love: card.love,
        career: card.career,
        health: card.health,
        finance: card.finance
      }
    });
  }

  // 스프레드 시드
  console.log('Seeding Spreads...');
  for (const spread of spreads) {
    await prisma.spread.create({
      data: spread
    });
  }

  console.log('Seeding completed!');
  console.log(`Created ${majorArcana.length} Major Arcana cards`);
  console.log(`Created ${minorCards.length} Minor Arcana cards`);
  console.log(`Created ${spreads.length} Spreads`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
