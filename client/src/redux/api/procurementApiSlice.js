import { apiSlice } from './apiSlice';

export const procurementApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getRequisitions: builder.query({
      query: (params) => ({ url: '/procurement/requisitions', params }),
      providesTags: ['Requisition'],
    }),
    createRequisition: builder.mutation({
      query: (data) => ({ url: '/procurement/requisitions', method: 'POST', body: data }),
      invalidatesTags: ['Requisition'],
    }),
    getPurchaseOrders: builder.query({
      query: (params) => ({ url: '/procurement/purchase-orders', params }),
      providesTags: ['PurchaseOrder'],
    }),
    createPurchaseOrder: builder.mutation({
      query: (data) => ({ url: '/procurement/purchase-orders', method: 'POST', body: data }),
      invalidatesTags: ['PurchaseOrder', 'Dashboard'],
    }),
    approvePurchaseOrder: builder.mutation({
      query: (id) => ({ url: `/procurement/purchase-orders/${id}/approve`, method: 'PATCH' }),
      invalidatesTags: ['PurchaseOrder'],
    }),
    getGoodsReceipts: builder.query({
      query: (params) => ({ url: '/procurement/goods-receipts', params }),
      providesTags: ['GoodsReceipt'],
    }),
    receiveGoods: builder.mutation({
      query: (data) => ({ url: '/procurement/goods-receipts', method: 'POST', body: data }),
      invalidatesTags: ['GoodsReceipt', 'PurchaseOrder', 'Stock', 'StockMovement', 'Dashboard'],
    }),
  }),
});

export const {
  useGetRequisitionsQuery,
  useCreateRequisitionMutation,
  useGetPurchaseOrdersQuery,
  useCreatePurchaseOrderMutation,
  useApprovePurchaseOrderMutation,
  useGetGoodsReceiptsQuery,
  useReceiveGoodsMutation,
} = procurementApi;

export default procurementApi;
