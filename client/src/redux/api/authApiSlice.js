import { apiSlice } from './apiSlice';
import { setCredentials, logout, updateUser } from '../authSlice';

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            setCredentials({
              user: data.data.user,
              token: data.data.token,
              permissions: data.data.permissions,
              roles: data.data.roles,
            })
          );
        } catch {}
      },
    }),
    logout: builder.mutation({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch {}
        dispatch(logout());
        dispatch(apiSlice.util.resetApiState());
      },
    }),
    getMe: builder.query({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),
    changePassword: builder.mutation({
      query: (body) => ({
        url: '/auth/change-password',
        method: 'POST',
        body,
      }),
    }),
    updateProfile: builder.mutation({
      query: (body) => ({
        url: '/auth/update-profile',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['User'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data?.data) {
            dispatch(updateUser(data.data));
          }
        } catch {}
      },
    }),
  }),
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useGetMeQuery,
  useChangePasswordMutation,
  useUpdateProfileMutation,
} = authApi;

export default authApi;
