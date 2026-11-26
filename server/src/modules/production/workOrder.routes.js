import express from 'express';
import {
  getWorkOrders,
  getWorkOrderById,
  createWorkOrder,
  releaseWorkOrder,
  issueMaterials,
  reportProduction,
  completeWorkOrder,
} from './workOrder.controller.js';
import { authenticate, hasPermission } from '../../middleware/auth.js';
import { PERMISSIONS } from '../../config/constants.js';

const router = express.Router();

router.use(authenticate);

router.get('/', hasPermission(PERMISSIONS.VIEW_PRODUCTS), getWorkOrders);
router.get('/:id', hasPermission(PERMISSIONS.VIEW_PRODUCTS), getWorkOrderById);
router.post('/', hasPermission(PERMISSIONS.CREATE_WORK_ORDER), createWorkOrder);
router.post('/:id/release', hasPermission(PERMISSIONS.RELEASE_WORK_ORDER), releaseWorkOrder);
router.post('/:id/issue-materials', hasPermission(PERMISSIONS.EXECUTE_WORK_ORDER), issueMaterials);
router.post('/:id/report', hasPermission(PERMISSIONS.EXECUTE_WORK_ORDER), reportProduction);
router.post('/:id/complete', hasPermission(PERMISSIONS.EXECUTE_WORK_ORDER), completeWorkOrder);

export default router;
