import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Input } from '../../design-system/components/Input';
import { Button } from '../../design-system/components/Button';
import { Card, CardHeader, CardBody, CardFooter } from '../../design-system/components/Card';

const meta = {
  title: 'Components/Forms',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Form components and patterns for building user input interfaces.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// Basic form
export const BasicForm: Story = {
  render: () => (
    <Card variant="elevated" padding="lg" className="max-w-md">
      <CardHeader padding="lg">
        <h2 className="text-xl font-bold">Contact Us</h2>
      </CardHeader>
      <CardBody padding="lg">
        <form className="space-y-4">
          <Input
            type="text"
            label="Full Name"
            placeholder="John Doe"
            isRequired
          />
          <Input
            type="email"
            label="Email Address"
            placeholder="you@example.com"
            isRequired
          />
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Message
            </label>
            <textarea
              placeholder="Your message here..."
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
            />
          </div>
        </form>
      </CardBody>
      <CardFooter padding="lg">
        <Button variant="primary" fullWidth>
          Send Message
        </Button>
      </CardFooter>
    </Card>
  ),
};

// Login form
export const LoginForm: Story = {
  render: () => {
    const [isLoading, setIsLoading] = React.useState(false);

    return (
      <Card variant="elevated" padding="lg" className="max-w-md">
        <CardHeader padding="lg">
          <h2 className="text-2xl font-bold">Sign In</h2>
          <p className="text-neutral-600 text-sm mt-1">Enter your credentials</p>
        </CardHeader>
        <CardBody padding="lg">
          <form className="space-y-4">
            <Input
              type="email"
              label="Email"
              placeholder="you@example.com"
              isRequired
            />
            <Input
              type="password"
              label="Password"
              placeholder="••••••••"
              isRequired
              helperText="Must be at least 8 characters"
            />
            <div className="flex items-center">
              <input type="checkbox" id="remember" className="w-4 h-4" />
              <label htmlFor="remember" className="ml-2 text-sm text-neutral-700">
                Remember me
              </label>
            </div>
          </form>
        </CardBody>
        <CardFooter padding="lg">
          <div className="space-y-3 w-full">
            <Button
              variant="primary"
              fullWidth
              isLoading={isLoading}
              onClick={() => setIsLoading(!isLoading)}
            >
              Sign In
            </Button>
            <p className="text-center text-sm text-neutral-600">
              Don't have an account?{' '}
              <a href="#" className="text-blue-600 hover:underline">
                Sign up
              </a>
            </p>
          </div>
        </CardFooter>
      </Card>
    );
  },
};

// Registration form
export const RegistrationForm: Story = {
  render: () => {
    const [formData, setFormData] = React.useState({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      console.log('Form submitted:', formData);
    };

    return (
      <Card variant="elevated" padding="lg" className="max-w-md">
        <CardHeader padding="lg">
          <h2 className="text-2xl font-bold">Create Account</h2>
        </CardHeader>
        <CardBody padding="lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="text"
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                isRequired
              />
              <Input
                type="text"
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                isRequired
              />
            </div>
            <Input
              type="email"
              label="Email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              isRequired
            />
            <Input
              type="password"
              label="Password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              isRequired
              helperText="At least 8 characters"
            />
            <Input
              type="password"
              label="Confirm Password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              isRequired
            />
          </form>
        </CardBody>
        <CardFooter padding="lg">
          <Button variant="primary" fullWidth>
            Create Account
          </Button>
        </CardFooter>
      </Card>
    );
  },
};

// Settings form
export const SettingsForm: Story = {
  render: () => (
    <div className="space-y-6 max-w-2xl">
      <Card variant="elevated" padding="lg">
        <CardHeader padding="lg">
          <h3 className="text-lg font-bold">Account Settings</h3>
        </CardHeader>
        <CardBody padding="lg">
          <div className="space-y-4">
            <Input
              type="text"
              label="Display Name"
              value="John Doe"
              fullWidth
            />
            <Input
              type="email"
              label="Email Address"
              value="john@example.com"
              fullWidth
            />
            <Input
              type="url"
              label="Website"
              placeholder="https://example.com"
              fullWidth
            />
          </div>
        </CardBody>
        <CardFooter padding="lg">
          <Button variant="primary">Save Changes</Button>
        </CardFooter>
      </Card>

      <Card variant="elevated" padding="lg">
        <CardHeader padding="lg">
          <h3 className="text-lg font-bold">Notifications</h3>
        </CardHeader>
        <CardBody padding="lg">
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="w-4 h-4" />
              <span className="text-neutral-700">Email notifications</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="w-4 h-4" />
              <span className="text-neutral-700">Newsletter updates</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" className="w-4 h-4" />
              <span className="text-neutral-700">Product announcements</span>
            </label>
          </div>
        </CardBody>
      </Card>
    </div>
  ),
};

// Multi-step form
export const MultiStepForm: Story = {
  render: () => {
    const [step, setStep] = React.useState(1);

    return (
      <Card variant="elevated" padding="lg" className="max-w-md">
        <CardHeader padding="lg">
          <h2 className="text-xl font-bold">Setup Wizard</h2>
          <div className="flex gap-2 mt-4">
            {[1, 2, 3].map((num) => (
              <div
                key={num}
                className={`flex-1 h-2 rounded-full ${
                  num <= step ? 'bg-blue-600' : 'bg-neutral-200'
                }`}
              />
            ))}
          </div>
        </CardHeader>
        <CardBody padding="lg">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Step 1: Basic Info</h3>
              <Input type="text" label="Project Name" isRequired />
              <Input type="text" label="Description" isRequired />
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Step 2: Settings</h3>
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked />
                <span>Public project</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" />
                <span>Enable comments</span>
              </label>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Step 3: Review</h3>
              <p className="text-sm text-neutral-600">
                Please review your settings before confirming.
              </p>
            </div>
          )}
        </CardBody>
        <CardFooter padding="lg">
          <div className="flex gap-3 justify-between w-full">
            <Button
              variant="ghost"
              disabled={step === 1}
              onClick={() => setStep(step - 1)}
            >
              Back
            </Button>
            <Button
              variant="primary"
              onClick={() => setStep(step === 3 ? step : step + 1)}
            >
              {step === 3 ? 'Complete' : 'Next'}
            </Button>
          </div>
        </CardFooter>
      </Card>
    );
  },
};

// Search form
export const SearchForm: Story = {
  render: () => {
    const [query, setQuery] = React.useState('');

    return (
      <div className="space-y-4">
        <form className="flex gap-2">
          <Input
            type="text"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1"
          />
          <Button variant="primary">Search</Button>
        </form>
        {query && (
          <div className="bg-neutral-50 p-4 rounded-lg">
            <p className="text-sm text-neutral-600">
              Search results for: <strong>{query}</strong>
            </p>
          </div>
        )}
      </div>
    );
  },
};

// Filter form
export const FilterForm: Story = {
  render: () => (
    <Card variant="elevated" padding="lg" className="max-w-sm">
      <CardHeader padding="lg">
        <h3 className="font-bold">Filters</h3>
      </CardHeader>
      <CardBody padding="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select className="w-full px-3 py-2 border border-neutral-300 rounded-md">
              <option>All Categories</option>
              <option>Electronics</option>
              <option>Clothing</option>
              <option>Books</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Price Range</label>
            <input type="range" min="0" max="1000" className="w-full" />
            <p className="text-xs text-neutral-500 mt-1">$0 - $1000</p>
          </div>
          <div>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked />
              <span className="text-sm">In Stock Only</span>
            </label>
          </div>
        </div>
      </CardBody>
      <CardFooter padding="lg">
        <div className="flex gap-2 w-full">
          <Button variant="ghost" className="flex-1">Reset</Button>
          <Button variant="primary" className="flex-1">Apply</Button>
        </div>
      </CardFooter>
    </Card>
  ),
};

// Validation form
export const ValidationForm: Story = {
  render: () => {
    const [errors, setErrors] = React.useState<{ [key: string]: string }>({});

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const newErrors: { [key: string]: string } = {};

      const email = formData.get('email') as string;
      if (!email.includes('@')) {
        newErrors.email = 'Invalid email format';
      }

      const password = formData.get('password') as string;
      if (password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }

      setErrors(newErrors);
    };

    return (
      <Card variant="elevated" padding="lg" className="max-w-md">
        <CardHeader padding="lg">
          <h2 className="text-xl font-bold">Form Validation</h2>
        </CardHeader>
        <CardBody padding="lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              label="Email"
              name="email"
              validationState={errors.email ? 'error' : 'default'}
              errorMessage={errors.email}
              isRequired
            />
            <Input
              type="password"
              label="Password"
              name="password"
              validationState={errors.password ? 'error' : 'default'}
              errorMessage={errors.password}
              isRequired
            />
          </form>
        </CardBody>
        <CardFooter padding="lg">
          <Button variant="primary" fullWidth onClick={handleSubmit}>
            Validate
          </Button>
        </CardFooter>
      </Card>
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
      <Card variant="elevated" padding="lg" className="max-w-md bg-neutral-800">
        <CardHeader padding="lg" className="border-neutral-700">
          <h2 className="text-xl font-bold text-white">Dark Mode Form</h2>
        </CardHeader>
        <CardBody padding="lg">
          <Input
            type="email"
            label="Email"
            placeholder="you@example.com"
            className="bg-neutral-700 text-white border-neutral-600"
          />
        </CardBody>
      </Card>
    </div>
  ),
};

// Accessibility
export const AccessibilityTest: Story = {
  render: () => (
    <Card variant="elevated" padding="lg" className="max-w-md">
      <CardHeader padding="lg">
        <h2 className="text-xl font-bold">Accessible Form</h2>
      </CardHeader>
      <CardBody padding="lg">
        <form className="space-y-4">
          <Input
            type="email"
            label="Email Address"
            isRequired
            aria-required="true"
            aria-label="Email address input"
          />
          <Input
            type="password"
            label="Password"
            isRequired
            aria-required="true"
            aria-label="Password input"
          />
        </form>
      </CardBody>
      <CardFooter padding="lg">
        <Button variant="primary" fullWidth>
          Submit
        </Button>
      </CardFooter>
    </Card>
  ),
};
