import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { selectCurrentUser } from '../../redux/authSlice';
import { useChangePasswordMutation, useUpdateProfileMutation } from '../../redux/api/authApiSlice';
import { toast } from 'sonner';
import { User, Lock, Shield } from 'lucide-react';

export default function ProfilePage() {
  const currentUser = useSelector(selectCurrentUser);
  const [updateProfile, { isLoading: isUpdatingProfile }] = useUpdateProfileMutation();
  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();

  const {
    register: regProfile,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
  } = useForm({
    defaultValues: {
      name: currentUser?.name || '',
      email: currentUser?.email || '',
    },
  });

  useEffect(() => {
    if (currentUser) {
      resetProfile({
        name: currentUser.name || '',
        email: currentUser.email || '',
      });
    }
  }, [currentUser, resetProfile]);

  const {
    register: regPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
  } = useForm();

  const onProfileSubmit = async (data) => {
    try {
      await updateProfile({ name: data.name }).unwrap();
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update profile');
    }
  };

  const onPasswordSubmit = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('New password and confirmation do not match');
      return;
    }
    try {
      await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }).unwrap();
      toast.success('Password changed successfully');
      resetPassword();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to change password');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">User Profile & Account Security</h1>
        <p className="text-xs text-gray-500">Manage your profile details and credential settings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800">Profile Details</h3>
              <p className="text-xs text-gray-500">Update personal account info</p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input {...regProfile('name', { required: true })} className="input" />
            </div>
            <div>
              <label className="label">Email Address</label>
              <input {...regProfile('email')} disabled className="input bg-gray-50 text-gray-500" />
            </div>
            <div>
              <label className="label">Role</label>
              <div className="flex items-center gap-2 text-xs font-semibold px-3 py-2 bg-slate-50 text-slate-700 rounded-lg border border-slate-200">
                <Shield className="w-4 h-4 text-primary-600" />
                <span className="capitalize">{currentUser?.role?.name || currentUser?.role || 'Super Admin'}</span>
              </div>
            </div>

            <button type="submit" disabled={isUpdatingProfile} className="btn-primary w-full">
              {isUpdatingProfile ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800">Security & Credentials</h3>
              <p className="text-xs text-gray-500">Update your account login password</p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
            <div>
              <label className="label">Current Password *</label>
              <input
                type="password"
                {...regPassword('currentPassword', { required: true })}
                placeholder="••••••••"
                className="input"
              />
            </div>
            <div>
              <label className="label">New Password *</label>
              <input
                type="password"
                {...regPassword('newPassword', { required: true })}
                placeholder="••••••••"
                className="input"
              />
            </div>
            <div>
              <label className="label">Confirm New Password *</label>
              <input
                type="password"
                {...regPassword('confirmPassword', { required: true })}
                placeholder="••••••••"
                className="input"
              />
            </div>

            <button type="submit" disabled={isChangingPassword} className="btn-primary w-full">
              {isChangingPassword ? 'Updating...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
