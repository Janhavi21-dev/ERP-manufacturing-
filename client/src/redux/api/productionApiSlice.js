import { apiSlice } from './apiSlice';

export const productionApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getWorkOrders: builder.query({
      query: (params) => ({ url: '/work-orders', params }),
      providesTags: ['WorkOrder'],
    }),
    createWorkOrder: builder.mutation({
      query: (data) => ({ url: '/work-orders', method: 'POST', body: data }),
      invalidatesTags: ['WorkOrder', 'Dashboard'],
    }),
    releaseWorkOrder: builder.mutation({
      query: (id) => ({ url: `/work-orders/${id}/release`, method: 'PATCH' }),
      invalidatesTags: ['WorkOrder', 'Stock'],
    }),
    issueMaterials: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/work-orders/${id}/issue-materials`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['WorkOrder', 'Stock', 'StockMovement'],
    }),
    reportProduction: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/work-orders/${id}/report`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['WorkOrder', 'Stock', 'StockMovement', 'Dashboard'],
    }),
  }),
});

export const {
  useGetWorkOrdersQuery,
  useCreateWorkOrderMutation,
  useReleaseWorkOrderMutation,
  useIssueMaterialsMutation,
  useReportProductionMutation,
} = productionApi;

export default productionApi;
