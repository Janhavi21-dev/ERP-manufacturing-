import React, { useState } from 'react';
import { useGetExpensesQuery, useCreateExpenseMutation } from '../../redux/api/financeApiSlice';
import DataTable from '../../components/tables/DataTable';
import Modal from '../../components/ui/Modal';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export default function ExpensesPage() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: response, isLoading } = useGetExpensesQuery();
  const [createExpense, { isLoading: isSubmitting }] = useCreateExpenseMutation();
  const expenses = response?.data?.items || response?.data || [];

  const { register, handleSubmit, reset } = useForm();

  const onSubmit = async (data) => {
    try {
      await createExpense({
        ...data,
        amount: Number(data.amount),
        date: data.date || new Date().toISOString(),
      }).unwrap();
      toast.success('Expense recorded');
      reset();
      setIsOpen(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to record expense');
    }
  };

  const columns = [
    { header: 'Title / Purpose', accessor: 'title', sortable: true },
    { header: 'Category', cell: (r) => <span className="capitalize">{r.category?.replace('_', ' ') || 'General'}</span> },
    { header: 'Amount', sortable: true, cell: (r) => <span className="font-bold text-red-600">{formatCurrency(r.amount)}</span> },
    { header: 'Date', cell: (r) => formatDate(r.date || r.createdAt) },
    { header: 'Vendor / Paid To', accessor: 'payee' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Operating Expenses (OPEX)</h1>
          <p className="text-xs text-gray-500">Utilities, machinery maintenance, overheads, and logistics expenses</p>
        </div>
        <button onClick={() => setIsOpen(true)} className="btn-primary">
          <Plus className="w-4 h-4 mr-1" /> Log Expense
        </button>
      </div>

      <DataTable columns={columns} data={expenses} isLoading={isLoading} searchPlaceholder="Search expenses..." />

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Log Operating Expense">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Expense Title *</label>
            <input {...register('title', { required: true })} placeholder="e.g. Factory Electricity Bill Nov" className="input" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category *</label>
              <select {...register('category', { required: true })} className="input">
                <option value="utilities">Utilities & Power</option>
                <option value="maintenance">Equipment Maintenance</option>
                <option value="logistics">Freight & Logistics</option>
                <option value="salaries">Shop Floor Wages</option>
                <option value="consumables">Factory Consumables</option>
                <option value="general">General & Admin</option>
              </select>
            </div>
            <div>
              <label className="label">Amount (₹) *</label>
              <input type="number" step="0.01" {...register('amount', { required: true })} placeholder="250.00" className="input" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Payee / Vendor</label>
              <input {...register('payee')} placeholder="Power Grid Corp" className="input" />
            </div>
            <div>
              <label className="label">Date</label>
              <input type="date" {...register('date')} className="input" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">Save Expense</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
