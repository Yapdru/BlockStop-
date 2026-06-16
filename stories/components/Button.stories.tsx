import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../../design-system/components/Button';

const meta = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A versatile button component with multiple variants and sizes. Supports primary, secondary, ghost, and danger variants.',
      },
    },
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'ghost', 'danger'],
      description: 'Visual style variant',
      table: {
        type: { summary: 'primary | secondary | ghost | danger' },
        defaultValue: { summary: 'primary' },
      },
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Button size',
      table: {
        type: { summary: 'sm | md | lg' },
        defaultValue: { summary: 'md' },
      },
    },
    isLoading: {
      control: { type: 'boolean' },
      description: 'Whether button is in loading state',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether button is disabled',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    fullWidth: {
      control: { type: 'boolean' },
      description: 'Full width button',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    loadingText: {
      control: { type: 'text' },
      description: 'Loading spinner text',
      table: {
        defaultValue: { summary: 'Loading...' },
      },
    },
    children: {
      control: { type: 'text' },
      description: 'Button content',
    },
    onClick: {
      description: 'Click handler callback',
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// Primary variant stories
export const Primary: Story = {
  args: {
    variant: 'primary',
    size: 'md',
    children: 'Primary Button',
  },
};

export const PrimarySmall: Story = {
  args: {
    variant: 'primary',
    size: 'sm',
    children: 'Small Primary',
  },
};

export const PrimaryLarge: Story = {
  args: {
    variant: 'primary',
    size: 'lg',
    children: 'Large Primary',
  },
};

export const PrimaryFullWidth: Story = {
  args: {
    variant: 'primary',
    size: 'md',
    fullWidth: true,
    children: 'Full Width Primary',
  },
};

export const PrimaryLoading: Story = {
  args: {
    variant: 'primary',
    size: 'md',
    isLoading: true,
    loadingText: 'Processing...',
    children: 'Primary Button',
  },
};

export const PrimaryDisabled: Story = {
  args: {
    variant: 'primary',
    size: 'md',
    disabled: true,
    children: 'Disabled Primary',
  },
};

// Secondary variant stories
export const Secondary: Story = {
  args: {
    variant: 'secondary',
    size: 'md',
    children: 'Secondary Button',
  },
};

export const SecondarySmall: Story = {
  args: {
    variant: 'secondary',
    size: 'sm',
    children: 'Small Secondary',
  },
};

export const SecondaryLarge: Story = {
  args: {
    variant: 'secondary',
    size: 'lg',
    children: 'Large Secondary',
  },
};

export const SecondaryFullWidth: Story = {
  args: {
    variant: 'secondary',
    size: 'md',
    fullWidth: true,
    children: 'Full Width Secondary',
  },
};

export const SecondaryLoading: Story = {
  args: {
    variant: 'secondary',
    size: 'md',
    isLoading: true,
    loadingText: 'Saving...',
    children: 'Secondary Button',
  },
};

export const SecondaryDisabled: Story = {
  args: {
    variant: 'secondary',
    size: 'md',
    disabled: true,
    children: 'Disabled Secondary',
  },
};

// Ghost variant stories
export const Ghost: Story = {
  args: {
    variant: 'ghost',
    size: 'md',
    children: 'Ghost Button',
  },
};

export const GhostSmall: Story = {
  args: {
    variant: 'ghost',
    size: 'sm',
    children: 'Small Ghost',
  },
};

export const GhostLarge: Story = {
  args: {
    variant: 'ghost',
    size: 'lg',
    children: 'Large Ghost',
  },
};

export const GhostFullWidth: Story = {
  args: {
    variant: 'ghost',
    size: 'md',
    fullWidth: true,
    children: 'Full Width Ghost',
  },
};

export const GhostLoading: Story = {
  args: {
    variant: 'ghost',
    size: 'md',
    isLoading: true,
    loadingText: 'Loading...',
    children: 'Ghost Button',
  },
};

export const GhostDisabled: Story = {
  args: {
    variant: 'ghost',
    size: 'md',
    disabled: true,
    children: 'Disabled Ghost',
  },
};

// Danger variant stories
export const Danger: Story = {
  args: {
    variant: 'danger',
    size: 'md',
    children: 'Delete',
  },
};

export const DangerSmall: Story = {
  args: {
    variant: 'danger',
    size: 'sm',
    children: 'Delete',
  },
};

export const DangerLarge: Story = {
  args: {
    variant: 'danger',
    size: 'lg',
    children: 'Delete Item',
  },
};

export const DangerFullWidth: Story = {
  args: {
    variant: 'danger',
    size: 'md',
    fullWidth: true,
    children: 'Permanently Delete',
  },
};

export const DangerLoading: Story = {
  args: {
    variant: 'danger',
    size: 'md',
    isLoading: true,
    loadingText: 'Deleting...',
    children: 'Delete',
  },
};

export const DangerDisabled: Story = {
  args: {
    variant: 'danger',
    size: 'md',
    disabled: true,
    children: 'Delete (Unavailable)',
  },
};

// Grouped stories - All sizes
export const AllSizes: Story = {
  render: () => (
    <div className="flex gap-4 flex-wrap">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

// Grouped stories - All variants
export const AllVariants: Story = {
  render: () => (
    <div className="flex gap-4 flex-wrap">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="danger">Danger</Button>
    </div>
  ),
};

// Grouped stories - Button group
export const ButtonGroup: Story = {
  render: () => (
    <div className="flex gap-2">
      <Button variant="secondary">Cancel</Button>
      <Button variant="primary">Confirm</Button>
    </div>
  ),
};

// Grouped stories - Icon button style
export const WithIcon: Story = {
  render: () => (
    <Button variant="primary">
      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      Add New
    </Button>
  ),
};

// Accessibility
export const AccessibilityTest: Story = {
  render: () => (
    <div className="flex gap-4 flex-col">
      <Button variant="primary" aria-label="Submit form">Submit</Button>
      <Button variant="danger" aria-label="Delete this item">Delete</Button>
      <Button variant="primary" disabled aria-disabled="true">Disabled action</Button>
    </div>
  ),
};

// Loading states
export const LoadingVariations: Story = {
  render: () => (
    <div className="flex gap-4 flex-wrap">
      <Button isLoading loadingText="Saving..." variant="primary">Save Changes</Button>
      <Button isLoading loadingText="Uploading..." variant="secondary">Upload File</Button>
      <Button isLoading loadingText="Processing..." variant="ghost">Process Data</Button>
      <Button isLoading loadingText="Deleting..." variant="danger">Delete</Button>
    </div>
  ),
};

// Dark mode preview
export const DarkModePreview: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  render: () => (
    <div className="bg-neutral-900 p-8 rounded-lg">
      <div className="flex gap-4 flex-wrap">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
      </div>
    </div>
  ),
};

// Interactive example
export const Interactive: Story = {
  args: {
    variant: 'primary',
    size: 'md',
    children: 'Click Me',
  },
  render: (args) => (
    <Button {...args} onClick={() => alert('Button clicked!')} />
  ),
};
