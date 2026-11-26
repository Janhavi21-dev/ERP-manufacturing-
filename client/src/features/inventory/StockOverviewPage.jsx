import React from 'react';
import { useGetStockOverviewQuery } from '../../redux/api/inventoryApiSlice';
import DataTable from '../../components/tables/DataTable';
import { formatNumber } from '../../lib/utils';
import { AlertCircle } from 'lucide-react';

export default function StockOverviewPage() {
  const { data: response, isLoading } = useGetStockOverviewQuery();
  const stock = response?.data?.items || response?.data || [];

  const columns = [
    {
      header: 'Product / SKU',
      sortable: true,
      cell: (row) => (
        <div>
          <div className="font-semibold text-gray-900">{row.product?.sku || 'SKU'}</div>
          <div className="text-xs text-gray-500">{row.product?.name || 'Item Name'}</div>
        </div>
      ),
    },
    {
      header: 'Warehouse',
      cell: (row) => row.warehouse?.name || 'Main Warehouse',
    },
    {
      header: 'On Hand',
      sortable: true,
      cell: (row) => <span className="font-bold text-gray-900">{formatNumber(row.onHandQuantity ?? row.quantity)}</span>,
    },
    {
      header: 'Reserved',
      cell: (row) => <span className="text-amber-600 font-medium">{formatNumber(row.reservedQuantity || 0)}</span>,
    },
    {
      header: 'Available',
      sortable: true,
      cell: (row) => {
        const avail = (row.onHandQuantity ?? row.quantity ?? 0) - (row.reservedQuantity || 0);
        return <span className={`font-bold ${avail < 0 ? 'text-red-600' : 'text-green-600'}`}>{formatNumber(avail)}</span>;
      },
    },
    {
      header: 'Status',
      cell: (row) => {
        const onHand = row.onHandQuantity ?? row.quantity ?? 0;
        const reorder = row.product?.reorderLevel || 10;
        if (onHand <= 0) return <span className="badge bg-red-100 text-red-700">Out of Stock</span>;
        if (onHand <= reorder) return <span className="badge bg-amber-100 text-amber-700">Low Stock</span>;
        return <span className="badge bg-green-100 text-green-700">Healthy</span>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Live Inventory Balances</h1>
        <p className="text-xs text-gray-500 mt-0.5">Real-time stock on hand, reservations, and available quantities per warehouse</p>
      </div>

      <DataTable columns={columns} data={stock} isLoading={isLoading} searchPlaceholder="Search by product SKU or name..." />
    </div>
  );
}
