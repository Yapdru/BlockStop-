import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardBody, CardFooter } from '../../design-system/components/Card';
import { Button } from '../../design-system/components/Button';

const meta = {
  title: 'Components/Card',
  component: Card,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A container component with elevated, flat, or outline variants. Can be composed with CardHeader, CardBody, and CardFooter.',
      },
    },
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['elevated', 'flat', 'outline'],
      description: 'Visual style variant',
      table: {
        type: { summary: 'elevated | flat | outline' },
        defaultValue: { summary: 'elevated' },
      },
    },
    padding: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Card padding',
      table: {
        type: { summary: 'sm | md | lg' },
        defaultValue: { summary: 'md' },
      },
    },
    isHoverable: {
      control: { type: 'boolean' },
      description: 'Whether to show hover effect',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic variants
export const Elevated: Story = {
  args: {
    variant: 'elevated',
    padding: 'md',
    children: (
      <div>
        <h3 className="font-semibold text-lg mb-2">Elevated Card</h3>
        <p className="text-neutral-600">This card has a subtle shadow elevation.</p>
      </div>
    ),
  },
};

export const Flat: Story = {
  args: {
    variant: 'flat',
    padding: 'md',
    children: (
      <div>
        <h3 className="font-semibold text-lg mb-2">Flat Card</h3>
        <p className="text-neutral-600">This card has a flat background style.</p>
      </div>
    ),
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    padding: 'md',
    children: (
      <div>
        <h3 className="font-semibold text-lg mb-2">Outline Card</h3>
        <p className="text-neutral-600">This card uses a border outline style.</p>
      </div>
    ),
  },
};

// Padding variants
export const SmallPadding: Story = {
  args: {
    variant: 'elevated',
    padding: 'sm',
    children: <p className="text-neutral-600">Card with small padding</p>,
  },
};

export const MediumPadding: Story = {
  args: {
    variant: 'elevated',
    padding: 'md',
    children: <p className="text-neutral-600">Card with medium padding</p>,
  },
};

export const LargePadding: Story = {
  args: {
    variant: 'elevated',
    padding: 'lg',
    children: <p className="text-neutral-600">Card with large padding</p>,
  },
};

// Hoverable card
export const Hoverable: Story = {
  args: {
    variant: 'elevated',
    padding: 'md',
    isHoverable: true,
    children: (
      <div>
        <h3 className="font-semibold text-lg mb-2">Hoverable Card</h3>
        <p className="text-neutral-600">Hover over this card to see the effect</p>
      </div>
    ),
  },
};

// Composed card with sections
export const ComposedCard: Story = {
  render: () => (
    <Card variant="elevated" padding="lg" className="max-w-md">
      <CardHeader padding="lg">
        <h2 className="text-2xl font-bold text-neutral-900">Card Title</h2>
        <p className="text-sm text-neutral-500 mt-1">Subtitle or description</p>
      </CardHeader>
      <CardBody padding="lg">
        <p className="text-neutral-700">
          This is the main content area of the card. It can contain any content
          you need, such as text, images, forms, or other components.
        </p>
      </CardBody>
      <CardFooter padding="lg">
        <div className="flex gap-3 justify-end">
          <Button variant="ghost">Cancel</Button>
          <Button variant="primary">Save</Button>
        </div>
      </CardFooter>
    </Card>
  ),
};

// Profile card
export const ProfileCard: Story = {
  render: () => (
    <Card variant="elevated" padding="lg" className="max-w-sm">
      <CardBody padding="lg">
        <div className="flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-blue-200 mb-4 flex items-center justify-center">
            <span className="text-3xl">👤</span>
          </div>
          <h3 className="text-xl font-bold text-neutral-900">John Doe</h3>
          <p className="text-neutral-600 text-sm">Product Designer</p>
          <p className="text-neutral-500 text-sm mt-2">john@example.com</p>
          <Button variant="primary" className="mt-4 w-full">
            View Profile
          </Button>
        </div>
      </CardBody>
    </Card>
  ),
};

// Feature card
export const FeatureCard: Story = {
  render: () => (
    <Card variant="elevated" padding="lg" className="max-w-sm" isHoverable>
      <CardBody padding="lg">
        <div className="text-4xl mb-4">🚀</div>
        <h3 className="text-lg font-bold text-neutral-900 mb-2">Fast Performance</h3>
        <p className="text-neutral-600 text-sm">
          Our optimized components ensure lightning-fast rendering and smooth interactions.
        </p>
      </CardBody>
    </Card>
  ),
};

// Stats card
export const StatsCard: Story = {
  render: () => (
    <Card variant="flat" padding="md">
      <CardBody padding="md">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-3xl font-bold text-blue-600">2.4K</p>
            <p className="text-xs text-neutral-600 mt-1">Users</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-green-600">98%</p>
            <p className="text-xs text-neutral-600 mt-1">Uptime</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-purple-600">127</p>
            <p className="text-xs text-neutral-600 mt-1">Deployments</p>
          </div>
        </div>
      </CardBody>
    </Card>
  ),
};

// List card
export const ListCard: Story = {
  render: () => (
    <Card variant="outline" padding="lg" className="max-w-md">
      <CardHeader padding="lg">
        <h3 className="font-bold text-neutral-900">To-Do List</h3>
      </CardHeader>
      <CardBody padding="lg">
        <ul className="space-y-3">
          {['Complete project setup', 'Review pull requests', 'Update documentation'].map((item, i) => (
            <li key={i} className="flex items-center gap-3">
              <input type="checkbox" defaultChecked={i === 0} className="w-5 h-5" />
              <span className={i === 0 ? 'line-through text-neutral-400' : 'text-neutral-700'}>
                {item}
              </span>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  ),
};

// Grid of cards
export const CardGrid: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {['Product', 'Design', 'Development'].map((title) => (
        <Card key={title} variant="elevated" padding="lg" isHoverable>
          <CardHeader padding="lg">
            <h3 className="font-bold text-neutral-900">{title}</h3>
          </CardHeader>
          <CardBody padding="lg">
            <p className="text-neutral-600 text-sm">
              High-quality {title.toLowerCase()} components and resources.
            </p>
          </CardBody>
        </Card>
      ))}
    </div>
  ),
};

// Card with image
export const CardWithImage: Story = {
  render: () => (
    <Card variant="elevated" padding="lg" className="max-w-sm overflow-hidden">
      <div className="w-full h-40 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
        <span className="text-5xl">🎨</span>
      </div>
      <CardBody padding="lg">
        <h3 className="text-lg font-bold text-neutral-900 mb-2">Design System</h3>
        <p className="text-neutral-600 text-sm mb-4">
          A comprehensive set of components and design tokens.
        </p>
        <Button variant="primary" className="w-full">Learn More</Button>
      </CardBody>
    </Card>
  ),
};

// Minimal card
export const Minimal: Story = {
  args: {
    variant: 'flat',
    padding: 'sm',
    children: (
      <p className="text-neutral-700">Simple card content</p>
    ),
  },
};

// Dark mode
export const DarkModePreview: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  render: () => (
    <div className="bg-neutral-900 p-8 rounded-lg">
      <Card variant="elevated" padding="lg" className="bg-neutral-800 border-neutral-700">
        <CardHeader padding="lg" className="border-neutral-700">
          <h2 className="text-white font-bold">Dark Mode Card</h2>
        </CardHeader>
        <CardBody padding="lg">
          <p className="text-neutral-300">
            This card is styled for dark mode viewing.
          </p>
        </CardBody>
      </Card>
    </div>
  ),
};

// Accessibility
export const AccessibilityTest: Story = {
  render: () => (
    <Card
      variant="elevated"
      padding="lg"
      role="article"
      aria-label="Example card for accessibility"
    >
      <CardHeader padding="lg">
        <h2 className="text-lg font-bold">Accessible Card</h2>
      </CardHeader>
      <CardBody padding="lg">
        <p className="text-neutral-700 mb-4">
          This card is properly structured with semantic HTML for accessibility.
        </p>
        <Button variant="primary" aria-label="Click to perform action">
          Action
        </Button>
      </CardBody>
    </Card>
  ),
};
