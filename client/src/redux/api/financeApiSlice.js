import { apiSlice } from './apiSlice';

export const financeApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getInvoices: builder.query({
      query: (params) => ({ url: '/invoices', params }),
      providesTags: ['Invoice'],
    }),
    createInvoice: builder.mutation({
      query: (data) => ({ url: '/invoices', method: 'POST', body: data }),
      invalidatesTags: ['Invoice', 'Dashboard'],
    }),
    getPayments: builder.query({
      query: (params) => ({ url: '/payments', params }),
      providesTags: ['Payment'],
    }),
    createPayment: builder.mutation({
      query: (data) => ({ url: '/payments', method: 'POST', body: data }),
      invalidatesTags: ['Payment', 'Invoice', 'Dashboard'],
    }),
    getExpenses: builder.query({
      query: (params) => ({ url: '/expenses', params }),
      providesTags: ['Expense'],
    }),
    createExpense: builder.mutation({
      query: (data) => ({ url: '/expenses', method: 'POST', body: data }),
      invalidatesTags: ['Expense', 'Dashboard'],
    }),
  }),
});

export const {
  useGetInvoicesQuery,
  useCreateInvoiceMutation,
  useGetPaymentsQuery,
  useCreatePaymentMutation,
  useGetExpensesQuery,
  useCreateExpenseMutation,
} = financeApi;

export default financeApi;
