import { apiSlice } from './apiSlice';

export const userApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: (params) => ({ url: '/users', params }),
      providesTags: ['User'],
    }),
    createUser: builder.mutation({
      query: (data) => ({ url: '/users', method: 'POST', body: data }),
      invalidatesTags: ['User'],
    }),
    toggleUserStatus: builder.mutation({
      query: (id) => ({ url: `/users/${id}/toggle-status`, method: 'PATCH' }),
      invalidatesTags: ['User'],
    }),
    getRoles: builder.query({
      query: () => '/roles',
      providesTags: ['Role'],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useCreateUserMutation,
  useToggleUserStatusMutation,
  useGetRolesQuery,
} = userApi;

export default userApi;
