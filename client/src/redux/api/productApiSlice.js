import { apiSlice } from './apiSlice';

export const productApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query({
      query: (params) => ({
        url: '/products',
        params,
      }),
      providesTags: ['Product'],
    }),
    getProductById: builder.query({
      query: (id) => `/products/${id}`,
      providesTags: ['Product'],
    }),
    createProduct: builder.mutation({
      query: (data) => ({
        url: '/products',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Product', 'Stock'],
    }),
    updateProduct: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/products/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Product'],
    }),
    toggleProductStatus: builder.mutation({
      query: (id) => ({
        url: `/products/${id}/toggle-status`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Product'],
    }),
    getCategories: builder.query({
      query: (params) => ({ url: '/categories', params }),
      providesTags: ['Category'],
    }),
    createCategory: builder.mutation({
      query: (data) => ({ url: '/categories', method: 'POST', body: data }),
      invalidatesTags: ['Category'],
    }),
    getUnits: builder.query({
      query: (params) => ({ url: '/units', params }),
      providesTags: ['Unit'],
    }),
    createUnit: builder.mutation({
      query: (data) => ({ url: '/units', method: 'POST', body: data }),
      invalidatesTags: ['Unit'],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductByIdQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useToggleProductStatusMutation,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useGetUnitsQuery,
  useCreateUnitMutation,
} = productApi;

export default productApi;
