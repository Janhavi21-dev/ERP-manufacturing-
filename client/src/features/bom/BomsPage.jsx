import React, { useState } from 'react';
import { useGetBomsQuery, useCreateBomMutation } from '../../redux/api/bomApiSlice';
import { useGetProductsQuery } from '../../redux/api/productApiSlice';
import DataTable from '../../components/tables/DataTable';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { Plus } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { toast } from 'sonner';

export default function BomsPage() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: response, isLoading } = useGetBomsQuery();
  const { data: prodResponse } = useGetProductsQuery();
  const [createBom, { isLoading: isSubmitting }] = useCreateBomMutation();

  const boms = response?.data?.items || response?.data || [];
  const allProducts = prodResponse?.data?.items || prodResponse?.data || [];
  const finishedGoods = allProducts.filter((p) => p.type === 'finished_good' || p.type === 'semi_finished');
  const rawMaterials = allProducts.filter((p) => p.type === 'raw_material' || p.type === 'consumable');

  const { register, control, handleSubmit, reset } = useForm({
    defaultValues: {
      version: '1.0',
      outputQuantity: 1,
      items: [{ product: '', quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const onSubmit = async (data) => {
    try {
      await createBom({
        product: data.product,
        version: data.version,
        outputQuantity: Number(data.outputQuantity),
        items: data.items.map((it) => ({
          product: it.product,
          quantity: Number(it.quantity),
          wastagePercentage: Number(it.wastagePercentage || 0),
        })),
      }).unwrap();
      toast.success('Bill of Materials registered');
      reset();
      setIsOpen(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to create BOM');
    }
  };

  const columns = [
    { header: 'BOM #', accessor: 'bomNumber', sortable: true, cell: (r) => <span className="font-semibold text-gray-900">{r.bomNumber}</span> },
    { header: 'Finished Product', cell: (r) => r.product?.name || 'Assembly' },
    { header: 'Version', accessor: 'version' },
    { header: 'Output Qty', accessor: 'outputQuantity' },
    { header: 'Components', cell: (r) => `${r.items?.length || 0} materials` },
    { header: 'Status', cell: (r) => <Badge status={r.isActive ? 'active' : 'inactive'} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Bills of Materials (BOM)</h1>
          <p className="text-xs text-gray-500">Engineering product recipes, component breakdown, and material ratios</p>
        </div>
        <button onClick={() => setIsOpen(true)} className="btn-primary">
          <Plus className="w-4 h-4 mr-1" /> New BOM Recipe
        </button>
      </div>

      <DataTable columns={columns} data={boms} isLoading={isLoading} searchPlaceholder="Search BOMs..." />

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Define Bill of Materials" maxWidth="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="label">Target Finished Good *</label>
              <select {...register('product', { required: true })} className="input">
                <option value="">Select Finished Good</option>
                {(finishedGoods.length ? finishedGoods : allProducts).map((p) => (
                  <option key={p._id} value={p._id}>{p.sku} - {p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Version</label>
              <input {...register('version')} placeholder="1.0" className="input" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Raw Material Components</label>
              <button
                type="button"
                onClick={() => append({ product: '', quantity: 1 })}
                className="text-xs text-primary-600 font-semibold hover:underline"
              >
                + Add Component
              </button>
            </div>

            <div className="space-y-2">
              {fields.map((field, idx) => (
                <div key={field.id} className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                  <div className="col-span-7">
                    <select {...register(`items.${idx}.product`, { required: true })} className="input text-xs">
                      <option value="">Select Material</option>
                      {(rawMaterials.length ? rawMaterials : allProducts).map((p) => (
                        <option key={p._id} value={p._id}>{p.sku} - {p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-4">
                    <input
                      type="number"
                      step="any"
                      placeholder="Required Qty"
                      {...register(`items.${idx}.quantity`, { required: true })}
                      className="input text-xs"
                    />
                  </div>
                  <div className="col-span-1 text-center">
                    {fields.length > 1 && (
                      <button type="button" onClick={() => remove(idx)} className="text-red-500 hover:text-red-700 text-xs">
                        ×
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={() => setIsOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">Save BOM</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
