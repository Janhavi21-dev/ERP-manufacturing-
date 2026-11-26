import React, { useState } from 'react';
import { useGetCustomersQuery, useCreateCustomerMutation } from '../../redux/api/partnerApiSlice';
import DataTable from '../../components/tables/DataTable';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export default function CustomersPage() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: response, isLoading } = useGetCustomersQuery();
  const [createCustomer, { isLoading: isCreating }] = useCreateCustomerMutation();
  const customers = response?.data?.items || response?.data || [];

  const { register, handleSubmit, reset } = useForm();

  const onSubmit = async (data) => {
    try {
      await createCustomer(data).unwrap();
      toast.success('Customer registered');
      reset();
      setIsOpen(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to register customer');
    }
  };

  const columns = [
    { header: 'Customer Name', accessor: 'name', sortable: true },
    { header: 'Contact Person', cell: (row) => row.contactPerson?.name || row.contactName || '—' },
    { header: 'Email', cell: (row) => row.contactPerson?.email || row.email || '—' },
    { header: 'Phone', cell: (row) => row.contactPerson?.phone || row.phone || '—' },
    { header: 'Status', cell: (row) => <Badge status={row.isActive ? 'active' : 'inactive'} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Customers Master</h1>
          <p className="text-xs text-gray-500">Corporate clients, distributor network, and contacts</p>
        </div>
        <button onClick={() => setIsOpen(true)} className="btn-primary">
          <Plus className="w-4 h-4 mr-1" /> Add Customer
        </button>
      </div>

      <DataTable columns={columns} data={customers} isLoading={isLoading} />

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="New Customer Registration">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Customer / Company Name *</label>
            <input {...register('name', { required: true })} placeholder="e.g. Apex Industrial Dist." className="input" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Contact Person</label>
              <input {...register('contactPerson.name')} placeholder="Jane Doe" className="input" />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" {...register('contactPerson.email')} placeholder="jane@apexdist.com" className="input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Phone</label>
              <input {...register('contactPerson.phone')} placeholder="+1 (555) 123-4567" className="input" />
            </div>
            <div>
              <label className="label">Tax / GST Number</label>
              <input {...register('taxNumber')} placeholder="TAX-998823" className="input" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isCreating} className="btn-primary">Save Customer</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
