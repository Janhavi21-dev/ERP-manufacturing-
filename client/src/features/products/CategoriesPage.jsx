import React, { useState } from 'react';
import { useGetCategoriesQuery, useCreateCategoryMutation } from '../../redux/api/productApiSlice';
import DataTable from '../../components/tables/DataTable';
import Modal from '../../components/ui/Modal';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export default function CategoriesPage() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: response, isLoading } = useGetCategoriesQuery();
  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const categories = response?.data?.items || response?.data || [];

  const { register, handleSubmit, reset } = useForm();

  const onSubmit = async (data) => {
    try {
      await createCategory(data).unwrap();
      toast.success('Category created');
      reset();
      setIsOpen(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to create category');
    }
  };

  const columns = [
    { header: 'Category Name', accessor: 'name', sortable: true },
    { header: 'Code', accessor: 'code', sortable: true },
    { header: 'Description', accessor: 'description' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Product Categories</h1>
          <p className="text-xs text-gray-500">Taxonomy and classification for materials and products</p>
        </div>
        <button onClick={() => setIsOpen(true)} className="btn-primary">
          <Plus className="w-4 h-4 mr-1" /> Add Category
        </button>
      </div>

      <DataTable columns={columns} data={categories} isLoading={isLoading} />

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="New Product Category">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Category Name *</label>
            <input {...register('name', { required: true })} placeholder="e.g. Raw Metals" className="input" />
          </div>
          <div>
            <label className="label">Code *</label>
            <input {...register('code', { required: true })} placeholder="e.g. RAW-MET" className="input" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea {...register('description')} rows={2} className="input" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isCreating} className="btn-primary">Create Category</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
