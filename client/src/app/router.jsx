import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../redux/authSlice';
import AppLayout from '../components/layout/AppLayout';
import LoginPage from '../features/auth/LoginPage';
import LoadingPage from '../components/ui/LoadingPage';

// Lazy-loaded pages
const DashboardPage       = lazy(() => import('../features/dashboard/DashboardPage'));
const ProductsPage        = lazy(() => import('../features/products/ProductsPage'));
const CategoriesPage      = lazy(() => import('../features/products/CategoriesPage'));
const UnitsPage           = lazy(() => import('../features/products/UnitsPage'));
const WarehousesPage      = lazy(() => import('../features/warehouses/WarehousesPage'));
const SuppliersPage       = lazy(() => import('../features/suppliers/SuppliersPage'));
const CustomersPage       = lazy(() => import('../features/customers/CustomersPage'));
const StockOverviewPage   = lazy(() => import('../features/inventory/StockOverviewPage'));
const StockMovementsPage  = lazy(() => import('../features/inventory/StockMovementsPage'));
const AdjustmentsPage     = lazy(() => import('../features/inventory/AdjustmentsPage'));
const ReorderAlertsPage   = lazy(() => import('../features/inventory/ReorderAlertsPage'));
const RequisitionsPage    = lazy(() => import('../features/procurement/RequisitionsPage'));
const PurchaseOrdersPage  = lazy(() => import('../features/procurement/PurchaseOrdersPage'));
const GoodsReceiptsPage   = lazy(() => import('../features/procurement/GoodsReceiptsPage'));
const BomsPage            = lazy(() => import('../features/bom/BomsPage'));
const WorkOrdersPage      = lazy(() => import('../features/production/WorkOrdersPage'));
const QualityPage         = lazy(() => import('../features/quality/QualityPage'));
const SalesOrdersPage     = lazy(() => import('../features/sales/SalesOrdersPage'));
const DispatchesPage      = lazy(() => import('../features/sales/DispatchesPage'));
const InvoicesPage        = lazy(() => import('../features/invoicing/InvoicesPage'));
const PaymentsPage        = lazy(() => import('../features/payments/PaymentsPage'));
const ExpensesPage        = lazy(() => import('../features/expenses/ExpensesPage'));
const ReportsPage         = lazy(() => import('../features/reports/ReportsPage'));
const UsersPage           = lazy(() => import('../features/users/UsersPage'));
const AuditLogsPage       = lazy(() => import('../features/audit/AuditLogsPage'));
const NotificationsPage   = lazy(() => import('../features/notifications/NotificationsPage'));
const ProfilePage         = lazy(() => import('../features/auth/ProfilePage'));
const NotFoundPage        = lazy(() => import('../components/ui/NotFoundPage'));

function ProtectedRoute() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function GuestRoute() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

const router = createBrowserRouter([
  {
    element: <GuestRoute />,
    children: [{ path: '/login', element: <LoginPage /> }],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: '/dashboard', element: <Suspense fallback={<LoadingPage />}><DashboardPage /></Suspense> },
          { path: '/products', element: <Suspense fallback={<LoadingPage />}><ProductsPage /></Suspense> },
          { path: '/categories', element: <Suspense fallback={<LoadingPage />}><CategoriesPage /></Suspense> },
          { path: '/units', element: <Suspense fallback={<LoadingPage />}><UnitsPage /></Suspense> },
          { path: '/warehouses', element: <Suspense fallback={<LoadingPage />}><WarehousesPage /></Suspense> },
          { path: '/suppliers', element: <Suspense fallback={<LoadingPage />}><SuppliersPage /></Suspense> },
          { path: '/customers', element: <Suspense fallback={<LoadingPage />}><CustomersPage /></Suspense> },
          { path: '/inventory', element: <Suspense fallback={<LoadingPage />}><StockOverviewPage /></Suspense> },
          { path: '/inventory/movements', element: <Suspense fallback={<LoadingPage />}><StockMovementsPage /></Suspense> },
          { path: '/inventory/adjustments', element: <Suspense fallback={<LoadingPage />}><AdjustmentsPage /></Suspense> },
          { path: '/inventory/reorder-alerts', element: <Suspense fallback={<LoadingPage />}><ReorderAlertsPage /></Suspense> },
          { path: '/procurement/requisitions', element: <Suspense fallback={<LoadingPage />}><RequisitionsPage /></Suspense> },
          { path: '/procurement/purchase-orders', element: <Suspense fallback={<LoadingPage />}><PurchaseOrdersPage /></Suspense> },
          { path: '/procurement/goods-receipts', element: <Suspense fallback={<LoadingPage />}><GoodsReceiptsPage /></Suspense> },
          { path: '/boms', element: <Suspense fallback={<LoadingPage />}><BomsPage /></Suspense> },
          { path: '/production/work-orders', element: <Suspense fallback={<LoadingPage />}><WorkOrdersPage /></Suspense> },
          { path: '/quality', element: <Suspense fallback={<LoadingPage />}><QualityPage /></Suspense> },
          { path: '/sales/orders', element: <Suspense fallback={<LoadingPage />}><SalesOrdersPage /></Suspense> },
          { path: '/sales/dispatches', element: <Suspense fallback={<LoadingPage />}><DispatchesPage /></Suspense> },
          { path: '/invoices', element: <Suspense fallback={<LoadingPage />}><InvoicesPage /></Suspense> },
          { path: '/payments', element: <Suspense fallback={<LoadingPage />}><PaymentsPage /></Suspense> },
          { path: '/expenses', element: <Suspense fallback={<LoadingPage />}><ExpensesPage /></Suspense> },
          { path: '/reports', element: <Suspense fallback={<LoadingPage />}><ReportsPage /></Suspense> },
          { path: '/users', element: <Suspense fallback={<LoadingPage />}><UsersPage /></Suspense> },
          { path: '/audit-logs', element: <Suspense fallback={<LoadingPage />}><AuditLogsPage /></Suspense> },
          { path: '/notifications', element: <Suspense fallback={<LoadingPage />}><NotificationsPage /></Suspense> },
          { path: '/profile', element: <Suspense fallback={<LoadingPage />}><ProfilePage /></Suspense> },
          { path: '*', element: <Suspense fallback={<LoadingPage />}><NotFoundPage /></Suspense> },
        ],
      },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
