import React, { useState } from 'react';
import {
  useGetPurchaseOrdersQuery,
  useCreatePurchaseOrderMutation,
  useApprovePurchaseOrderMutation,
} from '../../redux/api/procurementApiSlice';
import { useGetSuppliersQuery } from '../../redux/api/partnerApiSlice';
import { useGetProductsQuery } from '../../redux/api/productApiSlice';
import DataTable from '../../components/tables/DataTable';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Plus, CheckCircle } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { toast } from 'sonner';

export default function PurchaseOrdersPage() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: response, isLoading } = useGetPurchaseOrdersQuery();
  const { data: supResponse } = useGetSuppliersQuery();
  const { data: prodResponse } = useGetProductsQuery();
  const [createPO, { isLoading: isSubmitting }] = useCreatePurchaseOrderMutation();
  const [approvePO] = useApprovePurchaseOrderMutation();

  const orders = response?.data?.items || response?.data || [];
  const suppliers = supResponse?.data?.items || supResponse?.data || [];
  const products = prodResponse?.data?.items || prodResponse?.data || [];

  const { register, control, handleSubmit, reset } = useForm({
    defaultValues: {
      items: [{ product: '', quantity: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const onSubmit = async (data) => {
    try {
      await createPO({
        supplier: data.supplier,
        orderDate: data.orderDate || new Date().toISOString(),
        expectedDeliveryDate: data.expectedDeliveryDate,
        items: data.items.map((it) => ({
          product: it.product,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
        })),
      }).unwrap();
      toast.success('Purchase order created');
      reset();
      setIsOpen(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to create PO');
    }
  };

  const handleApprove = async (id) => {
    try {
      await approvePO(id).unwrap();
      toast.success('Purchase order approved');
    } catch (err) {
      toast.error('Failed to approve PO');
    }
  };

  const columns = [
    { header: 'PO #', accessor: 'orderNumber', sortable: true, cell: (r) => <span className="font-semibold text-gray-900">{r.orderNumber}</span> },
    { header: 'Supplier', cell: (r) => r.supplier?.name || 'Supplier' },
    { header: 'Order Date', cell: (r) => formatDate(r.orderDate) },
    { header: 'Total Value', sortable: true, cell: (r) => <span className="font-bold">{formatCurrency(r.totalAmount)}</span> },
    { header: 'Status', cell: (r) => <Badge status={r.status} /> },
    {
      header: 'Actions',
      cell: (r) =>
        r.status === 'draft' || r.status === 'submitted' ? (
          <button
            onClick={() => handleApprove(r._id)}
            className="btn-secondary btn-sm text-green-600 hover:text-green-700"
          >
            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
          </button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Purchase Orders (PO)</h1>
          <p className="text-xs text-gray-500">Commercial agreements and purchase contracts with vendors</p>
        </div>
        <button onClick={() => setIsOpen(true)} className="btn-primary">
          <Plus className="w-4 h-4 mr-1" /> Create Purchase Order
        </button>
      </div>

      <DataTable columns={columns} data={orders} isLoading={isLoading} searchPlaceholder="Search POs..." />

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Create Purchase Order" maxWidth="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Vendor / Supplier *</label>
              <select {...register('supplier', { required: true })} className="input">
                <option value="">Select Supplier</option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Expected Delivery Date</label>
              <input type="date" {...register('expectedDeliveryDate')} className="input" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Line Items</label>
              <button
                type="button"
                onClick={() => append({ product: '', quantity: 1, unitPrice: 0 })}
                className="text-xs text-primary-600 font-semibold hover:underline"
              >
                + Add Line Item
              </button>
            </div>

            <div className="space-y-2">
              {fields.map((field, idx) => (
                <div key={field.id} className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                  <div className="col-span-6">
                    <select {...register(`items.${idx}.product`, { required: true })} className="input text-xs">
                      <option value="">Select Item</option>
                      {products.map((p) => (
                        <option key={p._id} value={p._id}>{p.sku} - {p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      placeholder="Qty"
                      {...register(`items.${idx}.quantity`, { required: true })}
                      className="input text-xs"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Price"
                      {...register(`items.${idx}.unitPrice`, { required: true })}
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
            <button type="submit" disabled={isSubmitting} className="btn-primary">Generate PO</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
