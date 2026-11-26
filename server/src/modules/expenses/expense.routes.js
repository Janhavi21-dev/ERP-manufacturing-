import express from 'express';
import { getExpenses, createExpense } from './expense.controller.js';
import { authenticate, hasPermission } from '../../middleware/auth.js';
import { PERMISSIONS } from '../../config/constants.js';

const router = express.Router();

router.use(authenticate);

router.get('/', hasPermission(PERMISSIONS.VIEW_FINANCIALS), getExpenses);
router.post('/', hasPermission(PERMISSIONS.MANAGE_EXPENSES), createExpense);

export default router;
