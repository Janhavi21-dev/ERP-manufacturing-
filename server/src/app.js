import 'dotenv/config';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Detect client dist folder if frontend is built alongside server
const candidateDistPaths = [
  path.resolve(__dirname, '../../../client/dist'),
  path.resolve(process.cwd(), '../client/dist'),
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(process.cwd(), 'dist'),
];
const clientDistPath = candidateDistPaths.find((p) => fs.existsSync(p));

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
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://erp-manufacturing-1.onrender.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request logging in development
const nodeEnv = process.env.NODE_ENV || 'development';
if (nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// Health check endpoints (always returns JSON for Render, uptime monitors & load balancers)
app.get(['/health', '/api/v1/health'], (req, res) => {
  return ApiResponse.success(res, {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    env: nodeEnv,
  }, 'Manufacturing ERP API is running smoothly');
});

// Root endpoint:
// - Returns 200 JSON for API clients, Render health pings, or standalone backend deployments
// - Serves frontend index.html for browser visits when client build is present
app.get('/', (req, res) => {
  const wantsJson = req.headers.accept && req.headers.accept.includes('application/json');

  if (!wantsJson && clientDistPath) {
    return res.sendFile(path.join(clientDistPath, 'index.html'));
  }

  return ApiResponse.success(
    res,
    {
      name: 'Manufacturing ERP API',
      status: 'healthy',
      env: nodeEnv,
      timestamp: new Date().toISOString(),
      health: '/api/v1/health',
      version: '1.0.0',
    },
    'Manufacturing ERP API is active and operational'
  );
});

// Serve client static assets if built alongside server
if (clientDistPath) {
  app.use(express.static(clientDistPath, { index: false }));
}

// Helper to mount routes across standard prefix variations: /api/v1/..., /api/..., and direct /...
const mountModule = (pathSegment, router) => {
  app.use([`/api/v1/${pathSegment}`, `/api/${pathSegment}`, `/${pathSegment}`], router);
};

mountModule('auth', authRoutes);
mountModule('users', userRoutes);
mountModule('roles', roleRoutes);
mountModule('categories', categoryRoutes);
mountModule('units', unitRoutes);
mountModule('warehouses', warehouseRoutes);
mountModule('suppliers', supplierRoutes);
mountModule('customers', customerRoutes);
mountModule('products', productRoutes);
mountModule('inventory', inventoryRoutes);
mountModule('procurement', procurementRoutes);
mountModule('boms', bomRoutes);
mountModule('production', productionRoutes);
mountModule('quality', qualityRoutes);
mountModule('sales', salesRoutes);
mountModule('invoices', invoiceRoutes);
mountModule('payments', paymentRoutes);
mountModule('expenses', expenseRoutes);
mountModule('employees', employeeRoutes);
mountModule('dashboard', dashboardRoutes);
mountModule('reports', reportRoutes);
mountModule('notifications', notificationRoutes);
mountModule('audit-logs', auditLogRoutes);

// Serve SPA index.html for non-API client routes if frontend build is available
if (clientDistPath) {
  app.get('*', (req, res, next) => {
    if (req.headers.accept?.includes('application/json') || req.originalUrl.startsWith('/api')) {
      return next();
    }
    return res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Catch-all 404 handler for undefined API routes
app.use('*', (req, res, next) => {
  next(ApiError.notFound(`Endpoint not found: ${req.method} ${req.originalUrl}`));
});

// Centralized error handler
app.use(errorHandler);

export default app;
