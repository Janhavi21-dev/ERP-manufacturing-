import React, { useState } from 'react';
import {
  useGetInventoryValuationQuery,
  useGetInvoiceAgingQuery,
  useGetFinancialSummaryQuery,
} from '../../redux/api/reportsApiSlice';
import DataTable from '../../components/tables/DataTable';
import LoadingPage from '../../components/ui/LoadingPage';
import { formatCurrency, formatNumber } from '../../lib/utils';
import { BarChart3, DollarSign, Calendar, Boxes } from 'lucide-react';

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState('inventory');

  const { data: invReport, isLoading: isInvLoading } = useGetInventoryValuationQuery();
  const { data: agingReport, isLoading: isAgingLoading } = useGetInvoiceAgingQuery();
  const { data: finReport, isLoading: isFinLoading } = useGetFinancialSummaryQuery();

  const inventoryItems = invReport?.data?.items || invReport?.data || [];
  const agingItems = agingReport?.data?.items || agingReport?.data || [];
  const financial = finReport?.data || {};

  const invColumns = [
    { header: 'Product SKU', accessor: 'sku', sortable: true },
    { header: 'Item Name', accessor: 'name', sortable: true },
    { header: 'Quantity On Hand', cell: (r) => formatNumber(r.onHandQuantity ?? r.quantity) },
    { header: 'Unit Cost', cell: (r) => formatCurrency(r.costPrice) },
    {
      header: 'Total Valuation',
      sortable: true,
      cell: (r) => <span className="font-bold text-gray-900">{formatCurrency((r.onHandQuantity ?? r.quantity ?? 0) * (r.costPrice || 0))}</span>,
    },
  ];

  const agingColumns = [
    { header: 'Customer', accessor: 'customerName', sortable: true },
    { header: 'Current (₹)', cell: (r) => formatCurrency(r.current || 0) },
    { header: '1 - 30 Days', cell: (r) => formatCurrency(r.days1_30 || 0) },
    { header: '31 - 60 Days', cell: (r) => formatCurrency(r.days31_60 || 0) },
    { header: '60+ Days (Overdue)', cell: (r) => <span className="font-bold text-red-600">{formatCurrency(r.days60Plus || 0)}</span> },
    { header: 'Total Outstanding', cell: (r) => <span className="font-bold">{formatCurrency(r.totalOutstanding || 0)}</span> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Financial & Operational Reports</h1>
        <p className="text-xs text-gray-500">Live balance sheets, inventory valuation, receivables aging, and profitability</p>
      </div>

      {/* Report Selection Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => setActiveReport('inventory')}
          className={`card p-4 text-left transition flex items-center gap-3 border ${
            activeReport === 'inventory' ? 'border-primary-500 ring-2 ring-primary-100 bg-primary-50/20' : 'hover:border-gray-300'
          }`}
        >
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-800">Inventory Valuation</h4>
            <p className="text-[11px] text-gray-500">Stock on hand & cost breakdown</p>
          </div>
        </button>

        <button
          onClick={() => setActiveReport('aging')}
          className={`card p-4 text-left transition flex items-center gap-3 border ${
            activeReport === 'aging' ? 'border-primary-500 ring-2 ring-primary-100 bg-primary-50/20' : 'hover:border-gray-300'
          }`}
        >
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-800">AR Aging Schedule</h4>
            <p className="text-[11px] text-gray-500">Overdue customer accounts</p>
          </div>
        </button>

        <button
          onClick={() => setActiveReport('financial')}
          className={`card p-4 text-left transition flex items-center gap-3 border ${
            activeReport === 'financial' ? 'border-primary-500 ring-2 ring-primary-100 bg-primary-50/20' : 'hover:border-gray-300'
          }`}
        >
          <div className="p-2.5 bg-green-50 text-green-600 rounded-lg">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-800">Profit & Loss Summary</h4>
            <p className="text-[11px] text-gray-500">Revenue, COGS & operating profit</p>
          </div>
        </button>
      </div>

      {/* Render Active Report */}
      {activeReport === 'inventory' && (
        <DataTable columns={invColumns} data={inventoryItems} isLoading={isInvLoading} searchPlaceholder="Filter inventory..." />
      )}

      {activeReport === 'aging' && (
        <DataTable columns={agingColumns} data={agingItems} isLoading={isAgingLoading} searchPlaceholder="Filter debtors..." />
      )}

      {activeReport === 'financial' && (
        <div className="card p-6 max-w-xl space-y-4">
          <h3 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-3">Financial Performance Summary</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-600">Total Billed Revenue</span>
              <span className="font-semibold text-gray-900">{formatCurrency(financial.totalRevenue ?? 0)}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-600">Cost of Goods / Purchases (COGS)</span>
              <span className="font-semibold text-gray-900">{formatCurrency(financial.totalPurchases ?? 0)}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-t border-gray-100 pt-2 font-bold">
              <span className="text-gray-800">Gross Margin</span>
              <span className="text-green-600">
                {formatCurrency((financial.totalRevenue ?? 0) - (financial.totalPurchases ?? 0))}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-600">Operating Expenses (OPEX)</span>
              <span className="font-semibold text-red-600">-{formatCurrency(financial.totalExpenses ?? 0)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-t-2 border-gray-200 text-base font-bold">
              <span className="text-gray-900">Net Operating Income</span>
              <span className="text-primary-600">
                {formatCurrency(
                  (financial.totalRevenue ?? 0) - (financial.totalPurchases ?? 0) - (financial.totalExpenses ?? 0)
                )}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
