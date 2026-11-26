import React, { useState } from 'react';
import {
  useGetWorkOrdersQuery,
  useCreateWorkOrderMutation,
  useReleaseWorkOrderMutation,
  useIssueMaterialsMutation,
  useReportProductionMutation,
} from '../../redux/api/productionApiSlice';
import { useGetBomsQuery } from '../../redux/api/bomApiSlice';
import { useGetWarehousesQuery } from '../../redux/api/warehouseApiSlice';
import DataTable from '../../components/tables/DataTable';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { formatDate } from '../../lib/utils';
import { Plus, Play, CheckCircle, PackageCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export default function WorkOrdersPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [reportModalWO, setReportModalWO] = useState(null);

  const { data: response, isLoading } = useGetWorkOrdersQuery();
  const { data: bomResponse } = useGetBomsQuery();
  const { data: whResponse } = useGetWarehousesQuery();

  const [createWO, { isLoading: isCreating }] = useCreateWorkOrderMutation();
  const [releaseWO] = useReleaseWorkOrderMutation();
  const [issueMaterials] = useIssueMaterialsMutation();
  const [reportProduction, { isLoading: isReporting }] = useReportProductionMutation();

  const workOrders = response?.data?.items || response?.data || [];
  const boms = bomResponse?.data?.items || bomResponse?.data || [];
  const warehouses = whResponse?.data?.items || whResponse?.data || [];

  const { register, handleSubmit, reset } = useForm();
  const { register: regReport, handleSubmit: handleReportSubmit, reset: resetReport } = useForm();

  const onSubmit = async (data) => {
    try {
      const selectedBom = boms.find((b) => b._id === data.bomId);
      await createWO({
        product: selectedBom?.product?._id || selectedBom?.product,
        bom: data.bomId,
        plannedQuantity: Number(data.plannedQuantity),
        startDate: data.startDate || new Date().toISOString(),
        dueDate: data.dueDate,
        warehouse: data.warehouse,
      }).unwrap();
      toast.success('Work order scheduled');
      reset();
      setIsOpen(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to schedule work order');
    }
  };

  const handleRelease = async (id) => {
    try {
      await releaseWO(id).unwrap();
      toast.success('Work order released to floor');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to release work order');
    }
  };

  const handleIssue = async (wo) => {
    try {
      await issueMaterials({ id: wo._id }).unwrap();
      toast.success('Raw materials issued to production');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to issue materials');
    }
  };

  const onReportSubmit = async (data) => {
    try {
      if (!reportModalWO) return;
      await reportProduction({
        id: reportModalWO._id,
        completedQuantity: Number(data.completedQuantity),
        rejectedQuantity: Number(data.rejectedQuantity || 0),
        wastageQuantity: Number(data.wastageQuantity || 0),
        notes: data.notes,
      }).unwrap();
      toast.success('Production output and finished goods recorded');
      resetReport();
      setReportModalWO(null);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to report production');
    }
  };

  const columns = [
    { header: 'WO #', accessor: 'orderNumber', sortable: true, cell: (r) => <span className="font-semibold text-gray-900">{r.orderNumber}</span> },
    { header: 'Product', cell: (r) => r.product?.name || 'Assembly Item' },
    { header: 'Planned Qty', accessor: 'plannedQuantity', sortable: true },
    { header: 'Produced', accessor: 'producedQuantity', cell: (r) => r.producedQuantity || 0 },
    { header: 'Due Date', cell: (r) => formatDate(r.dueDate) },
    { header: 'Status', cell: (r) => <Badge status={r.status} /> },
    {
      header: 'Actions',
      cell: (r) => (
        <div className="flex items-center gap-1.5">
          {r.status === 'planned' && (
            <button
              onClick={() => handleRelease(r._id)}
              className="btn-secondary btn-sm text-blue-600"
              title="Release to Shop Floor"
            >
              <Play className="w-3.5 h-3.5 mr-1" /> Release
            </button>
          )}
          {r.status === 'released' && (
            <button
              onClick={() => handleIssue(r)}
              className="btn-secondary btn-sm text-purple-600"
              title="Issue Materials"
            >
              <PackageCheck className="w-3.5 h-3.5 mr-1" /> Issue Materials
            </button>
          )}
          {(r.status === 'released' || r.status === 'in_progress') && (
            <button
              onClick={() => setReportModalWO(r)}
              className="btn-secondary btn-sm text-green-600"
              title="Report Production Output"
            >
              <CheckCircle className="w-3.5 h-3.5 mr-1" /> Report Output
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Manufacturing Work Orders</h1>
          <p className="text-xs text-gray-500">Shop floor execution, material consumption, and yield tracking</p>
        </div>
        <button onClick={() => setIsOpen(true)} className="btn-primary">
          <Plus className="w-4 h-4 mr-1" /> Schedule Work Order
        </button>
      </div>

      <DataTable columns={columns} data={workOrders} isLoading={isLoading} searchPlaceholder="Search work orders..." />

      {/* Create WO Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Schedule Manufacturing Work Order">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Bill of Materials (BOM) *</label>
            <select {...register('bomId', { required: true })} className="input">
              <option value="">Select BOM Recipe</option>
              {boms.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.bomNumber} - {b.product?.name} (v{b.version})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Planned Quantity *</label>
              <input type="number" {...register('plannedQuantity', { required: true })} placeholder="100" className="input" />
            </div>
            <div>
              <label className="label">Target Warehouse *</label>
              <select {...register('warehouse', { required: true })} className="input">
                <option value="">Select Warehouse</option>
                {warehouses.map((w) => (
                  <option key={w._id} value={w._id}>{w.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start Date</label>
              <input type="date" {...register('startDate')} className="input" />
            </div>
            <div>
              <label className="label">Due Date *</label>
              <input type="date" {...register('dueDate', { required: true })} className="input" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isCreating} className="btn-primary">Create Work Order</button>
          </div>
        </form>
      </Modal>

      {/* Report Production Output Modal */}
      <Modal isOpen={!!reportModalWO} onClose={() => setReportModalWO(null)} title={`Report Output: ${reportModalWO?.orderNumber}`}>
        <form onSubmit={handleReportSubmit(onReportSubmit)} className="space-y-4">
          <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
            Reporting production output will move finished goods into inventory and log wastage/scrap.
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Completed Qty *</label>
              <input
                type="number"
                {...regReport('completedQuantity', { required: true })}
                placeholder="Good Units"
                className="input"
              />
            </div>
            <div>
              <label className="label">Rejected Qty</label>
              <input
                type="number"
                {...regReport('rejectedQuantity')}
                placeholder="Defects"
                className="input"
              />
            </div>
            <div>
              <label className="label">Wastage</label>
              <input
                type="number"
                {...regReport('wastageQuantity')}
                placeholder="Scrap"
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">Operator Remarks</label>
            <textarea {...regReport('notes')} rows={2} placeholder="Batch notes, inspection result..." className="input" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setReportModalWO(null)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isReporting} className="btn-primary">Post Production Output</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
