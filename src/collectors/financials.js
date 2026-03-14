// src/collectors/financials.js
// [Phase 2] 재무제표 데이터 수집 모듈
// TODO: axios로 재무제표 API 호출 후 DB 삽입

import axios from 'axios';
import 'dotenv/config';

// TODO: 특정 종목의 재무제표 데이터를 API에서 가져와 DB에 저장
export async function fetchAndSaveFinancials(ticker) {
  // TODO: axios.get()으로 API 호출
  // TODO: 응답 데이터 파싱 (revenue, netIncome, totalAssets 등)
  // TODO: insertFinancials()로 DB 삽입
}