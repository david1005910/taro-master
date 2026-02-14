const http = require('http');

function post(path, data, token) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const headers = { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const req = http.request({ hostname: 'localhost', port: 4000, path, method: 'POST', headers }, (res) => {
      let result = '';
      res.on('data', d => result += d);
      res.on('end', () => resolve(JSON.parse(result)));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

(async () => {
  // 1. 로그인
  const login = await post('/api/auth/login', { email: 'test2@test.com', password: 'Test1234@abc' });
  if (!login.success) { console.log('로그인 실패:', JSON.stringify(login)); return; }
  console.log('1. 로그인 성공\n');
  const token = login.data.accessToken;

  // 2. 사주 분석
  const result = await post('/api/saju', {
    name: '홍길동', birthDate: '1990-05-15', birthTime: '14:00', isLunar: false, gender: 'male'
  }, token);

  if (!result.success) { console.log('사주 분석 실패:', JSON.stringify(result).substring(0, 500)); return; }
  const r = result.data;
  console.log('2. 사주 분석 성공\n');

  console.log('========================================');
  console.log('      홍길동 사주팔자 분석 결과');
  console.log('========================================\n');

  console.log('【사주 원국】');
  console.log('  구분   천간   지지');
  console.log('  년주    ' + r.yearStem + '     ' + r.yearBranch);
  console.log('  월주    ' + r.monthStem + '     ' + r.monthBranch);
  console.log('  일주    ' + r.dayStem + '     ' + r.dayBranch);
  console.log('  시주    ' + r.hourStem + '     ' + r.hourBranch);
  console.log('');

  // 오행 분포
  console.log('【오행 분포】');
  const elements = { '목(木)': r.woodCount, '화(火)': r.fireCount, '토(土)': r.earthCount, '금(金)': r.metalCount, '수(水)': r.waterCount };
  Object.entries(elements).forEach(([name, count]) => {
    console.log('  ' + name + ': ' + '■'.repeat(count) + '□'.repeat(5 - count) + ' ' + count);
  });
  console.log('');

  const adv = r.advancedAnalysis;
  if (!adv) { console.log('고급 분석 데이터 없음'); return; }

  // 십성
  console.log('【십성(十星) 분석】');
  const tg = adv.tenGods;
  console.log('  년주: ' + tg.yearStemGod + ' / ' + tg.yearBranchGod);
  console.log('  월주: ' + tg.monthStemGod + ' / ' + tg.monthBranchGod);
  console.log('  일주: 일간(본인) / ' + tg.dayBranchGod);
  console.log('  시주: ' + tg.hourStemGod + ' / ' + tg.hourBranchGod);
  const counts = Object.entries(tg.godCounts).filter(([,v]) => v > 0).map(([k,v]) => k + ':' + v).join(', ');
  console.log('  십성 분포: ' + counts);
  console.log('');

  // 신강신약
  console.log('【신강신약(身強身弱) 판정】');
  const str = adv.strength;
  console.log('  판정: ' + str.level);
  console.log('  설명: ' + str.description);
  console.log('  용신(用神): ' + str.yongshin);
  console.log('  기신(忌神): ' + str.gisin);
  console.log('');

  // 격국
  console.log('【격국(格局)】');
  console.log('  ' + adv.geokguk.name);
  console.log('  설명: ' + adv.geokguk.description);
  console.log('  특성: ' + adv.geokguk.traits);
  console.log('');

  // 십이운성
  console.log('【십이운성(十二運星)】');
  const ts = adv.twelveStages;
  const stageEnergy = { '장생': 8, '목욕': 5, '관대': 7, '건록': 9, '제왕': 10, '쇠': 4, '병': 3, '사': 2, '묘': 1, '절': 0, '태': 3, '양': 6 };
  const labels = ['년', '월', '일', '시'];
  const keys = ['year', 'month', 'day', 'hour'];
  keys.forEach((k, i) => {
    const stage = ts[k + 'Stage'];
    const e = stageEnergy[stage] || 5;
    const stars = '★'.repeat(e) + '☆'.repeat(10 - e);
    console.log('  ' + labels[i] + '주: ' + stage + '  ' + stars);
  });
  console.log('  종합 에너지: ' + ts.overallEnergy + '/12');
  console.log('');

  // 신살
  console.log('【신살(神殺)】');
  if (adv.spiritStars.length > 0) {
    adv.spiritStars.forEach(s => {
      const icon = s.type === '길신' ? '[길]' : s.type === '흉신' ? '[흉]' : '[중]';
      console.log('  ' + icon + ' ' + s.name + ' (' + s.pillar + '주) - ' + s.description);
    });
  } else {
    console.log('  특별한 신살 없음');
  }

  console.log('\n========================================');
  console.log('        모든 분석 완료!');
  console.log('========================================');
})();
