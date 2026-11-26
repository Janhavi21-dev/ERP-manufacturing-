import { apiSlice } from './apiSlice';

export const partnerApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSuppliers: builder.query({
      query: (params) => ({ url: '/suppliers', params }),
      providesTags: ['Supplier'],
    }),
    createSupplier: builder.mutation({
      query: (data) => ({ url: '/suppliers', method: 'POST', body: data }),
      invalidatesTags: ['Supplier'],
    }),
    getCustomers: builder.query({
      query: (params) => ({ url: '/customers', params }),
      providesTags: ['Customer'],
    }),
    createCustomer: builder.mutation({
      query: (data) => ({ url: '/customers', method: 'POST', body: data }),
      invalidatesTags: ['Customer'],
    }),
  }),
});

export const {
  useGetSuppliersQuery,
  useCreateSupplierMutation,
  useGetCustomersQuery,
  useCreateCustomerMutation,
} = partnerApi;

export default partnerApi;
