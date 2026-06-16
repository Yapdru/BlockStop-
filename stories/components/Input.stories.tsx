import type { Meta, StoryObj } from '@storybook/react';
import { Input } from '../../design-system/components/Input';

const meta = {
  title: 'Components/Input',
  component: Input,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A flexible input component with validation states and helper text. Supports text, email, password, number, tel, and url types.',
      },
    },
  },
  argTypes: {
    type: {
      control: { type: 'select' },
      options: ['text', 'email', 'password', 'number', 'tel', 'url'],
      description: 'Input type',
      table: {
        type: { summary: 'text | email | password | number | tel | url' },
        defaultValue: { summary: 'text' },
      },
    },
    validationState: {
      control: { type: 'select' },
      options: ['default', 'success', 'error', 'warning'],
      description: 'Validation state',
      table: {
        type: { summary: 'default | success | error | warning' },
        defaultValue: { summary: 'default' },
      },
    },
    label: {
      control: { type: 'text' },
      description: 'Label for the input',
    },
    placeholder: {
      control: { type: 'text' },
      description: 'Placeholder text',
    },
    helperText: {
      control: { type: 'text' },
      description: 'Helper text to display below input',
    },
    errorMessage: {
      control: { type: 'text' },
      description: 'Error message to display',
    },
    isRequired: {
      control: { type: 'boolean' },
      description: 'Whether input is required',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether input is disabled',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    fullWidth: {
      control: { type: 'boolean' },
      description: 'Full width input',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic variants
export const Basic: Story = {
  args: {
    type: 'text',
    label: 'Full Name',
    placeholder: 'Enter your full name',
  },
};

export const TextInput: Story = {
  args: {
    type: 'text',
    label: 'Username',
    placeholder: 'Enter username',
    helperText: 'Choose a unique username',
  },
};

export const EmailInput: Story = {
  args: {
    type: 'email',
    label: 'Email Address',
    placeholder: 'you@example.com',
    isRequired: true,
  },
};

export const PasswordInput: Story = {
  args: {
    type: 'password',
    label: 'Password',
    placeholder: 'Enter your password',
    isRequired: true,
    helperText: 'Must be at least 8 characters',
  },
};

export const NumberInput: Story = {
  args: {
    type: 'number',
    label: 'Age',
    placeholder: 'Enter your age',
    min: 0,
    max: 120,
  },
};

export const TelInput: Story = {
  args: {
    type: 'tel',
    label: 'Phone Number',
    placeholder: '+1 (555) 000-0000',
  },
};

export const URLInput: Story = {
  args: {
    type: 'url',
    label: 'Website',
    placeholder: 'https://example.com',
  },
};

// Validation states
export const DefaultState: Story = {
  args: {
    type: 'text',
    label: 'Input Field',
    validationState: 'default',
    placeholder: 'Type something...',
  },
};

export const SuccessState: Story = {
  args: {
    type: 'email',
    label: 'Email Address',
    validationState: 'success',
    value: 'user@example.com',
    helperText: 'Email is valid',
  },
};

export const ErrorState: Story = {
  args: {
    type: 'password',
    label: 'Password',
    validationState: 'error',
    value: 'short',
    errorMessage: 'Password must be at least 8 characters long',
  },
};

export const WarningState: Story = {
  args: {
    type: 'text',
    label: 'Username',
    validationState: 'warning',
    value: 'common_username',
    helperText: 'This username is commonly used. Consider something unique.',
  },
};

// States
export const Disabled: Story = {
  args: {
    type: 'text',
    label: 'Disabled Field',
    placeholder: 'This is disabled',
    disabled: true,
    value: 'Cannot edit',
  },
};

export const ReadOnly: Story = {
  args: {
    type: 'text',
    label: 'Read-Only Field',
    readOnly: true,
    value: 'This value cannot be changed',
  },
};

// Required field
export const Required: Story = {
  args: {
    type: 'text',
    label: 'Required Field',
    isRequired: true,
    placeholder: 'This field is required',
  },
};

// Full width
export const FullWidth: Story = {
  args: {
    type: 'text',
    label: 'Full Width Input',
    fullWidth: true,
    placeholder: 'This input takes full width',
  },
};

// With helper text
export const WithHelperText: Story = {
  args: {
    type: 'password',
    label: 'Create Password',
    placeholder: 'Enter a strong password',
    helperText: 'Use at least 8 characters, including uppercase, lowercase, numbers, and symbols',
  },
};

// Complex form
export const FormLayout: Story = {
  render: () => (
    <div className="space-y-4 max-w-md">
      <Input
        type="text"
        label="First Name"
        placeholder="Enter first name"
        isRequired
      />
      <Input
        type="text"
        label="Last Name"
        placeholder="Enter last name"
        isRequired
      />
      <Input
        type="email"
        label="Email Address"
        placeholder="you@example.com"
        isRequired
        helperText="We'll never share your email"
      />
      <Input
        type="password"
        label="Password"
        placeholder="Create a password"
        isRequired
        helperText="Must be at least 8 characters"
      />
    </div>
  ),
};

// Validation showcase
export const ValidationShowcase: Story = {
  render: () => (
    <div className="space-y-6 max-w-md">
      <Input
        type="text"
        label="Valid Input"
        value="John Doe"
        validationState="success"
        helperText="This field is valid"
      />
      <Input
        type="email"
        label="Invalid Email"
        value="not-an-email"
        validationState="error"
        errorMessage="Please enter a valid email address"
      />
      <Input
        type="password"
        label="Weak Password"
        value="12345"
        validationState="warning"
        helperText="Password should be stronger"
      />
    </div>
  ),
};

// Accessibility
export const AccessibilityTest: Story = {
  render: () => (
    <div className="space-y-4">
      <Input
        type="email"
        label="Email Address"
        isRequired
        aria-required="true"
        aria-label="Email address input field"
      />
      <Input
        type="password"
        label="Password"
        isRequired
        aria-required="true"
        aria-label="Password input field"
        helperText="Must contain numbers and special characters"
      />
    </div>
  ),
};

// Different sizes
export const SizeVariations: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Small Input</label>
        <Input type="text" placeholder="Small input" className="text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Medium Input (Default)</label>
        <Input type="text" placeholder="Medium input" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Large Input</label>
        <Input type="text" placeholder="Large input" className="text-lg px-4 py-3" />
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
      <Input
        type="email"
        label="Email Address"
        placeholder="you@example.com"
        className="bg-neutral-800 text-white border-neutral-700"
      />
    </div>
  ),
};

// Interactive example
export const Interactive: Story = {
  render: () => {
    const [value, setValue] = React.useState('');
    const [validation, setValidation] = React.useState<'default' | 'success' | 'error'>('default');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setValue(newValue);

      if (newValue.length === 0) {
        setValidation('default');
      } else if (newValue.length >= 3) {
        setValidation('success');
      } else {
        setValidation('error');
      }
    };

    return (
      <Input
        type="text"
        label="Username"
        value={value}
        onChange={handleChange}
        placeholder="Type at least 3 characters"
        validationState={validation}
        errorMessage={value.length > 0 && value.length < 3 ? 'Too short' : undefined}
        helperText={validation === 'success' ? 'Username is valid!' : undefined}
      />
    );
  },
};

// Import React for interactive story
import React from 'react';
