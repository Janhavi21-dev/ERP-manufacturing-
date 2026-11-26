import { apiSlice } from './apiSlice';

export const qualityApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getInspections: builder.query({
      query: (params) => ({ url: '/quality/inspections', params }),
      providesTags: ['QualityInspection'],
    }),
    createInspection: builder.mutation({
      query: (data) => ({ url: '/quality/inspections', method: 'POST', body: data }),
      invalidatesTags: ['QualityInspection', 'Dashboard'],
    }),
    getNonconformances: builder.query({
      query: (params) => ({ url: '/quality/nonconformances', params }),
      providesTags: ['Nonconformance'],
    }),
    createNonconformance: builder.mutation({
      query: (data) => ({ url: '/quality/nonconformances', method: 'POST', body: data }),
      invalidatesTags: ['Nonconformance'],
    }),
  }),
});

export const {
  useGetInspectionsQuery,
  useCreateInspectionMutation,
  useGetNonconformancesQuery,
  useCreateNonconformanceMutation,
} = qualityApi;

export default qualityApi;
