import { apiSlice } from './apiSlice';

export const inventoryApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getStockOverview: builder.query({
      query: (params) => ({ url: '/inventory', params }),
      providesTags: ['Stock'],
    }),
    getStockMovements: builder.query({
      query: (params) => ({ url: '/inventory/movements', params }),
      providesTags: ['StockMovement'],
    }),
    getReorderAlerts: builder.query({
      query: () => '/inventory/reorder-alerts',
      providesTags: ['Stock'],
    }),
    createAdjustment: builder.mutation({
      query: (data) => ({ url: '/inventory/adjustments', method: 'POST', body: data }),
      invalidatesTags: ['Stock', 'StockMovement', 'Dashboard'],
    }),
    createTransfer: builder.mutation({
      query: (data) => ({ url: '/inventory/transfers', method: 'POST', body: data }),
      invalidatesTags: ['Stock', 'StockMovement'],
    }),
  }),
});

export const {
  useGetStockOverviewQuery,
  useGetStockMovementsQuery,
  useGetReorderAlertsQuery,
  useCreateAdjustmentMutation,
  useCreateTransferMutation,
} = inventoryApi;

export default inventoryApi;
