// src/routes/companies.js
// [Phase 5] 종목 관련 라우터
//
// [학습] Router란?
//   Express 앱을 여러 파일로 나눌 때 사용하는 미니 앱
//   app.js에서 app.use('/api/companies', router)로 마운트

import { Router } from 'express';
import { getAllCompanies, getRecentPrices, getIndicators } from '../db/queries.js';

const router = Router();

// ─────────────────────────────────────────
// GET /api/companies
// 전체 종목 목록 + 최신 지표 반환
// ─────────────────────────────────────────
// [학습] next: 에러를 전역 에러 핸들러로 넘기는 함수
//   try-catch에서 catch(next)로 쓰면 에러 핸들링이 한 곳에서 관리됨
router.get('/', (_req, res, next) => {
  try {
    const companies = getAllCompanies();

    // 각 종목의 최신 지표를 함께 포함
    const result = companies.map((company) => {
      const indicators = getIndicators(company.ticker);
      return {
        ...company,
        latestIndicators: indicators[0] ?? null,
      };
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────
// GET /api/companies/:ticker
// 특정 종목 상세 조회 (최근 주가 + 지표 이력 포함)
// ─────────────────────────────────────────
// [학습] req.params: URL 경로의 :ticker 부분을 읽는 객체
// [학습] req.query:  ?limit=10 같은 쿼리스트링을 읽는 객체
router.get('/:ticker', (req, res, next) => {
  try {
    const ticker = req.params.ticker.toUpperCase();
    const priceLimit = parseInt(req.query.prices ?? '10', 10);

    const recentPrices = getRecentPrices(ticker, priceLimit);
    const indicators   = getIndicators(ticker);

    // 주가 데이터가 없으면 DB에 없는 종목으로 판단
    if (recentPrices.length === 0 && indicators.length === 0) {
      return res.status(404).json({ error: `${ticker} 데이터가 없습니다.` });
    }

    res.json({
      ticker,
      recentPrices,
      indicators,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
