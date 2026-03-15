// tests/vectorUtils.test.js
// [Phase 4] 벡터 유사도 함수 단위 테스트
// Phase 4에서 vectorUtils.js 구현 후 아래 todo를 채울 것

// import는 Phase 4에서 vectorUtils.js 구현 후 활성화
// import { zScoreNormalize, cosineSimilarity, findTopSimilar } from '../src/similarity/vectorUtils.js';

describe('cosineSimilarity', () => {
  test.todo('동일 벡터 → 유사도 1');
  test.todo('직교 벡터 → 유사도 0');
  test.todo('영벡터 → 유사도 0');
});

describe('zScoreNormalize', () => {
  test.todo('정규화 후 평균 0, 표준편차 1');
  test.todo('null 값이 있어도 처리됨');
});

describe('findTopSimilar', () => {
  test.todo('상위 N개 유사 종목 반환');
  test.todo('존재하지 않는 ticker → 빈 배열 반환');
});