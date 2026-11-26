import React from 'react';
import { useGetReorderAlertsQuery } from '../../redux/api/inventoryApiSlice';
import DataTable from '../../components/tables/DataTable';
import { formatNumber } from '../../lib/utils';
import { AlertTriangle, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ReorderAlertsPage() {
  const { data: response, isLoading } = useGetReorderAlertsQuery();
  const alerts = response?.data?.items || response?.data || [];

  const columns = [
    {
      header: 'SKU',
      accessor: 'sku',
      sortable: true,
      cell: (row) => <span className="font-semibold text-gray-900">{row.sku}</span>,
    },
    {
      header: 'Item Name',
      accessor: 'name',
      sortable: true,
    },
    {
      header: 'Current Stock',
      accessor: 'currentStock',
      sortable: true,
      cell: (row) => <span className="font-bold text-red-600">{formatNumber(row.currentStock)}</span>,
    },
    {
      header: 'Reorder Level',
      accessor: 'reorderLevel',
      sortable: true,
      cell: (row) => formatNumber(row.reorderLevel),
    },
    {
      header: 'Deficit',
      cell: (row) => (
        <span className="font-semibold text-amber-600">
          {formatNumber(Math.max(0, (row.reorderLevel || 0) - (row.currentStock || 0)))}
        </span>
      ),
    },
    {
      header: 'Action',
      cell: () => (
        <Link to="/procurement/purchase-orders" className="btn-secondary btn-sm">
          <ShoppingCart className="w-3.5 h-3.5 mr-1" /> Order
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Reorder Stock Alerts</h1>
          <p className="text-xs text-gray-500">Products and raw materials that have fallen below safety inventory levels</p>
        </div>
      </div>

      <DataTable columns={columns} data={alerts} isLoading={isLoading} searchPlaceholder="Search low stock items..." />
    </div>
  );
}
