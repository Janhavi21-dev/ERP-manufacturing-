import React, { useState } from 'react';
import {
  useGetSalesOrdersQuery,
  useCreateSalesOrderMutation,
  useApproveSalesOrderMutation,
} from '../../redux/api/salesApiSlice';
import { useGetCustomersQuery } from '../../redux/api/partnerApiSlice';
import { useGetProductsQuery } from '../../redux/api/productApiSlice';
import DataTable from '../../components/tables/DataTable';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Plus, CheckCircle } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { toast } from 'sonner';

export default function SalesOrdersPage() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: response, isLoading } = useGetSalesOrdersQuery();
  const { data: custResponse } = useGetCustomersQuery();
  const { data: prodResponse } = useGetProductsQuery();
  const [createSO, { isLoading: isSubmitting }] = useCreateSalesOrderMutation();
  const [approveSO] = useApproveSalesOrderMutation();

  const orders = response?.data?.items || response?.data || [];
  const customers = custResponse?.data?.items || custResponse?.data || [];
  const allProducts = prodResponse?.data?.items || prodResponse?.data || [];
  const finishedGoods = allProducts.filter((p) => p.type === 'finished_good' || p.type === 'semi_finished');

  const { register, control, handleSubmit, reset } = useForm({
    defaultValues: {
      items: [{ product: '', quantity: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const onSubmit = async (data) => {
    try {
      await createSO({
        customer: data.customer,
        orderDate: data.orderDate || new Date().toISOString(),
        deliveryDate: data.deliveryDate,
        items: data.items.map((it) => ({
          product: it.product,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
        })),
      }).unwrap();
      toast.success('Sales order created');
      reset();
      setIsOpen(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to create sales order');
    }
  };

  const handleApprove = async (id) => {
    try {
      await approveSO(id).unwrap();
      toast.success('Sales order approved for dispatch');
    } catch (err) {
      toast.error('Failed to approve sales order');
    }
  };

  const columns = [
    { header: 'SO #', accessor: 'orderNumber', sortable: true, cell: (r) => <span className="font-semibold text-gray-900">{r.orderNumber}</span> },
    { header: 'Customer', cell: (r) => r.customer?.name || 'Customer' },
    { header: 'Order Date', cell: (r) => formatDate(r.orderDate) },
    { header: 'Total Value', sortable: true, cell: (r) => <span className="font-bold">{formatCurrency(r.totalAmount)}</span> },
    { header: 'Status', cell: (r) => <Badge status={r.status} /> },
    {
      header: 'Actions',
      cell: (r) =>
        r.status === 'draft' || r.status === 'pending_approval' ? (
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
          <h1 className="text-xl font-bold text-gray-900">Customer Sales Orders (SO)</h1>
          <p className="text-xs text-gray-500">Commercial sales contracts, pricing, and fulfillment schedules</p>
        </div>
        <button onClick={() => setIsOpen(true)} className="btn-primary">
          <Plus className="w-4 h-4 mr-1" /> New Sales Order
        </button>
      </div>

      <DataTable columns={columns} data={orders} isLoading={isLoading} searchPlaceholder="Search sales orders..." />

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Create Sales Order" maxWidth="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Customer *</label>
              <select {...register('customer', { required: true })} className="input">
                <option value="">Select Customer</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Delivery Due Date</label>
              <input type="date" {...register('deliveryDate')} className="input" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Order Line Items</label>
              <button
                type="button"
                onClick={() => append({ product: '', quantity: 1, unitPrice: 0 })}
                className="text-xs text-primary-600 font-semibold hover:underline"
              >
                + Add Item
              </button>
            </div>

            <div className="space-y-2">
              {fields.map((field, idx) => (
                <div key={field.id} className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                  <div className="col-span-6">
                    <select {...register(`items.${idx}.product`, { required: true })} className="input text-xs">
                      <option value="">Select Product</option>
                      {(finishedGoods.length ? finishedGoods : allProducts).map((p) => (
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
                      placeholder="Unit Price"
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
            <button type="submit" disabled={isSubmitting} className="btn-primary">Book Order</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
