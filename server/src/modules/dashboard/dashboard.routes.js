import express from 'express';
import { getDashboardMetrics } from './dashboard.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = express.Router();

router.use(authenticate);
router.get('/metrics', getDashboardMetrics);

export default router;
