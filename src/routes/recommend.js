// src/routes/recommend.js
// [Phase 5] 유사 기업 추천 라우터
// TODO: GET /api/recommend/:ticker?top=5 구현

import { Router } from 'express';

const router = Router();

// TODO: GET /api/recommend/:ticker?top=5
router.get('/:ticker', async (req, res, next) => {});

export default router;