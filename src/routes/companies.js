// src/routes/companies.js
// [Phase 5] 종목 관련 라우터
// TODO: GET /api/companies, GET /api/companies/:ticker, GET /api/sector/:sector, POST /api/screen 구현

import { Router } from 'express';

const router = Router();

// TODO: GET /api/companies
router.get('/', async (req, res, next) => {});

// TODO: GET /api/companies/:ticker
router.get('/:ticker', async (req, res, next) => {});

// TODO: GET /api/sector/:sector
// TODO: POST /api/screen

export default router;