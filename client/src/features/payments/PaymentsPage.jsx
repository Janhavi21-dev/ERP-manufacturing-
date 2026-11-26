import React, { useState } from 'react';
import { useGetPaymentsQuery, useCreatePaymentMutation, useGetInvoicesQuery } from '../../redux/api/financeApiSlice';
import DataTable from '../../components/tables/DataTable';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export default function PaymentsPage() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: response, isLoading } = useGetPaymentsQuery();
  const { data: invResponse } = useGetInvoicesQuery();
  const [createPayment, { isLoading: isSubmitting }] = useCreatePaymentMutation();

  const payments = response?.data?.items || response?.data || [];
  const openInvoices = (invResponse?.data?.items || invResponse?.data || []).filter(
    (inv) => inv.status !== 'paid' && inv.status !== 'void'
  );

  const { register, handleSubmit, reset } = useForm();

  const onSubmit = async (data) => {
    try {
      await createPayment({
        invoice: data.invoice,
        amount: Number(data.amount),
        paymentMethod: data.paymentMethod,
        paymentDate: data.paymentDate || new Date().toISOString(),
        referenceNumber: data.referenceNumber,
      }).unwrap();
      toast.success('Payment recorded');
      reset();
      setIsOpen(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to record payment');
    }
  };

  const columns = [
    { header: 'Payment #', accessor: 'paymentNumber', sortable: true, cell: (r) => <span className="font-semibold text-gray-900">{r.paymentNumber}</span> },
    { header: 'Invoice Ref', cell: (r) => r.invoice?.invoiceNumber || '—' },
    { header: 'Amount Paid', sortable: true, cell: (r) => <span className="font-bold text-green-600">{formatCurrency(r.amount)}</span> },
    { header: 'Method', accessor: 'paymentMethod', cell: (r) => <span className="capitalize">{r.paymentMethod?.replace('_', ' ')}</span> },
    { header: 'Reference', accessor: 'referenceNumber' },
    { header: 'Date', cell: (r) => formatDate(r.paymentDate || r.createdAt) },
    { header: 'Status', cell: (r) => <Badge status={r.status || 'recorded'} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Payments & Receipts</h1>
          <p className="text-xs text-gray-500">Cash collections, bank transfers, and remittance receipts</p>
        </div>
        <button onClick={() => setIsOpen(true)} className="btn-primary">
          <Plus className="w-4 h-4 mr-1" /> Record Payment
        </button>
      </div>

      <DataTable columns={columns} data={payments} isLoading={isLoading} searchPlaceholder="Search payments..." />

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Record Incoming Customer Payment">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Open Invoice *</label>
            <select {...register('invoice', { required: true })} className="input">
              <option value="">Select Invoice</option>
              {openInvoices.map((inv) => (
                <option key={inv._id} value={inv._id}>
                  {inv.invoiceNumber} - {inv.customer?.name} (Due: ${inv.balanceDue ?? inv.totalAmount})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Amount Paid (₹) *</label>
              <input type="number" step="0.01" {...register('amount', { required: true })} placeholder="100.00" className="input" />
            </div>
            <div>
              <label className="label">Payment Method *</label>
              <select {...register('paymentMethod', { required: true })} className="input">
                <option value="bank_transfer">Bank Wire / ACH</option>
                <option value="credit_card">Credit Card</option>
                <option value="check">Check</option>
                <option value="cash">Cash</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Bank Reference / Txn ID</label>
              <input {...register('referenceNumber')} placeholder="TXN-009981" className="input" />
            </div>
            <div>
              <label className="label">Payment Date</label>
              <input type="date" {...register('paymentDate')} className="input" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">Apply Payment</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
