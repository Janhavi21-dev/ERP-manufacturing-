import React, { useState } from 'react';
import { useGetSuppliersQuery, useCreateSupplierMutation } from '../../redux/api/partnerApiSlice';
import DataTable from '../../components/tables/DataTable';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export default function SuppliersPage() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: response, isLoading } = useGetSuppliersQuery();
  const [createSupplier, { isLoading: isCreating }] = useCreateSupplierMutation();
  const suppliers = response?.data?.items || response?.data || [];

  const { register, handleSubmit, reset } = useForm();

  const onSubmit = async (data) => {
    try {
      await createSupplier(data).unwrap();
      toast.success('Supplier added');
      reset();
      setIsOpen(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to add supplier');
    }
  };

  const columns = [
    { header: 'Supplier Name', accessor: 'name', sortable: true },
    { header: 'Contact Person', cell: (row) => row.contactPerson?.name || row.contactName || '—' },
    { header: 'Email', cell: (row) => row.contactPerson?.email || row.email || '—' },
    { header: 'Phone', cell: (row) => row.contactPerson?.phone || row.phone || '—' },
    { header: 'Payment Terms', cell: (row) => row.paymentTerms || 'Net 30' },
    { header: 'Status', cell: (row) => <Badge status={row.isActive ? 'active' : 'inactive'} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Vendors & Suppliers</h1>
          <p className="text-xs text-gray-500">Procurement partners, suppliers, and terms</p>
        </div>
        <button onClick={() => setIsOpen(true)} className="btn-primary">
          <Plus className="w-4 h-4 mr-1" /> Add Supplier
        </button>
      </div>

      <DataTable columns={columns} data={suppliers} isLoading={isLoading} />

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="New Supplier Entry">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Company Name *</label>
            <input {...register('name', { required: true })} placeholder="e.g. Acme Industrial Supplies" className="input" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Contact Name</label>
              <input {...register('contactPerson.name')} placeholder="John Smith" className="input" />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" {...register('contactPerson.email')} placeholder="john@acme.com" className="input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Phone</label>
              <input {...register('contactPerson.phone')} placeholder="+1 (555) 000-0000" className="input" />
            </div>
            <div>
              <label className="label">Payment Terms</label>
              <select {...register('paymentTerms')} className="input">
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 60">Net 60</option>
                <option value="Immediate">Immediate / Advance</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isCreating} className="btn-primary">Save Supplier</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
