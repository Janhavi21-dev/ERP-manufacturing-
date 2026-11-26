import { apiSlice } from './apiSlice';

export const auditApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAuditLogs: builder.query({
      query: (params) => ({ url: '/audit-logs', params }),
      providesTags: ['AuditLog'],
    }),
  }),
});

export const { useGetAuditLogsQuery } = auditApi;

export default auditApi;
