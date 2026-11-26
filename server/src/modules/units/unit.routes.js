import express from 'express';
import { getUnits, createUnit } from './unit.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getUnits);
router.post('/', createUnit);

export default router;
