import express from 'express';
import { getRoles, getPermissionsList, createRole, updateRole } from './role.controller.js';
import { authenticate, hasPermission } from '../../middleware/auth.js';
import { PERMISSIONS } from '../../config/constants.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getRoles);
router.get('/permissions', getPermissionsList);
router.post('/', hasPermission(PERMISSIONS.MANAGE_ROLES), createRole);
router.put('/:id', hasPermission(PERMISSIONS.MANAGE_ROLES), updateRole);

export default router;
