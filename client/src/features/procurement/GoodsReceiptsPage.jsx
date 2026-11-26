import React, { useState } from 'react';
import {
  useGetGoodsReceiptsQuery,
  useReceiveGoodsMutation,
  useGetPurchaseOrdersQuery,
} from '../../redux/api/procurementApiSlice';
import { useGetWarehousesQuery } from '../../redux/api/warehouseApiSlice';
import DataTable from '../../components/tables/DataTable';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { formatDate } from '../../lib/utils';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export default function GoodsReceiptsPage() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: response, isLoading } = useGetGoodsReceiptsQuery();
  const { data: poResponse } = useGetPurchaseOrdersQuery();
  const { data: whResponse } = useGetWarehousesQuery();
  const [receiveGoods, { isLoading: isSubmitting }] = useReceiveGoodsMutation();

  const receipts = response?.data?.items || response?.data || [];
  const purchaseOrders = (poResponse?.data?.items || poResponse?.data || []).filter(
    (po) => po.status === 'approved' || po.status === 'ordered' || po.status === 'partially_received'
  );
  const warehouses = whResponse?.data?.items || whResponse?.data || [];

  const [selectedPO, setSelectedPO] = useState(null);
  const { register, handleSubmit, reset } = useForm();

  const handlePOChange = (poId) => {
    const po = purchaseOrders.find((p) => p._id === poId);
    setSelectedPO(po);
  };

  const onSubmit = async (data) => {
    try {
      if (!selectedPO) return;
      const items = selectedPO.items.map((item, idx) => ({
        purchaseOrderItem: item._id,
        product: item.product?._id || item.product,
        receivedQuantity: Number(data[`received_${idx}`] || item.quantity),
      }));

      await receiveGoods({
        purchaseOrder: selectedPO._id,
        warehouse: data.warehouse,
        deliveryNoteNumber: data.deliveryNoteNumber,
        items,
      }).unwrap();

      toast.success('Goods receipt note (GRN) created & stock updated');
      reset();
      setSelectedPO(null);
      setIsOpen(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to receive goods');
    }
  };

  const columns = [
    { header: 'GRN #', accessor: 'grnNumber', sortable: true, cell: (r) => <span className="font-semibold text-gray-900">{r.grnNumber}</span> },
    { header: 'PO Ref', cell: (r) => r.purchaseOrder?.orderNumber || '—' },
    { header: 'Warehouse', cell: (r) => r.warehouse?.name || 'Main Warehouse' },
    { header: 'Delivery Note', accessor: 'deliveryNoteNumber' },
    { header: 'Received Date', cell: (r) => formatDate(r.receivedDate || r.createdAt) },
    { header: 'Status', cell: (r) => <Badge status={r.status || 'received'} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Goods Receipt Notes (GRN)</h1>
          <p className="text-xs text-gray-500">Inbound material receiving, verification, and warehouse check-in</p>
        </div>
        <button onClick={() => setIsOpen(true)} className="btn-primary">
          <Plus className="w-4 h-4 mr-1" /> Inward Goods (GRN)
        </button>
      </div>

      <DataTable columns={columns} data={receipts} isLoading={isLoading} searchPlaceholder="Search receipts..." />

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Receive Inbound Goods (GRN)" maxWidth="max-w-xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Select Approved Purchase Order *</label>
            <select
              {...register('purchaseOrder', { required: true })}
              onChange={(e) => handlePOChange(e.target.value)}
              className="input"
            >
              <option value="">Select PO</option>
              {purchaseOrders.map((po) => (
                <option key={po._id} value={po._id}>
                  {po.orderNumber} - {po.supplier?.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Destination Warehouse *</label>
              <select {...register('warehouse', { required: true })} className="input">
                <option value="">Select Warehouse</option>
                {warehouses.map((w) => (
                  <option key={w._id} value={w._id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Delivery Note / Challan #</label>
              <input {...register('deliveryNoteNumber')} placeholder="DN-99823" className="input" />
            </div>
          </div>

          {selectedPO && (
            <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
              <p className="text-xs font-semibold text-gray-700 mb-2">Verify Received Quantities</p>
              <div className="space-y-2">
                {selectedPO.items?.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs bg-white p-2 rounded border border-gray-100">
                    <span className="font-medium text-gray-700">{item.product?.name || 'Item'}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">Ordered: {item.quantity}</span>
                      <input
                        type="number"
                        defaultValue={item.quantity}
                        {...register(`received_${idx}`)}
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
            <button type="submit" disabled={isSubmitting || !selectedPO} className="btn-primary">
              Verify & Accept Stock
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
