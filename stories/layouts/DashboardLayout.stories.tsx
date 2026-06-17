import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Button } from '../../design-system/components/Button';
import { Card, CardHeader, CardBody } from '../../design-system/components/Card';

const meta = {
  title: 'Layouts/Dashboard',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Dashboard layout components for building admin and application interfaces.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// Simple dashboard
export const SimpleDashboard: Story = {
  render: () => (
    <div className="flex h-screen bg-neutral-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-neutral-200 p-4">
        <h1 className="text-2xl font-bold mb-8">BlockStop</h1>
        <nav className="space-y-2">
          {['Dashboard', 'Files', 'Scans', 'Settings'].map((item) => (
            <button
              key={item}
              className="w-full text-left px-4 py-2 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              {item}
            </button>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-neutral-200 px-8 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Dashboard</h2>
          <div className="flex gap-4 items-center">
            <span className="text-sm text-neutral-600">John Doe</span>
            <div className="w-10 h-10 rounded-full bg-blue-600" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8">
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Scans', value: '2,450' },
              { label: 'Files Analyzed', value: '12.5K' },
              { label: 'Threats Found', value: '18' },
              { label: 'Success Rate', value: '98.2%' },
            ].map((stat) => (
              <Card key={stat.label} variant="elevated" padding="lg">
                <CardBody padding="lg">
                  <p className="text-neutral-600 text-sm">{stat.label}</p>
                  <p className="text-3xl font-bold text-blue-600">{stat.value}</p>
                </CardBody>
              </Card>
            ))}
          </div>

          <Card variant="elevated" padding="lg">
            <CardHeader padding="lg">
              <h3 className="font-bold text-lg">Recent Activity</h3>
            </CardHeader>
            <CardBody padding="lg">
              <p className="text-neutral-600">Recent activity will be displayed here</p>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  ),
};

// Two column layout
export const TwoColumnLayout: Story = {
  render: () => (
    <div className="bg-neutral-50 min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        <div className="grid grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="col-span-1">
            <Card variant="elevated" padding="lg">
              <CardBody padding="lg">
                <nav className="space-y-2">
                  {['Account', 'Security', 'Notifications', 'API Keys'].map((item) => (
                    <button
                      key={item}
                      className="w-full text-left px-4 py-2 rounded-lg hover:bg-neutral-100 transition-colors text-sm"
                    >
                      {item}
                    </button>
                  ))}
                </nav>
              </CardBody>
            </Card>
          </div>

          {/* Main content */}
          <div className="col-span-2 space-y-6">
            <Card variant="elevated" padding="lg">
              <CardHeader padding="lg">
                <h3 className="font-bold text-lg">Account Settings</h3>
              </CardHeader>
              <CardBody padding="lg">
                <p className="text-neutral-600">Account settings content</p>
              </CardBody>
            </Card>

            <Card variant="elevated" padding="lg">
              <CardHeader padding="lg">
                <h3 className="font-bold text-lg">Email Preferences</h3>
              </CardHeader>
              <CardBody padding="lg">
                <p className="text-neutral-600">Email preferences content</p>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  ),
};

// Grid layout
export const GridLayout: Story = {
  render: () => (
    <div className="bg-neutral-50 min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Analytics</h1>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} variant="elevated" padding="lg">
              <CardBody padding="lg">
                <p className="text-neutral-600 text-sm">Metric {i + 1}</p>
                <p className="text-2xl font-bold text-blue-600 mt-2">${(Math.random() * 100000).toFixed(0)}</p>
              </CardBody>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} variant="elevated" padding="lg">
              <CardHeader padding="lg">
                <h4 className="font-bold">Chart {i + 1}</h4>
              </CardHeader>
              <CardBody padding="lg">
                <div className="h-48 bg-neutral-200 rounded-lg" />
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </div>
  ),
};

// Modal layout
export const ModalLayout: Story = {
  render: () => {
    const [isOpen, setIsOpen] = React.useState(true);

    return (
      <>
        {!isOpen && (
          <div className="p-8">
            <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
          </div>
        )}
        {isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <Card variant="elevated" padding="lg" className="max-w-md w-full">
              <CardHeader padding="lg">
                <h3 className="font-bold text-lg">Modal Dialog</h3>
              </CardHeader>
              <CardBody padding="lg">
                <p className="text-neutral-600">
                  This is a modal overlay that can contain forms, messages, or other content.
                </p>
              </CardBody>
              <div className="px-6 py-4 border-t border-neutral-200 flex gap-3 justify-end">
                <Button variant="ghost" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary">Confirm</Button>
              </div>
            </Card>
          </div>
        )}
      </>
    );
  },
};

// Responsive layout
export const ResponsiveLayout: Story = {
  render: () => (
    <div className="bg-neutral-50 min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">Responsive Dashboard</h1>

        {/* Mobile: 1 column, Tablet: 2 columns, Desktop: 3 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} variant="elevated" padding="lg">
              <CardBody padding="lg">
                <p className="text-neutral-600 text-sm">Card {i + 1}</p>
                <p className="text-xl font-bold mt-2">Data {i + 1}</p>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* Main content area */}
        <Card variant="elevated" padding="lg">
          <CardHeader padding="lg">
            <h2 className="font-bold text-lg">Responsive Content</h2>
          </CardHeader>
          <CardBody padding="lg">
            <p className="text-neutral-600">
              This layout adapts to different screen sizes. Try resizing your browser window.
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  ),
};

// Centered layout
export const CenteredLayout: Story = {
  render: () => (
    <div className="bg-neutral-50 min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome</h1>
          <p className="text-neutral-600 mt-2">Sign in to your account</p>
        </div>

        <Card variant="elevated" padding="lg">
          <CardBody padding="lg">
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <input
                  type="password"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                />
              </div>
              <Button variant="primary" fullWidth>
                Sign In
              </Button>
            </form>
          </CardBody>
        </Card>

        <div className="text-center text-sm text-neutral-600">
          Don't have an account?{' '}
          <a href="#" className="text-blue-600 hover:underline">
            Sign up
          </a>
        </div>
      </div>
    </div>
  ),
};

// Split layout
export const SplitLayout: Story = {
  render: () => (
    <div className="flex h-screen">
      {/* Left side */}
      <div className="w-1/2 bg-blue-600 p-8 flex flex-col justify-center text-white">
        <h1 className="text-4xl font-bold mb-4">Welcome to BlockStop</h1>
        <p className="text-lg opacity-90">
          Secure your files and emails with advanced threat detection.
        </p>
      </div>

      {/* Right side */}
      <div className="w-1/2 bg-neutral-50 p-8 flex flex-col justify-center">
        <Card variant="elevated" padding="lg" className="max-w-sm mx-auto w-full">
          <CardHeader padding="lg">
            <h2 className="font-bold text-lg">Get Started</h2>
          </CardHeader>
          <CardBody padding="lg">
            <form className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg"
              />
              <input
                type="password"
                placeholder="Password"
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg"
              />
              <Button variant="primary" fullWidth>
                Create Account
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  ),
};

// Accessibility
export const AccessibleLayout: Story = {
  render: () => (
    <div className="bg-neutral-50 min-h-screen p-8">
      <header className="max-w-7xl mx-auto mb-8">
        <h1 className="text-3xl font-bold">Accessible Layout</h1>
      </header>
      <main className="max-w-7xl mx-auto">
        <Card variant="elevated" padding="lg">
          <CardHeader padding="lg">
            <h2 className="text-xl font-bold">Main Content</h2>
          </CardHeader>
          <CardBody padding="lg">
            <p>This layout uses semantic HTML and ARIA attributes for accessibility.</p>
          </CardBody>
        </Card>
      </main>
    </div>
  ),
};
