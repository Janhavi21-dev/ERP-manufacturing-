import { apiSlice } from './apiSlice';

export const dashboardApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMetrics: builder.query({
      query: (params) => ({
        url: '/dashboard/metrics',
        params,
      }),
      providesTags: ['Dashboard'],
    }),
  }),
});

export const { useGetMetricsQuery } = dashboardApi;

export default dashboardApi;
