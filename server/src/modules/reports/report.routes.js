import express from 'express';
import {
  getInventoryValuationReport,
  getProductionReport,
  getInvoiceAgingReport,
  getFinancialSummaryReport,
} from './report.controller.js';
import { authenticate, hasPermission } from '../../middleware/auth.js';
import { PERMISSIONS } from '../../config/constants.js';

const router = express.Router();

router.use(authenticate);

router.get('/inventory-valuation', hasPermission(PERMISSIONS.VIEW_REPORTS), getInventoryValuationReport);
router.get('/production-summary', hasPermission(PERMISSIONS.VIEW_REPORTS), getProductionReport);
router.get('/invoice-aging', hasPermission(PERMISSIONS.VIEW_REPORTS), getInvoiceAgingReport);
router.get('/financial-summary', hasPermission(PERMISSIONS.VIEW_FINANCIALS), getFinancialSummaryReport);

export default router;
