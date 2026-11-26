import express from 'express';
import { getEmployees, createEmployee, updateEmployee } from './employee.controller.js';
import { authenticate, hasPermission } from '../../middleware/auth.js';
import { PERMISSIONS } from '../../config/constants.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getEmployees);
router.post('/', hasPermission(PERMISSIONS.MANAGE_USERS), createEmployee);
router.put('/:id', hasPermission(PERMISSIONS.MANAGE_USERS), updateEmployee);

export default router;
