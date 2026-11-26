import React, { useState } from 'react';
import {
  useGetInspectionsQuery,
  useCreateInspectionMutation,
  useGetNonconformancesQuery,
} from '../../redux/api/qualityApiSlice';
import { useGetProductsQuery } from '../../redux/api/productApiSlice';
import DataTable from '../../components/tables/DataTable';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { formatDate } from '../../lib/utils';
import { Plus, CheckCircle2, AlertOctagon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export default function QualityPage() {
  const [activeTab, setActiveTab] = useState('inspections');
  const [isOpen, setIsOpen] = useState(false);

  const { data: inspResponse, isLoading: isInspLoading } = useGetInspectionsQuery();
  const { data: ncrResponse, isLoading: isNcrLoading } = useGetNonconformancesQuery();
  const { data: prodResponse } = useGetProductsQuery();
  const [createInspection, { isLoading: isSubmitting }] = useCreateInspectionMutation();

  const inspections = inspResponse?.data?.items || inspResponse?.data || [];
  const nonconformances = ncrResponse?.data?.items || ncrResponse?.data || [];
  const products = prodResponse?.data?.items || prodResponse?.data || [];

  const { register, handleSubmit, reset } = useForm();

  const onSubmit = async (data) => {
    try {
      await createInspection({
        ...data,
        sampleSize: Number(data.sampleSize),
        passedQuantity: Number(data.passedQuantity),
        failedQuantity: Number(data.failedQuantity || 0),
      }).unwrap();
      toast.success('Quality inspection logged');
      reset();
      setIsOpen(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to log inspection');
    }
  };

  const inspColumns = [
    { header: 'Inspection #', accessor: 'inspectionNumber', sortable: true, cell: (r) => <span className="font-semibold text-gray-900">{r.inspectionNumber}</span> },
    { header: 'Type', accessor: 'type', cell: (r) => <span className="capitalize">{r.type?.replace('_', ' ')}</span> },
    { header: 'Product', cell: (r) => r.product?.name || 'Inspection Sample' },
    { header: 'Inspected Date', cell: (r) => formatDate(r.inspectionDate || r.createdAt) },
    { header: 'Sample Size', accessor: 'sampleSize' },
    {
      header: 'Passed / Failed',
      cell: (r) => (
        <span className="text-xs">
          <span className="text-green-600 font-bold">{r.passedQuantity}</span> / <span className="text-red-600 font-bold">{r.failedQuantity}</span>
        </span>
      ),
    },
    { header: 'Result', cell: (r) => <Badge status={r.result || (r.failedQuantity > 0 ? 'failed' : 'passed')} /> },
  ];

  const ncrColumns = [
    { header: 'NCR #', accessor: 'ncrNumber', sortable: true, cell: (r) => <span className="font-semibold text-gray-900">{r.ncrNumber}</span> },
    { header: 'Title / Defect', accessor: 'title' },
    { header: 'Severity', cell: (r) => <Badge status={r.severity || 'medium'} /> },
    { header: 'Disposition', cell: (r) => <span className="capitalize">{r.disposition?.replace('_', ' ') || 'Under Review'}</span> },
    { header: 'Status', cell: (r) => <Badge status={r.status || 'open'} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Quality Assurance & Control (QA/QC)</h1>
          <p className="text-xs text-gray-500">Incoming, in-process, and final product quality gates</p>
        </div>
        <button onClick={() => setIsOpen(true)} className="btn-primary">
          <Plus className="w-4 h-4 mr-1" /> New Inspection
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('inspections')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'inspections'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" /> Inspections Log
        </button>
        <button
          onClick={() => setActiveTab('ncrs')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'ncrs'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <AlertOctagon className="w-4 h-4" /> Nonconformance Records (NCR)
        </button>
      </div>

      {activeTab === 'inspections' ? (
        <DataTable columns={inspColumns} data={inspections} isLoading={isInspLoading} searchPlaceholder="Search inspections..." />
      ) : (
        <DataTable columns={ncrColumns} data={nonconformances} isLoading={isNcrLoading} searchPlaceholder="Search NCRs..." />
      )}

      {/* Modal for New Inspection */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Record Quality Inspection">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Inspection Type *</label>
              <select {...register('type', { required: true })} className="input">
                <option value="incoming">Incoming (Raw Material)</option>
                <option value="in_process">In-Process (WIP)</option>
                <option value="final">Final Inspection (FG)</option>
              </select>
            </div>
            <div>
              <label className="label">Product / Material *</label>
              <select {...register('product', { required: true })} className="input">
                <option value="">Select Item</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>{p.sku} - {p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Sample Size *</label>
              <input type="number" {...register('sampleSize', { required: true })} placeholder="10" className="input" />
            </div>
            <div>
              <label className="label">Accepted Qty *</label>
              <input type="number" {...register('passedQuantity', { required: true })} placeholder="10" className="input" />
            </div>
            <div>
              <label className="label">Defect Qty</label>
              <input type="number" {...register('failedQuantity')} placeholder="0" className="input" />
            </div>
          </div>

          <div>
            <label className="label">Inspection Criteria & Notes</label>
            <textarea {...register('remarks')} rows={2} placeholder="Dimensional tolerances, surface finish, hardness test..." className="input" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">Record Inspection</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
