import React, { useState } from 'react';
import { useGetWarehousesQuery, useCreateWarehouseMutation } from '../../redux/api/warehouseApiSlice';
import DataTable from '../../components/tables/DataTable';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export default function WarehousesPage() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: response, isLoading } = useGetWarehousesQuery();
  const [createWarehouse, { isLoading: isCreating }] = useCreateWarehouseMutation();
  const warehouses = response?.data?.items || response?.data || [];

  const { register, handleSubmit, reset } = useForm();

  const onSubmit = async (data) => {
    try {
      await createWarehouse(data).unwrap();
      toast.success('Warehouse created');
      reset();
      setIsOpen(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to create warehouse');
    }
  };

  const columns = [
    { header: 'Warehouse Name', accessor: 'name', sortable: true },
    { header: 'Code', accessor: 'code', sortable: true },
    {
      header: 'Location',
      cell: (row) => `${row.location?.city || ''}, ${row.location?.country || ''}`.trim() || '—',
    },
    {
      header: 'Type',
      accessor: 'type',
      cell: (row) => <span className="capitalize">{row.type || 'General Storage'}</span>,
    },
    {
      header: 'Status',
      cell: (row) => <Badge status={row.isActive ? 'active' : 'inactive'} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Warehouses & Locations</h1>
          <p className="text-xs text-gray-500">Storage facilities, staging areas, and inventory locations</p>
        </div>
        <button onClick={() => setIsOpen(true)} className="btn-primary">
          <Plus className="w-4 h-4 mr-1" /> Add Warehouse
        </button>
      </div>

      <DataTable columns={columns} data={warehouses} isLoading={isLoading} />

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="New Warehouse Location">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Warehouse Name *</label>
              <input {...register('name', { required: true })} placeholder="e.g. Central Warehouse" className="input" />
            </div>
            <div>
              <label className="label">Code *</label>
              <input {...register('code', { required: true })} placeholder="e.g. WH-MAIN" className="input" />
            </div>
          </div>
          <div>
            <label className="label">Address / Location</label>
            <input {...register('location.address')} placeholder="123 Industrial Parkway" className="input mb-2" />
            <div className="grid grid-cols-2 gap-2">
              <input {...register('location.city')} placeholder="City" className="input" />
              <input {...register('location.country')} placeholder="Country" className="input" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isCreating} className="btn-primary">Create Warehouse</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
