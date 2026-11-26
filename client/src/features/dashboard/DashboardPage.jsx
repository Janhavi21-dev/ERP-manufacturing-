import React from 'react';
import { useGetMetricsQuery } from '../../redux/api/dashboardApiSlice';
import StatCard from '../../components/ui/StatCard';
import LoadingPage from '../../components/ui/LoadingPage';
import Badge from '../../components/ui/Badge';
import { formatCurrency } from '../../lib/utils';
import {
  TrendingUp,
  ShoppingCart,
  Boxes,
  Factory,
  AlertTriangle,
  Clock,
  CheckCircle,
  FileText,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export default function DashboardPage() {
  const { data: response, isLoading, error } = useGetMetricsQuery();
  const metrics = response?.data;

  if (isLoading) return <LoadingPage message="Loading executive dashboard..." />;
  if (error) {
    return (
      <div className="card p-8 text-center text-red-500">
        Failed to load dashboard metrics. Ensure backend server is running.
      </div>
    );
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const summary = metrics?.summary || {};
  const charts = metrics?.charts || {};
  const tables = metrics?.tables || {};

  const monthlyFinancials = charts?.monthlyFinancials || [];
  const categoryDistribution = charts?.inventoryByCategory || [];
  const recentWorkOrders = tables?.recentWorkOrders || [];
  const lowStockItems = tables?.lowStockItems || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Executive Dashboard</h1>
        <p className="text-xs text-gray-500 mt-0.5">Real-time overview of manufacturing operations, sales & finance</p>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Sales"
          value={formatCurrency(summary.totalSales ?? 0)}
          subtext="Revenue generated"
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Total Purchases"
          value={formatCurrency(summary.totalPurchases ?? 0)}
          subtext="Procurement spend"
          icon={ShoppingCart}
          color="blue"
        />
        <StatCard
          title="Inventory Value"
          value={formatCurrency(summary.inventoryValue ?? 0)}
          subtext="Current warehouse valuation"
          icon={Boxes}
          color="purple"
        />
        <StatCard
          title="Active Work Orders"
          value={summary.activeWorkOrders ?? 0}
          subtext="Units in production"
          icon={Factory}
          color="amber"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pending Sales Orders"
          value={summary.pendingSalesOrders ?? 0}
          subtext="Awaiting fulfillment"
          icon={Clock}
          color="blue"
        />
        <StatCard
          title="Low Stock Items"
          value={summary.lowStockCount ?? 0}
          subtext="Below reorder threshold"
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          title="Quality Pass Rate"
          value={`${summary.qualityPassRate ?? 0}%`}
          subtext="Acceptance rate"
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Receivables"
          value={formatCurrency(summary.outstandingReceivables ?? 0)}
          subtext="Unpaid customer invoices"
          icon={FileText}
          color="amber"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue vs Purchases */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Financial Flow: Sales vs Procurement</h2>
          <div className="h-72">
            {monthlyFinancials.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyFinancials} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(val) => formatCurrency(val)}
                    contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: '#e2e8f0' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="revenue" name="Sales Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="purchases" name="Purchases" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">
                No financial transaction records yet.
              </div>
            )}
          </div>
        </div>

        {/* Inventory Category Breakdown */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Inventory by Category</h2>
          <div className="h-72 flex items-center justify-center">
            {categoryDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => [`${val}%`, 'Share']}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} layout="horizontal" verticalAlign="bottom" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-gray-400">No inventory categories created.</div>
            )}
          </div>
        </div>
      </div>

      {/* Operational Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Work Orders */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-800">Active Work Orders</h2>
            <span className="text-xs text-primary-600 font-medium">Shop Floor</span>
          </div>
          {recentWorkOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-400">
                    <th className="pb-2">WO #</th>
                    <th className="pb-2">Product</th>
                    <th className="pb-2 text-right">Qty</th>
                    <th className="pb-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs">
                  {recentWorkOrders.map((wo, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="py-2.5 font-medium text-gray-700">{wo.orderNumber}</td>
                      <td className="py-2.5 text-gray-600">{wo.product?.name || 'Standard Assembly'}</td>
                      <td className="py-2.5 text-right font-medium">{wo.plannedQuantity}</td>
                      <td className="py-2.5 text-right">
                        <Badge status={wo.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-gray-400">
              No active work orders currently scheduled.
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-800">Critical Reorder Alerts</h2>
            <span className="text-xs text-red-500 font-medium">Restock Required</span>
          </div>
          {lowStockItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-400">
                    <th className="pb-2">SKU</th>
                    <th className="pb-2">Material</th>
                    <th className="pb-2 text-right">Current</th>
                    <th className="pb-2 text-right">Reorder Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs">
                  {lowStockItems.map((item, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="py-2.5 font-medium text-gray-700">{item.sku}</td>
                      <td className="py-2.5 text-gray-600">{item.name}</td>
                      <td className="py-2.5 text-right font-bold text-red-600">{item.currentStock}</td>
                      <td className="py-2.5 text-right text-gray-500">{item.reorderLevel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-gray-400">
              All warehouse material levels are healthy.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
