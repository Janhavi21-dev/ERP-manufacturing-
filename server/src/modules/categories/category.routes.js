import express from 'express';
import { getCategories, createCategory, updateCategory } from './category.controller.js';
import { authenticate, hasPermission } from '../../middleware/auth.js';
import { PERMISSIONS } from '../../config/constants.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getCategories);
router.post('/', hasPermission(PERMISSIONS.MANAGE_CATEGORIES), createCategory);
router.put('/:id', hasPermission(PERMISSIONS.MANAGE_CATEGORIES), updateCategory);

export default router;
