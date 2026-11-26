import express from 'express';
import { getWarehouses, createWarehouse, updateWarehouse } from './warehouse.controller.js';
import { authenticate, hasPermission } from '../../middleware/auth.js';
import { PERMISSIONS } from '../../config/constants.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getWarehouses);
router.post('/', hasPermission(PERMISSIONS.MANAGE_WAREHOUSES), createWarehouse);
router.put('/:id', hasPermission(PERMISSIONS.MANAGE_WAREHOUSES), updateWarehouse);

export default router;
