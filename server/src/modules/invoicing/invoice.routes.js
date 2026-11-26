import express from 'express';
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  postInvoice,
  voidInvoice,
} from './invoice.controller.js';
import { authenticate, hasPermission } from '../../middleware/auth.js';
import { PERMISSIONS } from '../../config/constants.js';

const router = express.Router();

router.use(authenticate);

router.get('/', hasPermission(PERMISSIONS.MANAGE_INVOICES), getInvoices);
router.get('/:id', hasPermission(PERMISSIONS.MANAGE_INVOICES), getInvoiceById);
router.post('/', hasPermission(PERMISSIONS.MANAGE_INVOICES), createInvoice);
router.post('/:id/post', hasPermission(PERMISSIONS.POST_INVOICE), postInvoice);
router.post('/:id/void', hasPermission(PERMISSIONS.POST_INVOICE), voidInvoice);

export default router;
