import express from 'express';
import {
  getBOMs,
  getBOMById,
  createBOM,
  calculateRequirements,
} from './bom.controller.js';
import { authenticate, hasPermission } from '../../middleware/auth.js';
import { PERMISSIONS } from '../../config/constants.js';

const router = express.Router();

router.use(authenticate);

router.get('/', hasPermission(PERMISSIONS.VIEW_PRODUCTS), getBOMs);
router.get('/:id', hasPermission(PERMISSIONS.VIEW_PRODUCTS), getBOMById);
router.post('/', hasPermission(PERMISSIONS.MANAGE_BOM), createBOM);
router.post('/calculate-requirements', hasPermission(PERMISSIONS.VIEW_PRODUCTS), calculateRequirements);

export default router;
