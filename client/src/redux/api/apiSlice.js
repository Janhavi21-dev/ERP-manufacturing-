import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { logout } from '../authSlice';

const getBaseUrl = () => {
  let url = (import.meta.env.VITE_API_URL || '/api/v1').trim();
  url = url.replace(/\/+$/, '');
  if (!url.includes('/api')) {
    url = `${url}/api/v1`;
  } else if (url.endsWith('/api')) {
    url = `${url}/v1`;
  }
  return url;
};

const baseQuery = fetchBaseQuery({
  baseUrl: getBaseUrl(),
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions);
  if (result.error?.status === 401) {
    api.dispatch(logout());
  }
  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'User', 'Role', 'Product', 'Category', 'Unit', 'Warehouse',
    'Supplier', 'Customer', 'Stock', 'StockMovement',
    'Requisition', 'PurchaseOrder', 'GoodsReceipt',
    'BOM', 'WorkOrder', 'QualityInspection', 'Nonconformance',
    'SalesOrder', 'Dispatch', 'Invoice', 'Payment', 'Expense',
    'Employee', 'Notification', 'AuditLog', 'Dashboard', 'Report',
  ],
  endpoints: () => ({}),
});

export default apiSlice;
