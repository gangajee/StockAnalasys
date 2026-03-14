// src/collectors/stockPrice.js
// [Phase 2] 주가 데이터 수집 모듈
// TODO: axios로 주가 API 호출 후 DB 삽입

import axios from 'axios';
import 'dotenv/config';

// TODO: 특정 종목의 주가 데이터를 API에서 가져와 DB에 저장
export async function fetchAndSaveStockPrice(ticker) {
  // TODO: axios.get()으로 API 호출
  // TODO: 응답 데이터 파싱
  // TODO: insertStockPrice()로 DB 삽입
}