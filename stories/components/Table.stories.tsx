import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Button } from '../../design-system/components/Button';

// Table Component for Storybook
const Table = ({
  data,
  columns,
  striped = true,
  hoverable = true,
}: {
  data: any[];
  columns: { key: string; label: string; render?: (value: any) => React.ReactNode }[];
  striped?: boolean;
  hoverable?: boolean;
}) => (
  <div className="overflow-x-auto border border-neutral-200 rounded-lg">
    <table className="w-full">
      <thead className="bg-neutral-50 border-b border-neutral-200">
        <tr>
          {columns.map((col) => (
            <th
              key={col.key}
              className="px-6 py-3 text-left text-sm font-semibold text-neutral-900"
            >
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, idx) => (
          <tr
            key={idx}
            className={`border-b border-neutral-200 ${
              striped && idx % 2 === 1 ? 'bg-neutral-50' : ''
            } ${hoverable ? 'hover:bg-neutral-100' : ''}`}
          >
            {columns.map((col) => (
              <td key={col.key} className="px-6 py-4 text-sm text-neutral-700">
                {col.render ? col.render(row[col.key]) : row[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const meta = {
  title: 'Components/Table',
  component: Table,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A flexible data table component for displaying structured data with support for striping and hover effects.',
      },
    },
  },
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleUsers = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Editor', status: 'Active' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Viewer', status: 'Inactive' },
  { id: 4, name: 'Alice Williams', email: 'alice@example.com', role: 'Editor', status: 'Active' },
  { id: 5, name: 'Charlie Brown', email: 'charlie@example.com', role: 'Viewer', status: 'Active' },
];

const userColumns = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
  { key: 'status', label: 'Status' },
];

// Basic table
export const Basic: Story = {
  args: {
    data: sampleUsers,
    columns: userColumns,
  },
};

// Striped table
export const Striped: Story = {
  args: {
    data: sampleUsers,
    columns: userColumns,
    striped: true,
  },
};

// Non-striped table
export const NonStriped: Story = {
  args: {
    data: sampleUsers,
    columns: userColumns,
    striped: false,
  },
};

// Hoverable table
export const Hoverable: Story = {
  args: {
    data: sampleUsers,
    columns: userColumns,
    hoverable: true,
  },
};

// With custom rendering
export const WithCustomRendering: Story = {
  render: () => {
    const columns = [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      {
        key: 'status',
        label: 'Status',
        render: (value: string) => (
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              value === 'Active'
                ? 'bg-green-100 text-green-800'
                : 'bg-neutral-100 text-neutral-800'
            }`}
          >
            {value}
          </span>
        ),
      },
    ];

    return <Table data={sampleUsers} columns={columns} />;
  },
};

// With actions
export const WithActions: Story = {
  render: () => {
    const columns = [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'role', label: 'Role' },
      {
        key: 'id',
        label: 'Actions',
        render: (id: number) => (
          <div className="flex gap-2">
            <Button size="sm" variant="ghost">Edit</Button>
            <Button size="sm" variant="danger">Delete</Button>
          </div>
        ),
      },
    ];

    return <Table data={sampleUsers} columns={columns} />;
  },
};

// Products table
export const ProductsTable: Story = {
  render: () => {
    const products = [
      { id: 1, name: 'Laptop', category: 'Electronics', price: '$999', stock: 15 },
      { id: 2, name: 'Mouse', category: 'Accessories', price: '$29', stock: 50 },
      { id: 3, name: 'Monitor', category: 'Electronics', price: '$399', stock: 8 },
      { id: 4, name: 'Keyboard', category: 'Accessories', price: '$79', stock: 25 },
      { id: 5, name: 'Desk Chair', category: 'Furniture', price: '$299', stock: 12 },
    ];

    const columns = [
      { key: 'name', label: 'Product Name' },
      { key: 'category', label: 'Category' },
      { key: 'price', label: 'Price' },
      {
        key: 'stock',
        label: 'Stock',
        render: (stock: number) => (
          <span className={stock > 10 ? 'text-green-600' : 'text-orange-600'}>
            {stock} units
          </span>
        ),
      },
    ];

    return <Table data={products} columns={columns} />;
  },
};

// Sortable table
export const SortableTable: Story = {
  render: () => {
    const [data, setData] = React.useState(sampleUsers);
    const [sortKey, setSortKey] = React.useState<string | null>(null);
    const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc');

    const handleSort = (key: string) => {
      if (sortKey === key) {
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
      } else {
        setSortKey(key);
        setSortOrder('asc');
      }

      const sorted = [...data].sort((a, b) => {
        const aVal = a[key];
        const bVal = b[key];
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return sortOrder === 'asc' ? comparison : -comparison;
      });

      setData(sorted);
    };

    const columns = [
      {
        key: 'name',
        label: 'Name',
        render: (val: string) => (
          <button
            onClick={() => handleSort('name')}
            className="font-medium text-blue-600 hover:underline"
          >
            {val} {sortKey === 'name' && (sortOrder === 'asc' ? '▲' : '▼')}
          </button>
        ),
      },
      { key: 'email', label: 'Email' },
      { key: 'role', label: 'Role' },
      { key: 'status', label: 'Status' },
    ];

    return <Table data={data} columns={columns} />;
  },
};

// Large dataset
export const LargeDataset: Story = {
  render: () => {
    const largeData = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      role: ['Admin', 'Editor', 'Viewer'][i % 3],
      status: i % 5 === 0 ? 'Inactive' : 'Active',
    }));

    return <Table data={largeData} columns={userColumns} />;
  },
};

// Empty state
export const EmptyState: Story = {
  render: () => (
    <div className="border border-neutral-200 rounded-lg p-8 text-center">
      <p className="text-neutral-500">No data available</p>
    </div>
  ),
};

// With pagination
export const WithPagination: Story = {
  render: () => {
    const [page, setPage] = React.useState(1);
    const itemsPerPage = 3;
    const totalPages = Math.ceil(sampleUsers.length / itemsPerPage);
    const startIdx = (page - 1) * itemsPerPage;
    const paginatedData = sampleUsers.slice(startIdx, startIdx + itemsPerPage);

    return (
      <div>
        <Table data={paginatedData} columns={userColumns} />
        <div className="flex justify-between items-center mt-4 p-4">
          <span className="text-sm text-neutral-600">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    );
  },
};

// Dark mode
export const DarkModePreview: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  render: () => (
    <div className="bg-neutral-900 p-8 rounded-lg">
      <Table data={sampleUsers} columns={userColumns} />
    </div>
  ),
};

// Accessibility
export const AccessibilityTest: Story = {
  render: () => (
    <table className="w-full border-collapse" role="table" aria-label="User directory">
      <thead>
        <tr>
          <th className="px-6 py-3 text-left font-semibold" scope="col">Name</th>
          <th className="px-6 py-3 text-left font-semibold" scope="col">Email</th>
          <th className="px-6 py-3 text-left font-semibold" scope="col">Role</th>
        </tr>
      </thead>
      <tbody>
        {sampleUsers.slice(0, 3).map((user) => (
          <tr key={user.id} className="border-b border-neutral-200 hover:bg-neutral-50">
            <td className="px-6 py-4">{user.name}</td>
            <td className="px-6 py-4">{user.email}</td>
            <td className="px-6 py-4">{user.role}</td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
};
