import express from 'express';
import { getAuditLogs } from './auditLog.controller.js';
import { authenticate, hasPermission } from '../../middleware/auth.js';
import { PERMISSIONS } from '../../config/constants.js';

const router = express.Router();

router.use(authenticate);
router.get('/', hasPermission(PERMISSIONS.VIEW_AUDIT_LOGS), getAuditLogs);

export default router;
