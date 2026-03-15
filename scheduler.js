// scheduler.js
// node-cron 스케줄러 — 매일 자정 자동 수집

import 'dotenv/config';
import cron from 'node-cron';
import { fetchAndSaveStockPrice } from './src/collectors/stockPrice.js';
import { fetchAndSaveFinancials } from './src/collectors/financials.js';
import { calcAndSaveAllIndicators } from './src/calculators/saveIndicators.js';
import { ALL_TICKERS } from './src/tickers.js';

const BATCH_SIZE = 5;
const DELAY_MS   = 1500;

const sleep = ms => new Promise(r => setTimeout(r, ms));
const chunk = (arr, n) => {
  const r = [];
  for (let i = 0; i < arr.length; i += n) r.push(arr.slice(i, i + n));
  return r;
};

async function runPipeline() {
  console.log(`\n[scheduler] 파이프라인 시작: ${new Date().toISOString()}`);
  console.log(`[scheduler] 대상 종목: ${ALL_TICKERS.length}개`);

  console.log('[scheduler] Step 1: 데이터 수집 중...');
  const batches = chunk(ALL_TICKERS, BATCH_SIZE);

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
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
        console.error(`[scheduler] 실패 — ${ticker} ${type}: ${result.reason?.message}`);
      }
    });

    if (i < batches.length - 1) await sleep(DELAY_MS);
  }

  console.log('[scheduler] Step 2: 지표 계산 중...');
  calcAndSaveAllIndicators();

  console.log(`[scheduler] 파이프라인 완료: ${new Date().toISOString()}\n`);
}

cron.schedule('0 0 * * *', runPipeline, { timezone: 'Asia/Seoul' });

console.log('스케줄러 시작 — 매일 00:00 (KST) 자동 수집');
console.log(`대상 종목: ${ALL_TICKERS.length}개\n`);
