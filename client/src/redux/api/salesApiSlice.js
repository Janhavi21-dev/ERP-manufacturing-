import { apiSlice } from './apiSlice';

export const salesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSalesOrders: builder.query({
      query: (params) => ({ url: '/sales/orders', params }),
      providesTags: ['SalesOrder'],
    }),
    createSalesOrder: builder.mutation({
      query: (data) => ({ url: '/sales/orders', method: 'POST', body: data }),
      invalidatesTags: ['SalesOrder', 'Dashboard'],
    }),
    approveSalesOrder: builder.mutation({
      query: (id) => ({ url: `/sales/orders/${id}/approve`, method: 'PATCH' }),
      invalidatesTags: ['SalesOrder'],
    }),
    getDispatches: builder.query({
      query: (params) => ({ url: '/sales/dispatches', params }),
      providesTags: ['Dispatch'],
    }),
    createDispatch: builder.mutation({
      query: (data) => ({ url: '/sales/dispatches', method: 'POST', body: data }),
      invalidatesTags: ['Dispatch', 'SalesOrder', 'Stock', 'StockMovement', 'Dashboard'],
    }),
  }),
});

export const {
  useGetSalesOrdersQuery,
  useCreateSalesOrderMutation,
  useApproveSalesOrderMutation,
  useGetDispatchesQuery,
  useCreateDispatchMutation,
} = salesApi;

export default salesApi;
