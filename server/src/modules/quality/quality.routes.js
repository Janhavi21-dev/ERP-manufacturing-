import express from 'express';
import {
  getInspections,
  getInspectionById,
  createInspection,
  getNonconformances,
  updateNonconformance,
} from './quality.controller.js';
import { authenticate, hasPermission } from '../../middleware/auth.js';
import { PERMISSIONS } from '../../config/constants.js';

const router = express.Router();

router.use(authenticate);

// Quality Inspections
router.get('/inspections', hasPermission(PERMISSIONS.PERFORM_INSPECTION), getInspections);
router.get('/inspections/:id', hasPermission(PERMISSIONS.PERFORM_INSPECTION), getInspectionById);
router.post('/inspections', hasPermission(PERMISSIONS.PERFORM_INSPECTION), createInspection);

// Nonconformance Records (NCR)
router.get('/nonconformances', hasPermission(PERMISSIONS.PERFORM_INSPECTION), getNonconformances);
router.put('/nonconformances/:id', hasPermission(PERMISSIONS.APPROVE_QUALITY), updateNonconformance);

export default router;
