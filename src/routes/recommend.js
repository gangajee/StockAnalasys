// src/routes/recommend.js
// [Phase 5] 유사 기업 추천 라우터
//
// GET /api/recommend/:ticker?top=5
// → DB의 calculated_indicators를 벡터화해서 유사도 상위 N개 반환

import { Router } from 'express';
import { getIndicators, getCompany } from '../db/queries.js';
import { zScoreNormalize, findTopSimilar } from '../similarity/vectorUtils.js';

const router = Router();

// ─────────────────────────────────────────
// GET /api/recommend/:ticker?top=5
// ─────────────────────────────────────────
// [학습] 전체 흐름:
//   1. DB에서 모든 종목의 지표 조회
//   2. z-score 정규화 → 벡터 맵 생성
//   3. 대상 종목과 코사인 유사도 계산
//   4. 상위 N개 반환
router.get('/:ticker', (req, res, next) => {
  try {
    const ticker = req.params.ticker.toUpperCase();
    const topN   = parseInt(req.query.top ?? '5', 10);

    // 전체 종목 지표 (최신 period만 — 각 ticker의 마지막 행)
    const allRows = getIndicators();
    if (allRows.length === 0) {
      return res.status(404).json({ error: '지표 데이터가 없습니다. 파이프라인을 먼저 실행하세요.' });
    }

    // ticker별로 최신 period 하나만 사용
    // [학습] Map으로 중복 제거: 같은 ticker가 여러 period로 있을 때 마지막(최신) 것만 유지
    const latestByTicker = new Map();
    for (const row of allRows) {
      latestByTicker.set(row.ticker, row);
    }
    const latestRows = Array.from(latestByTicker.values());

    // 대상 종목이 DB에 있는지 확인
    if (!latestByTicker.has(ticker)) {
      return res.status(404).json({ error: `${ticker} 지표 데이터가 없습니다.` });
    }

    const vectorMap = zScoreNormalize(latestRows);
    const similar   = findTopSimilar(ticker, vectorMap, topN).map(s => ({
      ...s,
      name: getCompany(s.ticker)?.name ?? null,
    }));

    res.json({ ticker, similar });
  } catch (err) {
    next(err);
  }
});

export default router;
