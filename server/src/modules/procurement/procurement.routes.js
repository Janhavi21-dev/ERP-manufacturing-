import express from 'express';
import {
  getRequisitions,
  createRequisition,
  approveRequisition,
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  approvePurchaseOrder,
  receiveGoods,
  getGoodsReceipts,
} from './procurement.controller.js';
import { authenticate, hasPermission } from '../../middleware/auth.js';
import { PERMISSIONS } from '../../config/constants.js';

const router = express.Router();

router.use(authenticate);

// Requisitions
router.get('/requisitions', getRequisitions);
router.post('/requisitions', createRequisition);
router.post('/requisitions/:id/approve', hasPermission(PERMISSIONS.APPROVE_PURCHASE_ORDER), approveRequisition);

// Purchase Orders
router.get('/orders', getPurchaseOrders);
router.get('/orders/:id', getPurchaseOrderById);
router.post('/orders', hasPermission(PERMISSIONS.CREATE_PURCHASE_ORDER), createPurchaseOrder);
router.post('/orders/:id/approve', hasPermission(PERMISSIONS.APPROVE_PURCHASE_ORDER), approvePurchaseOrder);

// Goods Receipts
router.get('/receipts', getGoodsReceipts);
router.post('/receive', hasPermission(PERMISSIONS.RECEIVE_GOODS), receiveGoods);

export default router;
