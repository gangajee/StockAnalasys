// scheduler.js
// [Phase 6] node-cron 스케줄러
// TODO: 매일 자정 데이터 수집 자동화

import cron from 'node-cron';

// TODO: 수집 대상 종목 목록 정의
const TICKERS = ['AAPL', 'MSFT', 'GOOGL'];

// TODO: 매일 자정(0 0 * * *)에 실행
cron.schedule('0 0 * * *', async () => {
  console.log('데이터 수집 시작:', new Date().toISOString());
  // TODO: Promise.all()로 여러 종목 병렬 수집
});