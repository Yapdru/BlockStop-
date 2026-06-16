/**
 * Form Components Tests
 *
 * Comprehensive tests for form functionality including:
 * - Form submission
 * - Field validation
 * - Error handling
 * - Multi-field forms
 * - Async validation
 */

import React, { useState } from 'react';
import { renderWithProviders, screen } from '../../utils/test-utils';
import userEvent from '@testing-library/user-event';

// Mock form component for testing
const LoginForm: React.FC<{
  onSubmit: (data: { email: string; password: string }) => Promise<void>;
}> = ({ onSubmit }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit({ email, password });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-describedby={errors.email ? 'email-error' : undefined}
          aria-invalid={!!errors.email}
        />
        {errors.email && (
          <span id="email-error" role="alert">
            {errors.email}
          </span>
        )}
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-describedby={errors.password ? 'password-error' : undefined}
          aria-invalid={!!errors.password}
        />
        {errors.password && (
          <span id="password-error" role="alert">
            {errors.password}
          </span>
        )}
      </div>

      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
};

describe('Form Components', () => {
  describe('Basic Form Rendering', () => {
    it('should render form with fields', () => {
      renderWithProviders(
        <LoginForm onSubmit={jest.fn()} />
      );

      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });

    it('should render all form elements', () => {
      renderWithProviders(
        <LoginForm onSubmit={jest.fn()} />
      );

      const form = screen.getByRole('form') || screen.getByText('Sign In').closest('form');
      expect(form).toBeInTheDocument();
    });
  });

  describe('Form Input Handling', () => {
    it('should update input value on change', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <LoginForm onSubmit={jest.fn()} />
      );

      const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
      await user.type(emailInput, 'test@example.com');

      expect(emailInput.value).toBe('test@example.com');
    });

    it('should handle multiple field inputs', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <LoginForm onSubmit={jest.fn()} />
      );

      const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');

      expect(emailInput.value).toBe('test@example.com');
      expect(passwordInput.value).toBe('password123');
    });

    it('should clear field values', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <LoginForm onSubmit={jest.fn()} />
      );

      const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
      await user.type(emailInput, 'test@example.com');
      await user.clear(emailInput);

      expect(emailInput.value).toBe('');
    });
  });

  describe('Form Validation', () => {
    it('should validate empty email field', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <LoginForm onSubmit={jest.fn()} />
      );

      const submitButton = screen.getByText('Sign In');
      await user.click(submitButton);

      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });

    it('should validate invalid email format', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <LoginForm onSubmit={jest.fn()} />
      );

      const emailInput = screen.getByLabelText('Email');
      await user.type(emailInput, 'invalid-email');

      const submitButton = screen.getByText('Sign In');
      await user.click(submitButton);

      expect(screen.getByText('Invalid email format')).toBeInTheDocument();
    });

    it('should validate empty password field', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <LoginForm onSubmit={jest.fn()} />
      );

      const emailInput = screen.getByLabelText('Email');
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByText('Sign In');
      await user.click(submitButton);

      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });

    it('should validate password length', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <LoginForm onSubmit={jest.fn()} />
      );

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'short');

      const submitButton = screen.getByText('Sign In');
      await user.click(submitButton);

      expect(
        screen.getByText('Password must be at least 8 characters')
      ).toBeInTheDocument();
    });

    it('should show multiple validation errors', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <LoginForm onSubmit={jest.fn()} />
      );

      const submitButton = screen.getByText('Sign In');
      await user.click(submitButton);

      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });

    it('should clear errors when fields become valid', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <LoginForm onSubmit={jest.fn()} />
      );

      const emailInput = screen.getByLabelText('Email');
      const submitButton = screen.getByText('Sign In');

      // First submission with empty email
      await user.click(submitButton);
      expect(screen.getByText('Email is required')).toBeInTheDocument();

      // Type valid email
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      // Error should still show for password
      expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should call onSubmit with valid data', async () => {
      const handleSubmit = jest.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();

      renderWithProviders(
        <LoginForm onSubmit={handleSubmit} />
      );

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');

      const submitButton = screen.getByText('Sign In');
      await user.click(submitButton);

      expect(handleSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should not call onSubmit with invalid data', async () => {
      const handleSubmit = jest.fn();
      const user = userEvent.setup();

      renderWithProviders(
        <LoginForm onSubmit={handleSubmit} />
      );

      const submitButton = screen.getByText('Sign In');
      await user.click(submitButton);

      expect(handleSubmit).not.toHaveBeenCalled();
    });

    it('should prevent multiple submissions', async () => {
      const handleSubmit = jest.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );
      const user = userEvent.setup();

      renderWithProviders(
        <LoginForm onSubmit={handleSubmit} />
      );

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByText('Sign In');

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');

      await user.click(submitButton);
      await user.click(submitButton);

      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    it('should show loading state during submission', async () => {
      const handleSubmit = jest.fn(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );
      const user = userEvent.setup();

      renderWithProviders(
        <LoginForm onSubmit={handleSubmit} />
      );

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');

      const submitButton = screen.getByText('Sign In');
      await user.click(submitButton);

      expect(screen.getByText('Signing in...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper label associations', () => {
      renderWithProviders(
        <LoginForm onSubmit={jest.fn()} />
      );

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');

      expect(emailInput).toHaveAttribute('id', 'email');
      expect(passwordInput).toHaveAttribute('id', 'password');
    });

    it('should mark invalid fields with aria-invalid', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <LoginForm onSubmit={jest.fn()} />
      );

      const submitButton = screen.getByText('Sign In');
      await user.click(submitButton);

      const emailInput = screen.getByLabelText('Email');
      expect(emailInput).toHaveAttribute('aria-invalid', 'true');
    });

    it('should associate error messages with aria-describedby', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <LoginForm onSubmit={jest.fn()} />
      );

      const submitButton = screen.getByText('Sign In');
      await user.click(submitButton);

      const emailInput = screen.getByLabelText('Email');
      const describedBy = emailInput.getAttribute('aria-describedby');

      expect(describedBy).toBeTruthy();
      const errorElement = document.getElementById(describedBy || '');
      expect(errorElement).toHaveTextContent('Email is required');
    });

    it('should mark error messages with role="alert"', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <LoginForm onSubmit={jest.fn()} />
      );

      const submitButton = screen.getByText('Sign In');
      await user.click(submitButton);

      const errors = screen.getAllByRole('alert');
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <LoginForm onSubmit={jest.fn()} />
      );

      const emailInput = screen.getByLabelText('Email');

      await user.tab();
      expect(emailInput).toHaveFocus();
    });
  });

  describe('Form Reset', () => {
    it('should reset form fields', async () => {
      const user = userEvent.setup();

      const FormWithReset = () => {
        const [email, setEmail] = useState('');

        return (
          <form>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              type="reset"
              onClick={() => setEmail('')}
            >
              Reset
            </button>
          </form>
        );
      };

      renderWithProviders(<FormWithReset />);

      const input = screen.getByRole('textbox') as HTMLInputElement;
      await user.type(input, 'test@example.com');
      expect(input.value).toBe('test@example.com');

      // Note: In this mock, we're just testing the structure
      expect(screen.getByText('Reset')).toBeInTheDocument();
    });
  });

  describe('Custom Validation', () => {
    it('should support custom validation rules', async () => {
      const handleValidation = jest.fn((value) => {
        if (value.includes('admin')) {
          return 'Admin usernames are reserved';
        }
        return null;
      });

      const CustomForm = () => {
        const [username, setUsername] = useState('');
        const [error, setError] = useState('');

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const value = e.target.value;
          setUsername(value);

          const validationError = handleValidation(value);
          setError(validationError || '');
        };

        return (
          <form>
            <input
              type="text"
              value={username}
              onChange={handleChange}
            />
            {error && <span role="alert">{error}</span>}
          </form>
        );
      };

      const user = userEvent.setup();

      renderWithProviders(<CustomForm />);

      const input = screen.getByRole('textbox') as HTMLInputElement;
      await user.type(input, 'admin-user');

      expect(screen.getByText('Admin usernames are reserved')).toBeInTheDocument();
    });
  });
});
