import React, { useState } from 'react';
import { useGetUnitsQuery, useCreateUnitMutation } from '../../redux/api/productApiSlice';
import DataTable from '../../components/tables/DataTable';
import Modal from '../../components/ui/Modal';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export default function UnitsPage() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: response, isLoading } = useGetUnitsQuery();
  const [createUnit, { isLoading: isCreating }] = useCreateUnitMutation();
  const units = response?.data?.items || response?.data || [];

  const { register, handleSubmit, reset } = useForm();

  const onSubmit = async (data) => {
    try {
      await createUnit(data).unwrap();
      toast.success('Unit created');
      reset();
      setIsOpen(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to create unit');
    }
  };

  const columns = [
    { header: 'Unit Name', accessor: 'name', sortable: true },
    { header: 'Symbol / Code', accessor: 'code', sortable: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Units of Measure (UOM)</h1>
          <p className="text-xs text-gray-500">Standardized measurement units for inventory and production</p>
        </div>
        <button onClick={() => setIsOpen(true)} className="btn-primary">
          <Plus className="w-4 h-4 mr-1" /> Add Unit
        </button>
      </div>

      <DataTable columns={columns} data={units} isLoading={isLoading} />

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="New Unit of Measure">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Unit Name *</label>
            <input {...register('name', { required: true })} placeholder="e.g. Kilograms" className="input" />
          </div>
          <div>
            <label className="label">Code / Symbol *</label>
            <input {...register('code', { required: true })} placeholder="e.g. KG" className="input" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isCreating} className="btn-primary">Create Unit</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
