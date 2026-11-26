import React, { useState } from 'react';
import { useGetRequisitionsQuery, useCreateRequisitionMutation } from '../../redux/api/procurementApiSlice';
import { useGetProductsQuery } from '../../redux/api/productApiSlice';
import DataTable from '../../components/tables/DataTable';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { formatDate } from '../../lib/utils';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export default function RequisitionsPage() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: response, isLoading } = useGetRequisitionsQuery();
  const { data: prodResponse } = useGetProductsQuery();
  const [createReq, { isLoading: isSubmitting }] = useCreateRequisitionMutation();

  const requisitions = response?.data?.items || response?.data || [];
  const products = prodResponse?.data?.items || prodResponse?.data || [];

  const { register, handleSubmit, reset } = useForm();

  const onSubmit = async (data) => {
    try {
      await createReq({
        items: [
          {
            product: data.productId,
            quantity: Number(data.quantity),
            notes: data.notes,
          },
        ],
        department: data.department || 'Production',
        requiredByDate: data.requiredByDate,
      }).unwrap();
      toast.success('Requisition submitted');
      reset();
      setIsOpen(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to submit requisition');
    }
  };

  const columns = [
    { header: 'Requisition #', accessor: 'requisitionNumber', sortable: true, cell: (r) => <span className="font-semibold">{r.requisitionNumber}</span> },
    { header: 'Department', accessor: 'department' },
    { header: 'Required By', cell: (r) => formatDate(r.requiredByDate) },
    { header: 'Status', cell: (r) => <Badge status={r.status} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Purchase Requisitions</h1>
          <p className="text-xs text-gray-500">Internal department material requests awaiting purchasing review</p>
        </div>
        <button onClick={() => setIsOpen(true)} className="btn-primary">
          <Plus className="w-4 h-4 mr-1" /> New Requisition
        </button>
      </div>

      <DataTable columns={columns} data={requisitions} isLoading={isLoading} />

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Create Purchase Requisition">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Department</label>
            <input {...register('department')} defaultValue="Manufacturing / Production" className="input" />
          </div>

          <div>
            <label className="label">Item Requested *</label>
            <select {...register('productId', { required: true })} className="input">
              <option value="">Select Item</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>{p.sku} - {p.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Quantity *</label>
              <input type="number" {...register('quantity', { required: true })} placeholder="100" className="input" />
            </div>
            <div>
              <label className="label">Required By Date</label>
              <input type="date" {...register('requiredByDate')} className="input" />
            </div>
          </div>

          <div>
            <label className="label">Notes / Justification</label>
            <textarea {...register('notes')} rows={2} className="input" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">Submit Request</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
