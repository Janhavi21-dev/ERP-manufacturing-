import express from 'express';
import {
  getStockOverview,
  getStockMovements,
  adjustStock,
  transferStock,
  reconcileStock,
  getReorderAlerts,
} from './inventory.controller.js';
import { authenticate, hasPermission } from '../../middleware/auth.js';
import { PERMISSIONS } from '../../config/constants.js';

const router = express.Router();

router.use(authenticate);

router.get('/overview', hasPermission(PERMISSIONS.VIEW_INVENTORY), getStockOverview);
router.get('/movements', hasPermission(PERMISSIONS.VIEW_INVENTORY), getStockMovements);
router.post('/adjustments', hasPermission(PERMISSIONS.ADJUST_INVENTORY), adjustStock);
router.post('/transfers', hasPermission(PERMISSIONS.TRANSFER_INVENTORY), transferStock);
router.get('/reconcile', hasPermission(PERMISSIONS.VIEW_INVENTORY), reconcileStock);
router.get('/reorder-alerts', hasPermission(PERMISSIONS.VIEW_INVENTORY), getReorderAlerts);

export default router;
