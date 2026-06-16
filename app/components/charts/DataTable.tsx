'use client';

import React, { useState, useMemo } from 'react';

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  title?: string;
  pageSize?: number;
  searchable?: boolean;
  sortable?: boolean;
  striped?: boolean;
  hoverable?: boolean;
  containerClassName?: string;
  onRowClick?: (row: T, index: number) => void;
  onExportCSV?: () => void;
  onExportJSON?: () => void;
  getRowClassName?: (row: T, index: number) => string;
  rowActions?: Array<{
    label: string;
    onClick: (row: T, index: number) => void;
    color?: string;
  }>;
}

export const DataTable = React.forwardRef<
  HTMLDivElement,
  DataTableProps<any>
>(function DataTable(
  {
    data,
    columns,
    title,
    pageSize = 10,
    searchable = true,
    sortable = true,
    striped = true,
    hoverable = true,
    containerClassName = '',
    onRowClick,
    onExportCSV,
    onExportJSON,
    getRowClassName,
    rowActions = [],
  },
  ref
) {
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  // Filter data
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;

    return data.filter((row) =>
      columns.some((col) => {
        const value = (row as any)[col.key];
        return (
          value &&
          value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
      })
    );
  }, [data, searchTerm, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = (a as any)[sortKey];
      const bValue = (b as any)[sortKey];

      if (aValue === bValue) return 0;

      const isAsc = sortDirection === 'asc';
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return isAsc ? aValue - bValue : bValue - aValue;
      }

      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      return isAsc ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }, [filteredData, sortKey, sortDirection]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const start = currentPage * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = (key: string) => {
    if (!sortable) return;

    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
    setCurrentPage(0);
  };

  const handleSelectAll = () => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(
        new Set(Array.from({ length: paginatedData.length }, (_, i) => i))
      );
    }
  };

  const handleSelectRow = (index: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);
  };

  const handleExportCSV = () => {
    if (onExportCSV) {
      onExportCSV();
      return;
    }

    const csv = [
      columns.map((c) => c.header).join(','),
      ...sortedData.map((row) =>
        columns
          .map((col) => {
            const value = (row as any)[col.key];
            return typeof value === 'string' && value.includes(',')
              ? `"${value}"`
              : value;
          })
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `table-data-${Date.now()}.csv`;
    a.click();
  };

  const handleExportJSON = () => {
    if (onExportJSON) {
      onExportJSON();
      return;
    }

    const json = JSON.stringify(sortedData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `table-data-${Date.now()}.json`;
    a.click();
  };

  return (
    <div ref={ref} className={`w-full ${containerClassName}`}>
      {/* Header */}
      {(title || searchable) && (
        <div className="mb-4 space-y-3">
          {title && (
            <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
          )}

          {searchable && (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(0);
                }}
                className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />

              <button
                onClick={handleExportCSV}
                className="px-3 py-2 text-sm rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors"
              >
                Export CSV
              </button>

              <button
                onClick={handleExportJSON}
                className="px-3 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                Export JSON
              </button>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <table className="w-full text-sm text-slate-300">
          {/* Header */}
          <thead className="bg-slate-800 border-b border-slate-700">
            <tr>
              {rowActions.length > 0 && (
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={
                      selectedRows.size > 0 &&
                      selectedRows.size === paginatedData.length
                    }
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-slate-600 text-blue-600 cursor-pointer"
                  />
                </th>
              )}

              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={`px-4 py-3 font-semibold text-slate-200 text-${col.align || 'left'} ${
                    col.sortable && sortable
                      ? 'cursor-pointer hover:bg-slate-700 transition-colors'
                      : ''
                  }`}
                  onClick={() =>
                    col.sortable && sortable && handleSort(String(col.key))
                  }
                  style={col.width ? { width: col.width } : undefined}
                >
                  <div className="flex items-center gap-2">
                    {col.header}
                    {col.sortable && sortable && sortKey === String(col.key) && (
                      <span>
                        {sortDirection === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                </th>
              ))}

              {rowActions.length > 0 && (
                <th className="px-4 py-3 font-semibold text-slate-200">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (rowActions.length > 0 ? 2 : 0)}
                  className="px-4 py-8 text-center text-slate-500"
                >
                  No data found
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => (
                <tr
                  key={index}
                  className={`border-b border-slate-700 ${
                    striped && index % 2 === 0 ? 'bg-slate-900/50' : ''
                  } ${
                    hoverable
                      ? 'hover:bg-slate-800 transition-colors cursor-pointer'
                      : ''
                  } ${getRowClassName ? getRowClassName(row, index) : ''}`}
                  onClick={() => onRowClick?.(row, index)}
                >
                  {rowActions.length > 0 && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(index)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleSelectRow(index);
                        }}
                        className="w-4 h-4 rounded border-slate-600 text-blue-600 cursor-pointer"
                      />
                    </td>
                  )}

                  {columns.map((col) => {
                    const value = (row as any)[col.key];
                    const rendered = col.render
                      ? col.render(value, row, index)
                      : value;

                    return (
                      <td
                        key={String(col.key)}
                        className={`px-4 py-3 text-${col.align || 'left'}`}
                        style={col.width ? { width: col.width } : undefined}
                      >
                        {rendered}
                      </td>
                    );
                  })}

                  {rowActions.length > 0 && (
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {rowActions.map((action, idx) => (
                          <button
                            key={idx}
                            onClick={(e) => {
                              e.stopPropagation();
                              action.onClick(row, index);
                            }}
                            className={`px-2 py-1 text-xs rounded ${
                              action.color || 'bg-blue-600'
                            } hover:opacity-80 transition-opacity text-white`}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-slate-400">
            Showing {currentPage * pageSize + 1} to{' '}
            {Math.min((currentPage + 1) * pageSize, sortedData.length)} of{' '}
            {sortedData.length}
          </span>

          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum = currentPage - 2 + i;
              if (totalPages <= 5) pageNum = i;
              else if (pageNum >= totalPages) pageNum = totalPages - 1;
              else if (pageNum < 0) pageNum = 0;

              return pageNum >= 0 && pageNum < totalPages ? (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {pageNum + 1}
                </button>
              ) : null;
            })}

            <button
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage === totalPages - 1}
              className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

DataTable.displayName = 'DataTable';

export default DataTable;
