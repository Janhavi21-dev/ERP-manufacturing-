import { apiSlice } from './apiSlice';

export const warehouseApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getWarehouses: builder.query({
      query: (params) => ({ url: '/warehouses', params }),
      providesTags: ['Warehouse'],
    }),
    createWarehouse: builder.mutation({
      query: (data) => ({ url: '/warehouses', method: 'POST', body: data }),
      invalidatesTags: ['Warehouse'],
    }),
  }),
});

export const { useGetWarehousesQuery, useCreateWarehouseMutation } = warehouseApi;

export default warehouseApi;
