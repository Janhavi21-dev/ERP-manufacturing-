import React from 'react';
import { useGetStockMovementsQuery } from '../../redux/api/inventoryApiSlice';
import DataTable from '../../components/tables/DataTable';
import Badge from '../../components/ui/Badge';
import { formatDateTime, formatNumber } from '../../lib/utils';

export default function StockMovementsPage() {
  const { data: response, isLoading } = useGetStockMovementsQuery();
  const movements = response?.data?.items || response?.data || [];

  const columns = [
    {
      header: 'Timestamp',
      accessor: 'createdAt',
      sortable: true,
      cell: (row) => <span className="text-xs text-gray-500">{formatDateTime(row.createdAt)}</span>,
    },
    {
      header: 'Type',
      accessor: 'type',
      cell: (row) => (
        <span className="capitalize text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
          {row.type?.replace('_', ' ')}
        </span>
      ),
    },
    {
      header: 'Product',
      cell: (row) => (
        <div>
          <div className="font-medium text-gray-800">{row.product?.name || 'Product'}</div>
          <div className="text-[11px] text-gray-400">{row.product?.sku}</div>
        </div>
      ),
    },
    {
      header: 'Warehouse',
      cell: (row) => row.warehouse?.name || 'Main Warehouse',
    },
    {
      header: 'Quantity',
      sortable: true,
      cell: (row) => (
        <span className={`font-bold ${row.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
          {row.quantity > 0 ? `+${formatNumber(row.quantity)}` : formatNumber(row.quantity)}
        </span>
      ),
    },
    {
      header: 'Reference',
      cell: (row) => (
        <span className="text-xs text-gray-600 font-mono">
          {row.referenceType ? `${row.referenceType}: ${row.referenceNumber || '—'}` : 'Manual'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Stock Movements Ledger</h1>
        <p className="text-xs text-gray-500 mt-0.5">Immutable audit trail of all receipts, issues, transfers, and adjustments</p>
      </div>

      <DataTable columns={columns} data={movements} isLoading={isLoading} searchPlaceholder="Search movements..." />
    </div>
  );
}
