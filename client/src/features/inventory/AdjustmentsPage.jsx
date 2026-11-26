import React, { useState } from 'react';
import { useCreateAdjustmentMutation } from '../../redux/api/inventoryApiSlice';
import { useGetProductsQuery } from '../../redux/api/productApiSlice';
import { useGetWarehousesQuery } from '../../redux/api/warehouseApiSlice';
import Modal from '../../components/ui/Modal';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export default function AdjustmentsPage() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: prodResponse } = useGetProductsQuery();
  const { data: whResponse } = useGetWarehousesQuery();
  const [createAdjustment, { isLoading: isSubmitting }] = useCreateAdjustmentMutation();

  const products = prodResponse?.data?.items || prodResponse?.data || [];
  const warehouses = whResponse?.data?.items || whResponse?.data || [];

  const { register, handleSubmit, reset } = useForm();

  const onSubmit = async (data) => {
    try {
      await createAdjustment({
        ...data,
        quantity: Number(data.quantity),
      }).unwrap();
      toast.success('Inventory adjustment recorded');
      reset();
      setIsOpen(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Adjustment failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Stock Adjustments</h1>
          <p className="text-xs text-gray-500 mt-0.5">Physical count corrections, write-offs, and discrepancies</p>
        </div>
        <button onClick={() => setIsOpen(true)} className="btn-primary">
          <Plus className="w-4 h-4 mr-1" /> New Adjustment
        </button>
      </div>

      <div className="card p-6 text-center text-gray-500">
        <p className="text-sm">Click <b>New Adjustment</b> to record stock changes (positive or negative) with reason tracking.</p>
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Record Stock Adjustment">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Product *</label>
            <select {...register('productId', { required: true })} className="input">
              <option value="">Select Product</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>{p.sku} - {p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Warehouse *</label>
            <select {...register('warehouseId', { required: true })} className="input">
              <option value="">Select Warehouse</option>
              {warehouses.map((w) => (
                <option key={w._id} value={w._id}>{w.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Quantity (+ / -) *</label>
              <input type="number" step="any" {...register('quantity', { required: true })} placeholder="+10 or -5" className="input" />
            </div>
            <div>
              <label className="label">Reason *</label>
              <select {...register('reason', { required: true })} className="input">
                <option value="physical_count">Physical Count Variance</option>
                <option value="damage">Damaged / Expired</option>
                <option value="scrap">Production Scrap</option>
                <option value="correction">Data Correction</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea {...register('notes')} rows={2} placeholder="Explain variance..." className="input" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">Submit Adjustment</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
