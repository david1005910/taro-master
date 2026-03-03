/**
 * Neo4j 연결 테스트 스크립트
 * 실행: npx ts-node scripts/test-neo4j.ts
 */
import dotenv from 'dotenv';
dotenv.config();

import neo4j from 'neo4j-driver';

async function testNeo4jConnection() {
  console.log('=== Neo4j 연결 테스트 ===\n');

  const uri = process.env.NEO4J_URI || '';
  const user = process.env.NEO4J_USER || 'neo4j';
  const password = process.env.NEO4J_PASSWORD || '';

  console.log('연결 정보:');
  console.log(`  URI: ${uri}`);
  console.log(`  User: ${user}`);
  console.log(`  Password: ${password ? '설정됨 (' + password.slice(0, 10) + '...)' : '미설정'}`);
  console.log('');

  if (!password) {
    console.error('❌ NEO4J_PASSWORD가 설정되지 않았습니다.');
    process.exit(1);
  }

  let driver;
  try {
    console.log('1. Driver 생성 중...');
    driver = neo4j.driver(
      uri,
      neo4j.auth.basic(user, password),
      {
        connectionTimeout: 30000,  // 30초로 증가
        maxConnectionLifetime: 3600000,
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 60000
      }
    );
    console.log('✓ Driver 생성 성공\n');

    console.log('2. 연결 확인 중... (최대 30초)');
    await driver.verifyConnectivity();
    console.log('✓ 연결 성공!\n');

    console.log('3. 서버 정보 조회 중...');
    const serverInfo = await driver.getServerInfo();
    console.log('서버 정보:');
    console.log(`  주소: ${serverInfo.address}`);
    console.log(`  버전: ${serverInfo.agent}`);
    console.log('');

    console.log('4. 간단한 쿼리 실행 중...');
    const session = driver.session();
    try {
      const result = await session.run('RETURN 1 as num');
      console.log('✓ 쿼리 실행 성공:', result.records[0].get('num'));
      console.log('');

      console.log('5. 데이터베이스 노드 수 확인...');
      const countResult = await session.run('MATCH (n) RETURN count(n) as count');
      const nodeCount = countResult.records[0].get('count').toNumber();
      console.log(`✓ 총 노드 수: ${nodeCount}개\n`);

      if (nodeCount === 0) {
        console.warn('⚠️  경고: 데이터베이스가 비어 있습니다.');
        console.log('   서버 시작 시 자동으로 타로 카드 데이터가 시딩됩니다.\n');
      }
    } finally {
      await session.close();
    }

    console.log('✅ 모든 테스트 통과! Neo4j 연결 정상입니다.\n');

  } catch (error: any) {
    console.error('\n❌ Neo4j 연결 실패:\n');
    console.error('에러 타입:', error.name);
    console.error('에러 메시지:', error.message);
    console.error('');

    if (error.code === 'ServiceUnavailable') {
      console.error('💡 해결 방법:');
      console.error('   1. Neo4j Aura 인스턴스가 실행 중인지 확인');
      console.error('      → https://console.neo4j.io/ 접속');
      console.error('      → Taro_master 인스턴스 상태 확인');
      console.error('   2. 인스턴스가 중지되었다면 "Resume" 클릭');
      console.error('   3. 인스턴스가 삭제되었다면 새로 생성');
      console.error('');
    } else if (error.code === 'Neo.ClientError.Security.Unauthorized') {
      console.error('💡 해결 방법:');
      console.error('   비밀번호가 잘못되었습니다. .env 파일 확인:');
      console.error('   NEO4J_PASSWORD="..."');
      console.error('');
    } else if (error.message.includes('Could not perform discovery')) {
      console.error('💡 해결 방법:');
      console.error('   Neo4j Aura 인스턴스를 찾을 수 없습니다.');
      console.error('   1. https://console.neo4j.io/ 접속');
      console.error('   2. 인스턴스 상태 확인 (Running/Stopped/Deleted)');
      console.error('   3. URI가 변경되었는지 확인');
      console.error('      현재 URI: ' + uri);
      console.error('');
    }

    console.error('대안:');
    console.error('  - Neo4j 없이도 서버는 정상 작동합니다.');
    console.error('  - 그래프 기능만 비활성화됩니다.');
    console.error('  - 사주-타로 연동 기능이 제한됩니다.\n');

    process.exit(1);
  } finally {
    if (driver) {
      await driver.close();
      console.log('Driver 종료됨');
    }
  }
}

testNeo4jConnection()
  .catch((e) => {
    console.error('예상치 못한 오류:', e);
    process.exit(1);
  });
