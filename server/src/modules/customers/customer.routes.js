import express from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
} from './customer.controller.js';
import { authenticate, hasPermission } from '../../middleware/auth.js';
import { PERMISSIONS } from '../../config/constants.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.post('/', hasPermission(PERMISSIONS.MANAGE_CUSTOMERS), createCustomer);
router.put('/:id', hasPermission(PERMISSIONS.MANAGE_CUSTOMERS), updateCustomer);

export default router;
