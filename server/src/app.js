import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
import { errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { ApiError } from './utils/apiError.js';
import { ApiResponse } from './utils/apiResponse.js';

// Route imports
import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/users/user.routes.js';
import roleRoutes from './modules/roles/role.routes.js';
import categoryRoutes from './modules/categories/category.routes.js';
import unitRoutes from './modules/units/unit.routes.js';
import warehouseRoutes from './modules/warehouses/warehouse.routes.js';
import supplierRoutes from './modules/suppliers/supplier.routes.js';
import customerRoutes from './modules/customers/customer.routes.js';
import productRoutes from './modules/products/product.routes.js';
import inventoryRoutes from './modules/inventory/inventory.routes.js';
import procurementRoutes from './modules/procurement/procurement.routes.js';
import bomRoutes from './modules/bills-of-materials/bom.routes.js';
import productionRoutes from './modules/production/workOrder.routes.js';
import qualityRoutes from './modules/quality/quality.routes.js';
import salesRoutes from './modules/sales/sales.routes.js';
import invoiceRoutes from './modules/invoicing/invoice.routes.js';
import paymentRoutes from './modules/payments/payment.routes.js';
import expenseRoutes from './modules/expenses/expense.routes.js';
import employeeRoutes from './modules/employees/employee.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import reportRoutes from './modules/reports/report.routes.js';
import notificationRoutes from './modules/notifications/notification.routes.js';
import auditLogRoutes from './modules/audit-logs/auditLog.routes.js';

const app = express();

// Security HTTP headers
app.use(helmet());

// Cross-origin resource sharing
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow localhost and specified client origin, and requests with no origin (curl/mobile)
      if (!origin || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:') || origin === clientUrl) {
        callback(null, true);
      } else {
        callback(new Error('CORS Not Allowed'));
      }
    },
    credentials: true,
  })
);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request logging in development
const nodeEnv = process.env.NODE_ENV || 'development';
if (nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// Global API Rate Limiter
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  return ApiResponse.success(res, {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    env: nodeEnv,
  }, 'Manufacturing ERP API is running smoothly');
});

// Mount module routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/roles', roleRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/units', unitRoutes);
app.use('/api/v1/warehouses', warehouseRoutes);
app.use('/api/v1/suppliers', supplierRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/procurement', procurementRoutes);
app.use('/api/v1/boms', bomRoutes);
app.use('/api/v1/production', productionRoutes);
app.use('/api/v1/quality', qualityRoutes);
app.use('/api/v1/sales', salesRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/expenses', expenseRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/audit-logs', auditLogRoutes);

// Catch-all 404 handler for undefined API routes
app.use('*', (req, res, next) => {
  next(ApiError.notFound(`Endpoint not found: ${req.method} ${req.originalUrl}`));
});

// Centralized error handler
app.use(errorHandler);

export default app;
