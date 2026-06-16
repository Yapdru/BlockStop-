/**
 * Input Component Tests
 *
 * Comprehensive tests for Input component including:
 * - Rendering and variants
 * - Value handling
 * - Validation
 * - Accessibility
 * - User interactions
 */

import React from 'react';
import { Input } from '../../../design-system/components/Input';
import { renderWithProviders, screen } from '../../utils/test-utils';
import userEvent from '@testing-library/user-event';

describe('Input Component', () => {
  it('should render input element', () => {
    renderWithProviders(<Input data-testid="test-input" />);

    const input = screen.getByTestId('test-input');
    expect(input).toBeInTheDocument();
    expect(input).toBeInstanceOf(HTMLInputElement);
  });

  describe('Input Types', () => {
    it('should render text input', () => {
      renderWithProviders(<Input type="text" data-testid="text-input" />);

      const input = screen.getByTestId('text-input') as HTMLInputElement;
      expect(input.type).toBe('text');
    });

    it('should render email input', () => {
      renderWithProviders(<Input type="email" data-testid="email-input" />);

      const input = screen.getByTestId('email-input') as HTMLInputElement;
      expect(input.type).toBe('email');
    });

    it('should render password input', () => {
      renderWithProviders(<Input type="password" data-testid="password-input" />);

      const input = screen.getByTestId('password-input') as HTMLInputElement;
      expect(input.type).toBe('password');
    });

    it('should render number input', () => {
      renderWithProviders(<Input type="number" data-testid="number-input" />);

      const input = screen.getByTestId('number-input') as HTMLInputElement;
      expect(input.type).toBe('number');
    });
  });

  describe('Placeholder and Label', () => {
    it('should display placeholder text', () => {
      renderWithProviders(
        <Input placeholder="Enter your email" data-testid="test-input" />
      );

      const input = screen.getByPlaceholderText('Enter your email');
      expect(input).toBeInTheDocument();
    });

    it('should display label when provided', () => {
      renderWithProviders(
        <Input label="Email Address" placeholder="email@example.com" />
      );

      const label = screen.getByText('Email Address');
      expect(label).toBeInTheDocument();
    });

    it('should associate label with input', () => {
      renderWithProviders(
        <Input label="Username" id="username" data-testid="test-input" />
      );

      const label = screen.getByText('Username');
      const input = screen.getByTestId('test-input');

      expect(label.getAttribute('for')).toBe('username');
    });
  });

  describe('Value Handling', () => {
    it('should accept value prop', () => {
      renderWithProviders(
        <Input value="test value" onChange={() => {}} data-testid="test-input" />
      );

      const input = screen.getByTestId('test-input') as HTMLInputElement;
      expect(input.value).toBe('test value');
    });

    it('should call onChange handler when value changes', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();

      renderWithProviders(
        <Input onChange={handleChange} data-testid="test-input" />
      );

      const input = screen.getByTestId('test-input');
      await user.type(input, 'hello');

      expect(handleChange).toHaveBeenCalled();
      expect(handleChange).toHaveBeenCalledTimes(5);
    });

    it('should handle controlled input', async () => {
      const { rerender } = renderWithProviders(
        <Input value="initial" onChange={() => {}} data-testid="test-input" />
      );

      let input = screen.getByTestId('test-input') as HTMLInputElement;
      expect(input.value).toBe('initial');

      rerender(
        <Input value="updated" onChange={() => {}} data-testid="test-input" />
      );

      input = screen.getByTestId('test-input') as HTMLInputElement;
      expect(input.value).toBe('updated');
    });
  });

  describe('Validation States', () => {
    it('should display error state', () => {
      renderWithProviders(
        <Input error="Email is invalid" data-testid="test-input" />
      );

      const input = screen.getByTestId('test-input');
      expect(input).toHaveAttribute('aria-invalid', 'true');

      const error = screen.getByText('Email is invalid');
      expect(error).toBeInTheDocument();
      expect(error).toHaveClass('text-red-600');
    });

    it('should display success state', () => {
      renderWithProviders(
        <Input success="Email is valid" data-testid="test-input" />
      );

      const input = screen.getByTestId('test-input');
      expect(input).toHaveClass('border-green-500');

      const message = screen.getByText('Email is valid');
      expect(message).toBeInTheDocument();
    });

    it('should display required indicator', () => {
      renderWithProviders(
        <Input label="Email" required data-testid="test-input" />
      );

      const label = screen.getByText(/Email/);
      expect(label).toHaveTextContent('*');
    });

    it('should have aria-required attribute when required', () => {
      renderWithProviders(
        <Input required data-testid="test-input" />
      );

      const input = screen.getByTestId('test-input');
      expect(input).toHaveAttribute('required');
    });
  });

  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', () => {
      renderWithProviders(
        <Input disabled data-testid="test-input" />
      );

      const input = screen.getByTestId('test-input') as HTMLInputElement;
      expect(input.disabled).toBe(true);
    });

    it('should not accept input when disabled', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();

      renderWithProviders(
        <Input disabled onChange={handleChange} data-testid="test-input" />
      );

      const input = screen.getByTestId('test-input');
      // User won't be able to type in a disabled input
      await user.type(input, 'test', { force: true });

      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('Icon Support', () => {
    it('should render icon when provided', () => {
      renderWithProviders(
        <Input
          icon={<span data-testid="test-icon">🔍</span>}
          data-testid="test-input"
        />
      );

      const icon = screen.getByTestId('test-icon');
      expect(icon).toBeInTheDocument();
    });

    it('should render clear button icon when provided', () => {
      renderWithProviders(
        <Input
          value="test"
          clearable
          onClear={jest.fn()}
          data-testid="test-input"
        />
      );

      const clearButton = screen.getByRole('button', { name: /clear/i });
      expect(clearButton).toBeInTheDocument();
    });

    it('should call onClear when clear button is clicked', async () => {
      const handleClear = jest.fn();
      const user = userEvent.setup();

      renderWithProviders(
        <Input
          value="test"
          clearable
          onClear={handleClear}
          data-testid="test-input"
        />
      );

      const clearButton = screen.getByRole('button', { name: /clear/i });
      await user.click(clearButton);

      expect(handleClear).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible name', () => {
      renderWithProviders(
        <Input aria-label="Search" data-testid="test-input" />
      );

      const input = screen.getByLabelText('Search');
      expect(input).toBeInTheDocument();
    });

    it('should have aria-describedby for error messages', () => {
      renderWithProviders(
        <Input
          id="email-input"
          error="Email is invalid"
          data-testid="test-input"
        />
      );

      const input = screen.getByTestId('test-input');
      expect(input).toHaveAttribute('aria-describedby');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('should be keyboard accessible', async () => {
      const handleFocus = jest.fn();
      const user = userEvent.setup();

      renderWithProviders(
        <Input onFocus={handleFocus} data-testid="test-input" />
      );

      const input = screen.getByTestId('test-input');
      await user.tab();

      expect(input).toHaveFocus();
      expect(handleFocus).toHaveBeenCalled();
    });

    it('should support form submission with Enter key', async () => {
      const handleSubmit = jest.fn((e) => e.preventDefault());
      const user = userEvent.setup();

      renderWithProviders(
        <form onSubmit={handleSubmit}>
          <Input data-testid="test-input" />
        </form>
      );

      const input = screen.getByTestId('test-input');
      await user.type(input, 'test{Enter}');

      expect(handleSubmit).toHaveBeenCalled();
    });
  });

  describe('Focus Management', () => {
    it('should call onFocus when focused', async () => {
      const handleFocus = jest.fn();
      const user = userEvent.setup();

      renderWithProviders(
        <Input onFocus={handleFocus} data-testid="test-input" />
      );

      const input = screen.getByTestId('test-input');
      await user.click(input);

      expect(handleFocus).toHaveBeenCalled();
    });

    it('should call onBlur when blurred', async () => {
      const handleBlur = jest.fn();
      const user = userEvent.setup();

      renderWithProviders(
        <Input onBlur={handleBlur} data-testid="test-input" />
      );

      const input = screen.getByTestId('test-input');
      await user.click(input);
      await user.tab();

      expect(handleBlur).toHaveBeenCalled();
    });

    it('should support ref forwarding for focus', () => {
      const ref = React.createRef<HTMLInputElement>();
      renderWithProviders(<Input ref={ref} data-testid="test-input" />);

      expect(ref.current).toBeInstanceOf(HTMLInputElement);
      ref.current?.focus();
      expect(ref.current).toHaveFocus();
    });
  });

  describe('Size Variants', () => {
    it('should render small size', () => {
      renderWithProviders(
        <Input size="sm" data-testid="test-input" />
      );

      const input = screen.getByTestId('test-input');
      expect(input).toHaveClass('h-8', 'px-3', 'text-sm');
    });

    it('should render medium size', () => {
      renderWithProviders(
        <Input size="md" data-testid="test-input" />
      );

      const input = screen.getByTestId('test-input');
      expect(input).toHaveClass('h-10', 'px-4', 'text-base');
    });

    it('should render large size', () => {
      renderWithProviders(
        <Input size="lg" data-testid="test-input" />
      );

      const input = screen.getByTestId('test-input');
      expect(input).toHaveClass('h-12', 'px-6', 'text-lg');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long input values', async () => {
      const longValue = 'a'.repeat(1000);
      const user = userEvent.setup();

      renderWithProviders(
        <Input data-testid="test-input" />
      );

      const input = screen.getByTestId('test-input') as HTMLInputElement;
      await user.type(input, longValue);

      expect(input.value.length).toBeGreaterThan(0);
    });

    it('should handle special characters', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <Input data-testid="test-input" />
      );

      const input = screen.getByTestId('test-input') as HTMLInputElement;
      await user.type(input, '@#$%^&*()');

      expect(input.value).toContain('@');
    });

    it('should handle paste events', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <Input data-testid="test-input" />
      );

      const input = screen.getByTestId('test-input');
      await user.click(input);
      await user.paste('pasted text');

      expect((input as HTMLInputElement).value).toBe('pasted text');
    });
  });
});
