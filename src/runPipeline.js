// src/runPipeline.js
// 수동 실행 스크립트: 수집 → 계산 → 저장 전체 파이프라인
// 사용법: node src/runPipeline.js

import 'dotenv/config';
import { fetchAndSaveStockPrice } from './collectors/stockPrice.js';
import { fetchAndSaveFinancials } from './collectors/financials.js';
import { calcAndSaveAllIndicators } from './calculators/saveIndicators.js';
import { ALL_TICKERS } from './tickers.js';

const BATCH_SIZE = 5;   // 동시 요청 수 (Yahoo Finance 부하 분산)
const DELAY_MS   = 1500; // 배치 간 대기 시간 (ms)

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 배열을 n개씩 나누기
function chunk(arr, n) {
  const result = [];
  for (let i = 0; i < arr.length; i += n) result.push(arr.slice(i, i + n));
  return result;
}

console.log(`=== 파이프라인 시작 ===`);
console.log(`대상 종목: ${ALL_TICKERS.length}개 (배치 ${BATCH_SIZE}개씩)\n`);

// Step 1: 배치별 수집
console.log('[Step 1] 데이터 수집 중...');
const batches = chunk(ALL_TICKERS, BATCH_SIZE);

for (let i = 0; i < batches.length; i++) {
  const batch = batches[i];
  console.log(`  배치 ${i + 1}/${batches.length}: ${batch.join(', ')}`);

  const results = await Promise.allSettled(
    batch.flatMap(ticker => [
      fetchAndSaveStockPrice(ticker),
      fetchAndSaveFinancials(ticker),
    ])
  );

  results.forEach((result, j) => {
    if (result.status === 'rejected') {
      const ticker = batch[Math.floor(j / 2)];
      const type   = j % 2 === 0 ? 'stockPrice' : 'financials';
      console.error(`  [실패] ${ticker} ${type}: ${result.reason?.message}`);
    }
  });

  // 마지막 배치가 아니면 잠깐 대기
  if (i < batches.length - 1) await sleep(DELAY_MS);
}

// Step 2: 지표 계산
console.log('\n[Step 2] 지표 계산 중...');
calcAndSaveAllIndicators();

console.log('\n=== 파이프라인 완료 ===');
