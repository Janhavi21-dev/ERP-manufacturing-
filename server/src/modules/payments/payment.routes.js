import express from 'express';
import { getPayments, recordPayment } from './payment.controller.js';
import { authenticate, hasPermission } from '../../middleware/auth.js';
import { PERMISSIONS } from '../../config/constants.js';

const router = express.Router();

router.use(authenticate);

router.get('/', hasPermission(PERMISSIONS.VIEW_FINANCIALS), getPayments);
router.post('/', hasPermission(PERMISSIONS.RECORD_PAYMENTS), recordPayment);

export default router;
