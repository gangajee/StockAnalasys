// scheduler.js
// [Phase 6] node-cron 스케줄러 — 매일 자정 자동 수집
//
// [학습] node-cron 크론 표현식: '초 분 시 일 월 요일'
//   '0 0 * * *' → 매일 00:00:00 실행
//   '0 9 * * 1-5' → 평일 오전 9시 실행 (주식 장 전 수집 시)

import 'dotenv/config';
import cron from 'node-cron';
import { fetchAndSaveStockPrice } from './src/collectors/stockPrice.js';
import { fetchAndSaveFinancials } from './src/collectors/financials.js';
import { calcAndSaveAllIndicators } from './src/calculators/saveIndicators.js';

const TICKERS = ['AAPL', 'MSFT', 'GOOGL'];

// ─────────────────────────────────────────
// 수집 + 계산 파이프라인
// ─────────────────────────────────────────
async function runPipeline() {
  const startedAt = new Date().toISOString();
  console.log(`\n[scheduler] 파이프라인 시작: ${startedAt}`);
  console.log(`[scheduler] 대상 종목: ${TICKERS.join(', ')}`);

  // Step 1: 주가 + 재무제표 병렬 수집
  // [학습] Promise.allSettled: Promise.all과 달리 하나가 실패해도 나머지를 계속 실행
  //   → 특정 종목 API 오류가 다른 종목 수집을 막지 않음
  console.log('[scheduler] Step 1: 데이터 수집 중...');
  const results = await Promise.allSettled(
    TICKERS.flatMap((ticker) => [
      fetchAndSaveStockPrice(ticker),
      fetchAndSaveFinancials(ticker),
    ])
  );

  // 실패한 작업 로그
  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      const ticker = TICKERS[Math.floor(i / 2)];
      const type   = i % 2 === 0 ? 'stockPrice' : 'financials';
      console.error(`[scheduler] 실패 — ${ticker} ${type}: ${result.reason?.message}`);
    }
  });

  // Step 2: 지표 계산 → DB 저장
  console.log('[scheduler] Step 2: 지표 계산 중...');
  calcAndSaveAllIndicators();

  console.log(`[scheduler] 파이프라인 완료: ${new Date().toISOString()}\n`);
}

// ─────────────────────────────────────────
// 크론 등록
// ─────────────────────────────────────────
// [학습] cron.schedule(표현식, 콜백, 옵션)
//   timezone 설정으로 서버가 UTC여도 한국 시간 기준으로 실행 가능
cron.schedule('0 0 * * *', runPipeline, {
  timezone: 'Asia/Seoul',
});

console.log('스케줄러 시작 — 매일 00:00 (KST) 자동 수집');
console.log('즉시 실행하려면: node -e "import(\'./scheduler.js\')" 대신 node src/runPipeline.js 사용\n');

// 프로세스가 종료되지 않도록 유지 (cron은 백그라운드에서 대기)
