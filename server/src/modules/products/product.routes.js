import express from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  toggleProductStatus,
} from './product.controller.js';
import { authenticate, hasPermission } from '../../middleware/auth.js';
import { PERMISSIONS } from '../../config/constants.js';

const router = express.Router();

router.use(authenticate);

router.get('/', hasPermission(PERMISSIONS.VIEW_PRODUCTS), getProducts);
router.post('/', hasPermission(PERMISSIONS.MANAGE_PRODUCTS), createProduct);
router.get('/:id', hasPermission(PERMISSIONS.VIEW_PRODUCTS), getProductById);
router.put('/:id', hasPermission(PERMISSIONS.MANAGE_PRODUCTS), updateProduct);
router.patch('/:id/toggle-status', hasPermission(PERMISSIONS.MANAGE_PRODUCTS), toggleProductStatus);

export default router;
