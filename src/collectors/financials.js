// src/collectors/financials.js
// yahoo-finance2 기반 재무제표 수집

import YahooFinance from 'yahoo-finance2';
import { insertCompany, insertFinancials } from '../db/queries.js';

const yf = new YahooFinance({ suppressNotices: ['ripHistorical', 'yahooSurvey'] });

export async function fetchAndSaveFinancials(ticker) {
  const period1 = '2020-01-01';

  const [finData, bsData] = await Promise.all([
    yf.fundamentalsTimeSeries(ticker, { module: 'financials',   type: 'annual', period1 }),
    yf.fundamentalsTimeSeries(ticker, { module: 'balance-sheet', type: 'annual', period1 }),
  ]);

  if (!finData || finData.length === 0) {
    console.warn(`[financials] ${ticker}: 재무제표 데이터 없음`);
    return;
  }

  insertCompany({ ticker, name: null, sector: null, industry: null });

  // balance-sheet를 날짜 기준으로 인덱싱
  const bsByDate = new Map(
    bsData.map((b) => [b.date.toISOString().slice(0, 10), b])
  );

  let savedCount = 0;
  for (const income of finData) {
    const dateKey = income.date.toISOString().slice(0, 10);
    const year    = income.date.getFullYear();
    const period  = `${year}FY`;

    // balance-sheet는 날짜가 다를 수 있으므로 가장 가까운 날짜 찾기
    const balance = bsByDate.get(dateKey) ?? findClosest(bsData, income.date);

    const result = insertFinancials({
      ticker,
      period,
      revenue:            income.totalRevenue         ?? null,
      net_income:         income.netIncome             ?? null,
      operating_income:   income.operatingIncome       ?? null,
      total_assets:       balance?.totalAssets         ?? null,
      total_equity:       balance?.commonStockEquity   ?? null,
      total_debt:         balance?.totalDebt           ?? null,
      shares_outstanding: income.basicAverageShares ?? income.dilutedAverageShares ?? balance?.ordinarySharesNumber ?? null,
    });

    if (result.changes > 0) savedCount++;
  }

  console.log(`[financials] ${ticker}: ${savedCount}건 저장 (전체 ${finData.length}건)`);
}

// 날짜 차이가 가장 작은 balance-sheet 항목 반환
function findClosest(bsData, targetDate) {
  if (!bsData || bsData.length === 0) return null;
  return bsData.reduce((closest, current) => {
    const curDiff  = Math.abs(current.date - targetDate);
    const bestDiff = Math.abs(closest.date  - targetDate);
    return curDiff < bestDiff ? current : closest;
  });
}
