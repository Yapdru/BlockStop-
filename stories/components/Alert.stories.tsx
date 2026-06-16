import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

// Alert Component for Storybook
const Alert = ({
  variant = 'info',
  title,
  children,
  onClose,
  isDismissible = true,
}: {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  isDismissible?: boolean;
}) => {
  const [isVisible, setIsVisible] = React.useState(true);

  const variantConfig = {
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      title: 'text-blue-900',
      text: 'text-blue-700',
      icon: 'ℹ️',
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      title: 'text-green-900',
      text: 'text-green-700',
      icon: '✅',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      title: 'text-yellow-900',
      text: 'text-yellow-700',
      icon: '⚠️',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      title: 'text-red-900',
      text: 'text-red-700',
      icon: '❌',
    },
  };

  const config = variantConfig[variant];

  if (!isVisible) return null;

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  return (
    <div className={`${config.bg} ${config.border} border rounded-lg p-4`} role="alert">
      <div className="flex gap-3">
        <span className="text-lg flex-shrink-0">{config.icon}</span>
        <div className="flex-1">
          {title && <h4 className={`font-semibold ${config.title} mb-1`}>{title}</h4>}
          <p className={config.text}>{children}</p>
        </div>
        {isDismissible && (
          <button
            onClick={handleClose}
            className="flex-shrink-0 text-neutral-400 hover:text-neutral-600 ml-2"
            aria-label="Close alert"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

const meta = {
  title: 'Components/Alert',
  component: Alert,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'An alert component for displaying informational messages, warnings, errors, or success notifications.',
      },
    },
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['info', 'success', 'warning', 'error'],
      description: 'Alert variant',
      table: {
        type: { summary: 'info | success | warning | error' },
        defaultValue: { summary: 'info' },
      },
    },
    title: {
      control: { type: 'text' },
      description: 'Alert title',
    },
    isDismissible: {
      control: { type: 'boolean' },
      description: 'Whether alert can be dismissed',
      table: {
        defaultValue: { summary: 'true' },
      },
    },
    children: {
      control: { type: 'text' },
      description: 'Alert message content',
    },
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

// Info variant
export const Info: Story = {
  args: {
    variant: 'info',
    title: 'Info',
    children: 'This is an informational alert message. Use this to provide helpful information.',
  },
};

// Success variant
export const Success: Story = {
  args: {
    variant: 'success',
    title: 'Success!',
    children: 'Your action has been completed successfully.',
  },
};

// Warning variant
export const Warning: Story = {
  args: {
    variant: 'warning',
    title: 'Warning',
    children: 'Please review this important warning before proceeding.',
  },
};

// Error variant
export const Error: Story = {
  args: {
    variant: 'error',
    title: 'Error',
    children: 'An error occurred. Please try again or contact support.',
  },
};

// Without title
export const NoTitle: Story = {
  args: {
    variant: 'info',
    children: 'This alert does not have a title header.',
  },
};

// Non-dismissible
export const NonDismissible: Story = {
  args: {
    variant: 'warning',
    title: 'Important Warning',
    isDismissible: false,
    children: 'This alert cannot be dismissed and requires action.',
  },
};

// Long content
export const LongContent: Story = {
  args: {
    variant: 'info',
    title: 'Detailed Information',
    children:
      'This alert contains a longer message with more detailed information. It explains a concept or process that requires more context to understand. The text can wrap to multiple lines as needed.',
  },
};

// All variants
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <Alert variant="info" title="Info Alert">
        This is an informational message.
      </Alert>
      <Alert variant="success" title="Success Alert">
        Action completed successfully.
      </Alert>
      <Alert variant="warning" title="Warning Alert">
        Please pay attention to this warning.
      </Alert>
      <Alert variant="error" title="Error Alert">
        An error has occurred.
      </Alert>
    </div>
  ),
};

// With complex content
export const ComplexContent: Story = {
  render: () => (
    <Alert variant="warning" title="Scheduled Maintenance">
      <div>
        <p className="mb-3">Our servers will be under maintenance on Saturday, June 21st.</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Estimated downtime: 2-4 hours</li>
          <li>Expected start time: 2:00 AM UTC</li>
          <li>Services affected: All API endpoints</li>
        </ul>
      </div>
    </Alert>
  ),
};

// Authentication alert
export const AuthenticationAlert: Story = {
  render: () => (
    <Alert variant="error" title="Authentication Required">
      Your session has expired. Please log in again to continue.
    </Alert>
  ),
};

// Validation alerts
export const ValidationAlerts: Story = {
  render: () => (
    <div className="space-y-4">
      <Alert variant="error" isDismissible={false}>
        <strong>Error:</strong> Email address is required
      </Alert>
      <Alert variant="warning">
        <strong>Warning:</strong> Password strength is weak
      </Alert>
      <Alert variant="success">
        <strong>Success:</strong> Form validation passed
      </Alert>
    </div>
  ),
};

// Multiple alerts
export const MultipleAlerts: Story = {
  render: () => (
    <div className="space-y-3">
      <Alert variant="info">
        New features available in the latest version.
      </Alert>
      <Alert variant="warning" title="Deprecated">
        This API endpoint will be removed in v2.0
      </Alert>
      <Alert variant="success" title="Update Available">
        A new version is ready to install.
      </Alert>
    </div>
  ),
};

// Inline alerts
export const InlineAlert: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Email Address</label>
        <input
          type="email"
          className="w-full px-3 py-2 border border-red-300 rounded-md bg-red-50"
          placeholder="you@example.com"
        />
        <Alert variant="error" isDismissible={false} className="mt-2">
          Invalid email format
        </Alert>
      </div>
    </div>
  ),
};

// Dark mode
export const DarkModePreview: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  render: () => (
    <div className="bg-neutral-900 p-8 rounded-lg">
      <div className="space-y-4">
        <Alert variant="info" title="Info Alert">
          This is displayed in dark mode.
        </Alert>
        <Alert variant="success" title="Success Alert">
          Action completed successfully.
        </Alert>
      </div>
    </div>
  ),
};

// Accessibility
export const AccessibilityTest: Story = {
  render: () => (
    <div className="space-y-4">
      <Alert
        variant="error"
        title="Accessibility Error"
        role="alert"
        aria-label="Form submission error"
      >
        Required field is missing
      </Alert>
      <Alert
        variant="success"
        title="Success"
        role="status"
        aria-live="polite"
      >
        Changes saved successfully
      </Alert>
    </div>
  ),
};

// Interactive
export const Interactive: Story = {
  render: () => {
    const [alerts, setAlerts] = React.useState([
      { id: 1, variant: 'info' as const, title: 'Info Alert', message: 'This is an info message' },
      { id: 2, variant: 'success' as const, title: 'Success Alert', message: 'Action completed' },
    ]);

    return (
      <div className="space-y-4">
        <button
          onClick={() =>
            setAlerts([
              ...alerts,
              {
                id: Date.now(),
                variant: 'warning' as const,
                title: 'New Alert',
                message: 'A new alert was added',
              },
            ])
          }
          className="px-4 py-2 bg-blue-600 text-white rounded-md"
        >
          Add Alert
        </button>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <Alert
              key={alert.id}
              variant={alert.variant}
              title={alert.title}
              onClose={() => setAlerts(alerts.filter((a) => a.id !== alert.id))}
            >
              {alert.message}
            </Alert>
          ))}
        </div>
      </div>
    );
  },
};
