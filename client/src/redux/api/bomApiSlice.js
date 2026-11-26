import { apiSlice } from './apiSlice';

export const bomApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getBoms: builder.query({
      query: (params) => ({ url: '/boms', params }),
      providesTags: ['BOM'],
    }),
    createBom: builder.mutation({
      query: (data) => ({ url: '/boms', method: 'POST', body: data }),
      invalidatesTags: ['BOM'],
    }),
    checkShortage: builder.query({
      query: ({ bomId, quantity }) => `/boms/${bomId}/calculate-requirements?quantity=${quantity}`,
    }),
  }),
});

export const { useGetBomsQuery, useCreateBomMutation, useLazyCheckShortageQuery } = bomApi;

export default bomApi;
