import React, { useState } from 'react';
import {
  useGetDispatchesQuery,
  useCreateDispatchMutation,
  useGetSalesOrdersQuery,
} from '../../redux/api/salesApiSlice';
import { useGetWarehousesQuery } from '../../redux/api/warehouseApiSlice';
import DataTable from '../../components/tables/DataTable';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { formatDate } from '../../lib/utils';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export default function DispatchesPage() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: response, isLoading } = useGetDispatchesQuery();
  const { data: soResponse } = useGetSalesOrdersQuery();
  const { data: whResponse } = useGetWarehousesQuery();
  const [createDispatch, { isLoading: isSubmitting }] = useCreateDispatchMutation();

  const dispatches = response?.data?.items || response?.data || [];
  const salesOrders = (soResponse?.data?.items || soResponse?.data || []).filter(
    (so) => so.status === 'approved' || so.status === 'processing'
  );
  const warehouses = whResponse?.data?.items || whResponse?.data || [];

  const [selectedSO, setSelectedSO] = useState(null);
  const { register, handleSubmit, reset } = useForm();

  const handleSOChange = (soId) => {
    const so = salesOrders.find((s) => s._id === soId);
    setSelectedSO(so);
  };

  const onSubmit = async (data) => {
    try {
      if (!selectedSO) return;
      const items = selectedSO.items.map((item, idx) => ({
        salesOrderItem: item._id,
        productId: item.product?._id || item.product,
        dispatchedQuantity: Number(data[`dispatch_${idx}`] || item.quantity),
      }));

      await createDispatch({
        salesOrder: selectedSO._id,
        warehouse: data.warehouse,
        trackingNumber: data.trackingNumber,
        carrier: data.carrier || 'Standard Freight',
        items,
      }).unwrap();

      toast.success('Dispatch created and goods deducted from inventory');
      reset();
      setSelectedSO(null);
      setIsOpen(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to process dispatch');
    }
  };

  const columns = [
    { header: 'Dispatch #', accessor: 'dispatchNumber', sortable: true, cell: (r) => <span className="font-semibold text-gray-900">{r.dispatchNumber}</span> },
    { header: 'SO Reference', cell: (r) => r.salesOrder?.orderNumber || '—' },
    { header: 'Carrier', accessor: 'carrier' },
    { header: 'Tracking #', accessor: 'trackingNumber' },
    { header: 'Dispatch Date', cell: (r) => formatDate(r.dispatchDate || r.createdAt) },
    { header: 'Status', cell: (r) => <Badge status={r.status || 'shipped'} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Shipment & Dispatches</h1>
          <p className="text-xs text-gray-500">Outbound logistics, pick-pack-ship, and carrier tracking</p>
        </div>
        <button onClick={() => setIsOpen(true)} className="btn-primary">
          <Plus className="w-4 h-4 mr-1" /> New Dispatch Note
        </button>
      </div>

      <DataTable columns={columns} data={dispatches} isLoading={isLoading} searchPlaceholder="Search dispatches..." />

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Ship / Dispatch Sales Order" maxWidth="max-w-xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Select Approved Sales Order *</label>
            <select
              {...register('salesOrder', { required: true })}
              onChange={(e) => handleSOChange(e.target.value)}
              className="input"
            >
              <option value="">Select Sales Order</option>
              {salesOrders.map((so) => (
                <option key={so._id} value={so._id}>
                  {so.orderNumber} - {so.customer?.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Dispatch Warehouse *</label>
              <select {...register('warehouse', { required: true })} className="input">
                <option value="">Select Warehouse</option>
                {warehouses.map((w) => (
                  <option key={w._id} value={w._id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Carrier</label>
              <input {...register('carrier')} placeholder="e.g. DHL Express / Fleet" className="input" />
            </div>
          </div>

          <div>
            <label className="label">Tracking Number / Bill of Lading</label>
            <input {...register('trackingNumber')} placeholder="TRACK-889912" className="input" />
          </div>

          {selectedSO && (
            <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
              <p className="text-xs font-semibold text-gray-700 mb-2">Quantities to Dispatch</p>
              <div className="space-y-2">
                {selectedSO.items?.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs bg-white p-2 rounded border border-gray-100">
                    <span className="font-medium text-gray-700">{item.product?.name || 'Item'}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">Ordered: {item.quantity}</span>
                      <input
                        type="number"
                        defaultValue={item.quantity}
                        {...register(`dispatch_${idx}`)}
                        className="input text-xs w-20 py-1"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isSubmitting || !selectedSO} className="btn-primary">
              Confirm & Dispatch
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
