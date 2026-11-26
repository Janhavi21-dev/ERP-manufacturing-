import React, { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import EmptyState from '../ui/EmptyState';
import LoadingPage from '../ui/LoadingPage';

export default function DataTable({
  columns = [],
  data = [],
  isLoading = false,
  searchPlaceholder = 'Search...',
  searchField,
  onRowClick,
  actions,
  pageSize = 10,
}) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');

  // Filter
  const filteredData = React.useMemo(() => {
    if (!search.trim()) return data;
    const term = search.toLowerCase();
    return data.filter((item) => {
      if (searchField) {
        return String(item[searchField] || '').toLowerCase().includes(term);
      }
      return Object.values(item).some((val) =>
        String(val || '').toLowerCase().includes(term)
      );
    });
  }, [data, search, searchField]);

  // Sort
  const sortedData = React.useMemo(() => {
    if (!sortField) return filteredData;
    return [...filteredData].sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (valA == null) return 1;
      if (valB == null) return -1;
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      return sortOrder === 'asc'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [filteredData, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="card overflow-hidden">
      {/* Header Controls */}
      <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="input pl-9 py-1.5 text-xs w-full"
          />
        </div>
        {actions && <div className="flex items-center gap-2 self-end sm:self-auto">{actions}</div>}
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <LoadingPage message="Loading table data..." />
        ) : paginatedData.length === 0 ? (
          <div className="p-4">
            <EmptyState title="No matching records" description="Try adjusting your filters or search terms." />
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    onClick={() => col.sortable && col.accessor && handleSort(col.accessor)}
                    className={`table-th ${col.sortable ? 'cursor-pointer hover:bg-gray-100 select-none' : ''}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {col.sortable && <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedData.map((row, rowIdx) => (
                <tr
                  key={row._id || rowIdx}
                  onClick={() => onRowClick?.(row)}
                  className={`hover:bg-gray-50/80 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className="table-td">
                      {col.cell ? col.cell(row) : col.accessor ? row[col.accessor] : null}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      {!isLoading && sortedData.length > 0 && (
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <div>
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} entries
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
