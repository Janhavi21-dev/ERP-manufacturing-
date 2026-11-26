import express from 'express';
import { login, logout, getMe, changePassword, updateProfile } from './auth.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { authLimiter } from '../../middleware/rateLimiter.js';
import { loginSchema, changePasswordSchema, updateProfileSchema } from './auth.validation.js';

const router = express.Router();

router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/logout', logout);

// Protected routes
router.use(authenticate);
router.get('/me', getMe);

// Profile routes
router.put('/profile', validate(updateProfileSchema), updateProfile);
router.put('/update-profile', validate(updateProfileSchema), updateProfile);

// Password routes
router.put('/password', validate(changePasswordSchema), changePassword);
router.post('/change-password', validate(changePasswordSchema), changePassword);
router.put('/change-password', validate(changePasswordSchema), changePassword);

export default router;
