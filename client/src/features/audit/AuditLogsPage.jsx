import React from 'react';
import { useGetAuditLogsQuery } from '../../redux/api/auditApiSlice';
import DataTable from '../../components/tables/DataTable';
import { formatDateTime } from '../../lib/utils';
import { ShieldCheck } from 'lucide-react';

export default function AuditLogsPage() {
  const { data: response, isLoading } = useGetAuditLogsQuery();
  const logs = response?.data?.items || response?.data || [];

  const columns = [
    { header: 'Timestamp', cell: (r) => <span className="text-xs text-gray-500">{formatDateTime(r.createdAt)}</span> },
    { header: 'Action', accessor: 'action', sortable: true, cell: (r) => <span className="font-semibold text-gray-800">{r.action}</span> },
    { header: 'Resource / Module', accessor: 'resource' },
    { header: 'User', cell: (r) => r.user?.name || r.user?.email || 'System' },
    { header: 'IP Address', cell: (r) => r.ipAddress || '127.0.0.1' },
    { header: 'Status', cell: (r) => <span className={`badge ${r.status === 'success' || !r.status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{r.status || 'SUCCESS'}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-slate-100 text-slate-800 rounded-xl">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">System Audit Trail</h1>
          <p className="text-xs text-gray-500">Security event logging, compliance records, and administrative mutations</p>
        </div>
      </div>

      <DataTable columns={columns} data={logs} isLoading={isLoading} searchPlaceholder="Search audit events..." />
    </div>
  );
}
