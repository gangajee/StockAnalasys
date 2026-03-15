// src/collectors/stockPrice.js
// [Phase 2] 주가 데이터 수집 모듈
// FMP API: GET /historical-price-eod/full?symbol=:ticker&apikey=...

import axios from 'axios';
import 'dotenv/config';
import { insertCompany, insertStockPrice } from '../db/queries.js';

const BASE_URL = process.env.API_BASE_URL;
const API_KEY  = process.env.API_KEY;

// [학습] async/await: 비동기 API 호출을 동기 코드처럼 읽히게 만듦
// [학습] try-catch: 네트워크 오류나 API 에러를 명시적으로 처리
export async function fetchAndSaveStockPrice(ticker) {
  const url = `${BASE_URL}/historical-price-eod/full?symbol=${ticker}&apikey=${API_KEY}`;

  const response = await axios.get(url);

  // 새 FMP API 응답 구조: 배열 직접 반환 [ { symbol, date, open, high, low, close, volume }, ... ]
  // (구 v3는 { symbol, historical: [...] } 래퍼가 있었음)
  const historical = response.data;
  if (!Array.isArray(historical) || historical.length === 0) {
    console.warn(`[stockPrice] ${ticker}: 주가 데이터 없음`);
    return;
  }

  // [학습] companies 테이블에 종목 먼저 등록 (OR IGNORE → 중복 시 건너뜀)
  insertCompany({ ticker, name: null, sector: null, industry: null });

  // [학습] for...of 로 순서 보장하며 순회 (forEach는 async와 조합 시 주의 필요)
  let savedCount = 0;
  for (const row of historical) {
    const result = insertStockPrice({
      ticker,
      date:   row.date,
      open:   row.open,
      high:   row.high,
      low:    row.low,
      close:  row.close,
      volume: row.volume,
    });
    // better-sqlite3의 .run()은 { changes } 객체 반환
    // changes === 1 이면 실제로 삽입됨, 0이면 OR IGNORE로 건너뜀
    if (result.changes > 0) savedCount++;
  }

  console.log(`[stockPrice] ${ticker}: ${savedCount}건 저장 (전체 ${historical.length}건)`);
}
