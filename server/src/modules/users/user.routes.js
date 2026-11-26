import express from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  toggleUserStatus,
} from './user.controller.js';
import { authenticate, hasPermission } from '../../middleware/auth.js';
import { PERMISSIONS } from '../../config/constants.js';

const router = express.Router();

router.use(authenticate);

router.get('/', hasPermission(PERMISSIONS.MANAGE_USERS), getUsers);
router.post('/', hasPermission(PERMISSIONS.MANAGE_USERS), createUser);
router.get('/:id', hasPermission(PERMISSIONS.MANAGE_USERS), getUserById);
router.put('/:id', hasPermission(PERMISSIONS.MANAGE_USERS), updateUser);
router.patch('/:id/toggle-status', hasPermission(PERMISSIONS.MANAGE_USERS), toggleUserStatus);

export default router;
