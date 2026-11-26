import express from 'express';
import {
  getSalesOrders,
  getSalesOrderById,
  createSalesOrder,
  approveSalesOrder,
  createDispatch,
  getDispatches,
} from './sales.controller.js';
import { authenticate, hasPermission } from '../../middleware/auth.js';
import { PERMISSIONS } from '../../config/constants.js';

const router = express.Router();

router.use(authenticate);

// Sales Orders
router.get('/orders', hasPermission(PERMISSIONS.VIEW_PRODUCTS), getSalesOrders);
router.get('/orders/:id', hasPermission(PERMISSIONS.VIEW_PRODUCTS), getSalesOrderById);
router.post('/orders', hasPermission(PERMISSIONS.MANAGE_SALES_ORDERS), createSalesOrder);
router.post('/orders/:id/approve', hasPermission(PERMISSIONS.MANAGE_SALES_ORDERS), approveSalesOrder);

// Dispatches
router.get('/dispatches', hasPermission(PERMISSIONS.DISPATCH_GOODS), getDispatches);
router.post('/dispatches', hasPermission(PERMISSIONS.DISPATCH_GOODS), createDispatch);

export default router;
