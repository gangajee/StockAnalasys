// src/runPipeline.js
// [Phase 3] 수동 실행 스크립트: 수집 → 계산 → 저장 전체 파이프라인
//
// 사용법: node src/runPipeline.js
// [학습] 이 파일은 프로덕션 코드가 아닌 개발/테스트용 실행 진입점

import 'dotenv/config';
import { fetchAndSaveStockPrice } from './collectors/stockPrice.js';
import { fetchAndSaveFinancials } from './collectors/financials.js';
import { calcAndSaveAllIndicators } from './calculators/saveIndicators.js';

const TICKERS = ['AAPL', 'MSFT', 'GOOGL'];

console.log('=== 파이프라인 시작 ===');
console.log('대상 종목:', TICKERS.join(', '));

// Step 1: 주가 + 재무제표 수집 (병렬)
console.log('\n[Step 1] 데이터 수집 중...');
await Promise.all(
  TICKERS.flatMap((ticker) => [
    fetchAndSaveStockPrice(ticker),
    fetchAndSaveFinancials(ticker),
  ])
);

// Step 2: 지표 계산 → DB 저장
console.log('\n[Step 2] 지표 계산 중...');
calcAndSaveAllIndicators();

console.log('\n=== 파이프라인 완료 ===');
