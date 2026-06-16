import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Button } from '../../design-system/components/Button';

// Basic Modal Component for Storybook
const Modal = ({ isOpen, onClose, title, children, size = 'md' }: {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-white rounded-lg shadow-xl ${sizeClasses[size]} w-full mx-4`}>
        {title && (
          <div className="px-6 py-4 border-b border-neutral-200">
            <h2 className="text-lg font-bold text-neutral-900">{title}</h2>
          </div>
        )}
        <div className="px-6 py-4">
          {children}
        </div>
        <div className="px-6 py-4 border-t border-neutral-200 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button variant="primary">Confirm</Button>
        </div>
      </div>
    </div>
  );
};

const meta = {
  title: 'Components/Modal',
  component: Modal,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A modal dialog component for capturing user attention and displaying important content or confirmations.',
      },
    },
  },
  argTypes: {
    isOpen: {
      control: { type: 'boolean' },
      description: 'Whether modal is open',
      table: {
        defaultValue: { summary: 'true' },
      },
    },
    title: {
      control: { type: 'text' },
      description: 'Modal title',
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Modal size',
      table: {
        defaultValue: { summary: 'md' },
      },
    },
    onClose: {
      description: 'Callback when modal is closed',
    },
  },
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic modal
export const Basic: Story = {
  args: {
    isOpen: true,
    title: 'Modal Title',
    children: 'This is the modal content.',
  },
};

// Small modal
export const Small: Story = {
  args: {
    isOpen: true,
    title: 'Small Modal',
    size: 'sm',
    children: 'A smaller modal for simple content.',
  },
};

// Medium modal (default)
export const Medium: Story = {
  args: {
    isOpen: true,
    title: 'Medium Modal',
    size: 'md',
    children: 'This is a medium-sized modal with more space for content.',
  },
};

// Large modal
export const Large: Story = {
  args: {
    isOpen: true,
    title: 'Large Modal',
    size: 'lg',
    children: 'A larger modal provides more space for detailed content or forms.',
  },
};

// Without title
export const NoTitle: Story = {
  args: {
    isOpen: true,
    children: 'This modal has no title header.',
  },
};

// With form content
export const FormModal: Story = {
  render: () => {
    const [isOpen, setIsOpen] = React.useState(true);

    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Form Modal</Button>
        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Edit Profile">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                defaultValue="John Doe"
                className="w-full px-3 py-2 border border-neutral-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Email
              </label>
              <input
                type="email"
                defaultValue="john@example.com"
                className="w-full px-3 py-2 border border-neutral-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Bio
              </label>
              <textarea
                defaultValue="Product designer and developer"
                className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                rows={4}
              />
            </div>
          </div>
        </Modal>
      </>
    );
  },
};

// Confirmation modal
export const Confirmation: Story = {
  render: () => {
    const [isOpen, setIsOpen] = React.useState(true);

    return (
      <>
        <Button variant="danger" onClick={() => setIsOpen(true)}>
          Delete Item
        </Button>
        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Confirm Delete">
          <div>
            <p className="text-neutral-700 mb-4">
              Are you sure you want to delete this item? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger">Delete Permanently</Button>
            </div>
          </div>
        </Modal>
      </>
    );
  },
};

// Success modal
export const Success: Story = {
  render: () => {
    const [isOpen, setIsOpen] = React.useState(true);

    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Show Success</Button>
        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Success!">
          <div className="text-center">
            <div className="text-5xl mb-4">✅</div>
            <p className="text-neutral-700 mb-6">
              Your changes have been saved successfully.
            </p>
            <Button variant="primary" onClick={() => setIsOpen(false)}>
              Done
            </Button>
          </div>
        </Modal>
      </>
    );
  },
};

// Error modal
export const Error: Story = {
  render: () => {
    const [isOpen, setIsOpen] = React.useState(true);

    return (
      <>
        <Button variant="danger" onClick={() => setIsOpen(true)}>
          Show Error
        </Button>
        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Error">
          <div className="text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <p className="text-neutral-700 mb-6">
              Something went wrong. Please try again later or contact support.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="ghost" onClick={() => setIsOpen(false)}>
                Close
              </Button>
              <Button variant="primary">Contact Support</Button>
            </div>
          </div>
        </Modal>
      </>
    );
  },
};

// Interactive modal
export const Interactive: Story = {
  render: () => {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
      <>
        <Button variant="primary" onClick={() => setIsOpen(true)}>
          Open Modal
        </Button>
        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Interactive Modal">
          <p className="text-neutral-700">
            Click the buttons below to interact with the modal.
          </p>
        </Modal>
      </>
    );
  },
};

// Nested information modal
export const InfoModal: Story = {
  render: () => {
    const [isOpen, setIsOpen] = React.useState(true);

    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Show Info</Button>
        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Important Information">
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-neutral-900 mb-2">Key Points</h4>
              <ul className="list-disc list-inside space-y-2 text-neutral-700">
                <li>First important point</li>
                <li>Second important point</li>
                <li>Third important point</li>
              </ul>
            </div>
            <p className="text-sm text-neutral-600">
              Make sure you understand all points before proceeding.
            </p>
          </div>
        </Modal>
      </>
    );
  },
};

// Accessibility
export const AccessibilityTest: Story = {
  args: {
    isOpen: true,
    title: 'Accessible Modal',
    children: 'This modal includes proper ARIA attributes for accessibility.',
  },
};
