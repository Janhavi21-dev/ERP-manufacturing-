import React, { useState } from 'react';
import {
  useGetUsersQuery,
  useCreateUserMutation,
  useToggleUserStatusMutation,
  useGetRolesQuery,
} from '../../redux/api/userApiSlice';
import DataTable from '../../components/tables/DataTable';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export default function UsersPage() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: response, isLoading } = useGetUsersQuery();
  const { data: roleResponse } = useGetRolesQuery();
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [toggleStatus] = useToggleUserStatusMutation();

  const users = response?.data?.items || response?.data || [];
  const roles = roleResponse?.data?.items || roleResponse?.data || [];

  const { register, handleSubmit, reset } = useForm();

  const onSubmit = async (data) => {
    try {
      await createUser(data).unwrap();
      toast.success('User account created');
      reset();
      setIsOpen(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to create user');
    }
  };

  const handleToggle = async (id) => {
    try {
      await toggleStatus(id).unwrap();
      toast.success('User status updated');
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const columns = [
    { header: 'Full Name', accessor: 'name', sortable: true, cell: (r) => <span className="font-semibold text-gray-800">{r.name}</span> },
    { header: 'Email Address', accessor: 'email' },
    { header: 'Assigned Role', cell: (r) => <span className="capitalize text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800">{r.role?.name || r.role || 'Staff'}</span> },
    {
      header: 'Account Status',
      cell: (r) => (
        <button onClick={() => handleToggle(r._id)}>
          <Badge status={r.isActive ? 'active' : 'inactive'} />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">User Administration & RBAC</h1>
          <p className="text-xs text-gray-500">Employee system access, permissions, and security roles</p>
        </div>
        <button onClick={() => setIsOpen(true)} className="btn-primary">
          <Plus className="w-4 h-4 mr-1" /> Add User
        </button>
      </div>

      <DataTable columns={columns} data={users} isLoading={isLoading} searchPlaceholder="Search users..." />

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Create User Account">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Full Name *</label>
            <input {...register('name', { required: true })} placeholder="John Doe" className="input" />
          </div>

          <div>
            <label className="label">Email Address *</label>
            <input type="email" {...register('email', { required: true })} placeholder="john@apex.com" className="input" />
          </div>

          <div>
            <label className="label">Initial Password *</label>
            <input type="password" {...register('password', { required: true })} placeholder="••••••••" className="input" />
          </div>

          <div>
            <label className="label">System Role *</label>
            <select {...register('role', { required: true })} className="input">
              <option value="">Select Role</option>
              {roles.map((r) => (
                <option key={r._id || r.name} value={r._id || r.name}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isCreating} className="btn-primary">Save User</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
