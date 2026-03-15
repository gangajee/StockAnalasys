// src/collectors/stockPrice.js
// yahoo-finance2 기반 주가 데이터 수집

import YahooFinance from 'yahoo-finance2';
import { insertCompany, updateCompanyInfo, insertStockPrice } from '../db/queries.js';
import { KOSPI_NAMES } from '../tickers.js';

const yf = new YahooFinance({ suppressNotices: ['ripHistorical', 'yahooSurvey'] });

export async function fetchAndSaveStockPrice(ticker) {
  // 5년치 주가 수집
  const period1 = new Date();
  period1.setFullYear(period1.getFullYear() - 5);

  const historical = await yf.chart(ticker, {
    period1: period1.toISOString().slice(0, 10),
    interval: '1d',
  });

  const quotes = historical.quotes;
  if (!quotes || quotes.length === 0) {
    console.warn(`[stockPrice] ${ticker}: 주가 데이터 없음`);
    return;
  }

  // companies 테이블에 종목 등록 후 name/sector/industry 업데이트
  // assetProfile 모듈에서 sector/industry를 가져옴
  const [quoteInfo, summary] = await Promise.all([
    yf.quote(ticker),
    yf.quoteSummary(ticker, { modules: ['assetProfile'] }).catch(() => null),
  ]);
  const companyInfo = {
    ticker,
    // 코스피 종목은 한국어 이름 우선, 없으면 야후 파이낸스 영문명 사용
    name:     KOSPI_NAMES[ticker] ?? quoteInfo.longName ?? quoteInfo.shortName ?? null,
    sector:   summary?.assetProfile?.sector   ?? null,
    industry: summary?.assetProfile?.industry ?? null,
  };
  insertCompany(companyInfo);
  updateCompanyInfo(companyInfo);

  let savedCount = 0;
  for (const row of quotes) {
    if (!row.close) continue;
    const result = insertStockPrice({
      ticker,
      date:   row.date.toISOString().slice(0, 10),
      open:   row.open   ?? null,
      high:   row.high   ?? null,
      low:    row.low    ?? null,
      close:  row.close,
      volume: row.volume ?? null,
    });
    if (result.changes > 0) savedCount++;
  }

  console.log(`[stockPrice] ${ticker}: ${savedCount}건 저장 (전체 ${quotes.length}건)`);
}
