import React, { useState } from 'react';
import {
  useGetProductsQuery,
  useCreateProductMutation,
  useGetCategoriesQuery,
  useGetUnitsQuery,
  useToggleProductStatusMutation,
} from '../../redux/api/productApiSlice';
import DataTable from '../../components/tables/DataTable';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { formatCurrency } from '../../lib/utils';
import { Plus, Package, Check, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export default function ProductsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: response, isLoading } = useGetProductsQuery();
  const { data: catResponse } = useGetCategoriesQuery();
  const { data: uomResponse } = useGetUnitsQuery();
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [toggleStatus] = useToggleProductStatusMutation();

  const products = response?.data?.items || response?.data || [];
  const categories = catResponse?.data?.items || catResponse?.data || [];
  const units = uomResponse?.data?.items || uomResponse?.data || [];

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    try {
      await createProduct({
        ...data,
        costPrice: Number(data.costPrice) || 0,
        sellingPrice: Number(data.sellingPrice) || 0,
        reorderLevel: Number(data.reorderLevel) || 0,
      }).unwrap();
      toast.success('Product created successfully');
      reset();
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to create product');
    }
  };

  const handleToggle = async (id) => {
    try {
      await toggleStatus(id).unwrap();
      toast.success('Status updated');
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const columns = [
    {
      header: 'SKU',
      accessor: 'sku',
      sortable: true,
      cell: (row) => <span className="font-semibold text-gray-900">{row.sku}</span>,
    },
    {
      header: 'Product Name',
      accessor: 'name',
      sortable: true,
      cell: (row) => (
        <div>
          <div className="font-medium text-gray-800">{row.name}</div>
          {row.description && <div className="text-[11px] text-gray-400 truncate max-w-xs">{row.description}</div>}
        </div>
      ),
    },
    {
      header: 'Type',
      accessor: 'type',
      cell: (row) => (
        <span className="capitalize text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
          {row.type?.replace('_', ' ')}
        </span>
      ),
    },
    {
      header: 'Category',
      accessor: 'category',
      cell: (row) => row.category?.name || '—',
    },
    {
      header: 'UOM',
      accessor: 'uom',
      cell: (row) => row.uom?.code || row.uom?.name || 'PCS',
    },
    {
      header: 'Cost Price',
      accessor: 'costPrice',
      sortable: true,
      cell: (row) => formatCurrency(row.costPrice),
    },
    {
      header: 'Selling Price',
      accessor: 'sellingPrice',
      sortable: true,
      cell: (row) => formatCurrency(row.sellingPrice),
    },
    {
      header: 'Status',
      accessor: 'isActive',
      cell: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggle(row._id);
          }}
          className="cursor-pointer"
        >
          <Badge status={row.isActive ? 'active' : 'inactive'} />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Products & Materials Master</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage raw materials, sub-assemblies, and finished goods catalogue</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
          <Plus className="w-4 h-4 mr-1" /> Add Product
        </button>
      </div>

      <DataTable
        columns={columns}
        data={products}
        isLoading={isLoading}
        searchPlaceholder="Search by SKU, name, or category..."
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Product / Material" maxWidth="max-w-xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">SKU *</label>
              <input {...register('sku', { required: 'SKU is required' })} placeholder="e.g. RM-STL-304" className="input" />
              {errors.sku && <p className="text-[11px] text-red-500 mt-1">{errors.sku.message}</p>}
            </div>
            <div>
              <label className="label">Item Type *</label>
              <select {...register('type', { required: true })} className="input">
                <option value="raw_material">Raw Material</option>
                <option value="semi_finished">Semi-Finished</option>
                <option value="finished_good">Finished Good</option>
                <option value="consumable">Consumable</option>
                <option value="spare_part">Spare Part</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Product / Material Name *</label>
            <input {...register('name', { required: 'Name is required' })} placeholder="e.g. Stainless Steel 304 Rod" className="input" />
            {errors.name && <p className="text-[11px] text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category</label>
              <select {...register('category')} className="input">
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Unit of Measure (UOM)</label>
              <select {...register('uom')} className="input">
                <option value="">Select UOM</option>
                {units.map((u) => (
                  <option key={u._id} value={u._id}>{u.name} ({u.code})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Cost Price (₹)</label>
              <input type="number" step="0.01" {...register('costPrice')} placeholder="0.00" className="input" />
            </div>
            <div>
              <label className="label">Selling Price (₹)</label>
              <input type="number" step="0.01" {...register('sellingPrice')} placeholder="0.00" className="input" />
            </div>
            <div>
              <label className="label">Reorder Level</label>
              <input type="number" {...register('reorderLevel')} placeholder="10" className="input" />
            </div>
          </div>

          <div>
            <label className="label">Description</label>
            <textarea {...register('description')} rows={2} placeholder="Optional technical specifications or notes" className="input" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isCreating} className="btn-primary">
              {isCreating ? 'Saving...' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
