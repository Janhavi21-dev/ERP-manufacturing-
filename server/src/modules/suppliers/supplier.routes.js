import express from 'express';
import {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
} from './supplier.controller.js';
import { authenticate, hasPermission } from '../../middleware/auth.js';
import { PERMISSIONS } from '../../config/constants.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getSuppliers);
router.get('/:id', getSupplierById);
router.post('/', hasPermission(PERMISSIONS.MANAGE_SUPPLIERS), createSupplier);
router.put('/:id', hasPermission(PERMISSIONS.MANAGE_SUPPLIERS), updateSupplier);

export default router;
