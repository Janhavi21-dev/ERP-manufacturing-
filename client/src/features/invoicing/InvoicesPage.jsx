import React, { useState } from 'react';
import { useGetInvoicesQuery, useCreateInvoiceMutation } from '../../redux/api/financeApiSlice';
import { useGetCustomersQuery } from '../../redux/api/partnerApiSlice';
import { useGetProductsQuery } from '../../redux/api/productApiSlice';
import DataTable from '../../components/tables/DataTable';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Plus, Download } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function InvoicesPage() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: response, isLoading } = useGetInvoicesQuery();
  const { data: custResponse } = useGetCustomersQuery();
  const { data: prodResponse } = useGetProductsQuery();
  const [createInvoice, { isLoading: isSubmitting }] = useCreateInvoiceMutation();

  const invoices = response?.data?.items || response?.data || [];
  const customers = custResponse?.data?.items || custResponse?.data || [];
  const products = prodResponse?.data?.items || prodResponse?.data || [];

  const { register, handleSubmit, reset } = useForm();

  const onSubmit = async (data) => {
    try {
      await createInvoice({
        customer: data.customer,
        dueDate: data.dueDate,
        items: [
          {
            product: data.product,
            quantity: Number(data.quantity),
            unitPrice: Number(data.unitPrice),
            description: data.description,
          },
        ],
      }).unwrap();
      toast.success('Invoice created');
      reset();
      setIsOpen(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to create invoice');
    }
  };

  const handleDownloadPDF = (inv) => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text('Manufacturing ERP — Commercial Invoice', 14, 22);
      doc.setFontSize(10);
      doc.text(`Invoice Number: ${inv.invoiceNumber}`, 14, 30);
      doc.text(`Customer: ${inv.customer?.name || 'Client'}`, 14, 36);
      doc.text(`Date: ${formatDate(inv.createdAt)}`, 14, 42);
      doc.text(`Due Date: ${formatDate(inv.dueDate)}`, 14, 48);

      const tableRows = (inv.items || []).map((it, idx) => [
        idx + 1,
        it.product?.name || it.description || 'Service/Product',
        it.quantity,
        `₹${it.unitPrice?.toFixed(2)}`,
        `₹${((it.quantity || 1) * (it.unitPrice || 0)).toFixed(2)}`,
      ]);

      doc.autoTable({
        startY: 56,
        head: [['#', 'Item', 'Qty', 'Unit Price', 'Total']],
        body: tableRows,
      });

      const finalY = doc.lastAutoTable.finalY || 100;
      doc.text(`Total Amount: Rs. ${inv.totalAmount?.toFixed(2) || '0.00'}`, 14, finalY + 10);
      doc.text(`Status: ${inv.status?.toUpperCase() || 'OPEN'}`, 14, finalY + 16);

      doc.save(`${inv.invoiceNumber}.pdf`);
      toast.success('PDF generated');
    } catch {
      toast.error('Failed to generate PDF');
    }
  };

  const columns = [
    { header: 'Invoice #', accessor: 'invoiceNumber', sortable: true, cell: (r) => <span className="font-semibold text-gray-900">{r.invoiceNumber}</span> },
    { header: 'Customer', cell: (r) => r.customer?.name || 'Customer' },
    { header: 'Due Date', cell: (r) => formatDate(r.dueDate) },
    { header: 'Total Value', sortable: true, cell: (r) => <span className="font-bold">{formatCurrency(r.totalAmount)}</span> },
    { header: 'Balance Due', cell: (r) => <span className="text-amber-600 font-semibold">{formatCurrency(r.balanceDue ?? r.totalAmount)}</span> },
    { header: 'Status', cell: (r) => <Badge status={r.status} /> },
    {
      header: 'Print',
      cell: (r) => (
        <button onClick={() => handleDownloadPDF(r)} className="btn-secondary btn-sm" title="Download PDF">
          <Download className="w-3.5 h-3.5 mr-1" /> PDF
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Customer Invoices & Billing</h1>
          <p className="text-xs text-gray-500">Accounts receivable, commercial invoices, and payment tracking</p>
        </div>
        <button onClick={() => setIsOpen(true)} className="btn-primary">
          <Plus className="w-4 h-4 mr-1" /> Create Invoice
        </button>
      </div>

      <DataTable columns={columns} data={invoices} isLoading={isLoading} searchPlaceholder="Search invoices..." />

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Issue Customer Invoice">
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
              <label className="label">Payment Due Date *</label>
              <input type="date" {...register('dueDate', { required: true })} className="input" />
            </div>
          </div>

          <div>
            <label className="label">Item *</label>
            <select {...register('product', { required: true })} className="input">
              <option value="">Select Item</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>{p.sku} - {p.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Quantity *</label>
              <input type="number" {...register('quantity', { required: true })} placeholder="1" className="input" />
            </div>
            <div>
              <label className="label">Unit Price (₹) *</label>
              <input type="number" step="0.01" {...register('unitPrice', { required: true })} placeholder="150.00" className="input" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">Generate Invoice</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
