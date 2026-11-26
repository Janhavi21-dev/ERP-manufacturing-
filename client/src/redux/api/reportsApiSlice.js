import { apiSlice } from './apiSlice';

export const reportsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getInventoryValuation: builder.query({
      query: (params) => ({ url: '/reports/inventory-valuation', params }),
      providesTags: ['Report'],
    }),
    getProductionSummary: builder.query({
      query: (params) => ({ url: '/reports/production-summary', params }),
      providesTags: ['Report'],
    }),
    getInvoiceAging: builder.query({
      query: (params) => ({ url: '/reports/invoice-aging', params }),
      providesTags: ['Report'],
    }),
    getFinancialSummary: builder.query({
      query: (params) => ({ url: '/reports/financial-summary', params }),
      providesTags: ['Report'],
    }),
  }),
});

export const {
  useGetInventoryValuationQuery,
  useGetProductionSummaryQuery,
  useGetInvoiceAgingQuery,
  useGetFinancialSummaryQuery,
} = reportsApi;

export default reportsApi;
