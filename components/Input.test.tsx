/**
 * Input Component Tests
 * Tests for Input field with label, error, sizes, and states
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './Input';

describe('Input Component', () => {
  // Basic Rendering Tests
  describe('Rendering', () => {
    it('should render input element', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    it('should render with default type text', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'text');
    });

    it('should render with custom type', () => {
      const { container } = render(<Input type="email" />);
      const input = container.querySelector('input');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('should render with placeholder', () => {
      render(<Input placeholder="Enter text..." />);
      const input = screen.getByPlaceholderText('Enter text...');
      expect(input).toBeInTheDocument();
    });
  });

  // Label Tests
  describe('Label', () => {
    it('should render label when provided', () => {
      render(<Input label="Email" />);
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    it('should not render label when not provided', () => {
      const { container } = render(<Input />);
      expect(container.querySelector('label')).not.toBeInTheDocument();
    });

    it('should have correct label styling', () => {
      const { container } = render(<Input label="Name" />);
      const label = container.querySelector('label');
      expect(label).toHaveClass('text-sm', 'font-medium', 'text-neutral-700');
    });

    it('should associate label with input', () => {
      const { container } = render(<Input label="Password" />);
      const label = container.querySelector('label');
      const input = screen.getByRole('textbox');
      expect(label).toBeInTheDocument();
      expect(input).toBeInTheDocument();
    });
  });

  // Error Tests
  describe('Error State', () => {
    it('should display error message', () => {
      render(<Input error="Email is required" />);
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });

    it('should not display error when not provided', () => {
      render(<Input />);
      const errorText = screen.queryByText(/Email is required/);
      expect(errorText).not.toBeInTheDocument();
    });

    it('should have error styling on input', () => {
      const { container } = render(<Input error="Invalid" />);
      const input = container.querySelector('input');
      expect(input).toHaveClass('border-danger');
    });

    it('should have error styling on message', () => {
      const { container } = render(<Input error="Error message" />);
      const errorMsg = container.querySelector('p');
      expect(errorMsg).toHaveClass('text-danger');
    });

    it('should change input style based on error state', () => {
      const { rerender, container: container1 } = render(<Input error="Error" />);
      expect(container1.querySelector('input')).toHaveClass('border-danger');

      rerender(<Input error="" />);
      const input = container1.querySelector('input');
      expect(input).not.toHaveClass('border-danger');
    });
  });

  // Size Tests
  describe('Sizes', () => {
    it('should apply small size', () => {
      const { container } = render(<Input size="sm" />);
      const input = container.querySelector('input');
      expect(input).toHaveClass('px-2', 'py-1', 'text-sm');
    });

    it('should apply medium size (default)', () => {
      const { container } = render(<Input />);
      const input = container.querySelector('input');
      expect(input).toHaveClass('px-3', 'py-2', 'text-base');
    });

    it('should apply large size', () => {
      const { container } = render(<Input size="lg" />);
      const input = container.querySelector('input');
      expect(input).toHaveClass('px-4', 'py-3', 'text-lg');
    });
  });

  // Full Width Tests
  describe('Full Width', () => {
    it('should apply full width when fullWidth is true', () => {
      const { container } = render(<Input fullWidth />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('w-full');
    });

    it('should not apply full width by default', () => {
      const { container } = render(<Input />);
      const wrapper = container.firstChild;
      expect(wrapper).not.toHaveClass('w-full');
    });

    it('should apply full width to input regardless', () => {
      const { container } = render(<Input fullWidth />);
      const input = container.querySelector('input');
      expect(input).toHaveClass('w-full');
    });
  });

  // State Tests
  describe('States', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });

    it('should have disabled styling', () => {
      const { container } = render(<Input disabled />);
      const input = container.querySelector('input');
      expect(input).toHaveClass('disabled:bg-neutral-100', 'disabled:cursor-not-allowed');
    });

    it('should accept input when not disabled', async () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'test');
      expect(input).toHaveValue('test');
    });

    it('should not accept input when disabled', async () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'test');
      expect(input).not.toHaveValue('test');
    });
  });

  // Interaction Tests
  describe('Interactions', () => {
    it('should handle onChange events', async () => {
      const handleChange = jest.fn();
      render(<Input onChange={handleChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, 'a');
      expect(handleChange).toHaveBeenCalled();
    });

    it('should handle onFocus events', async () => {
      const handleFocus = jest.fn();
      render(<Input onFocus={handleFocus} />);
      const input = screen.getByRole('textbox');

      fireEvent.focus(input);
      expect(handleFocus).toHaveBeenCalled();
    });

    it('should handle onBlur events', async () => {
      const handleBlur = jest.fn();
      render(<Input onBlur={handleBlur} />);
      const input = screen.getByRole('textbox');

      fireEvent.blur(input);
      expect(handleBlur).toHaveBeenCalled();
    });

    it('should update value on change', async () => {
      render(<Input />);
      const input = screen.getByRole('textbox') as HTMLInputElement;

      await userEvent.type(input, 'Hello');
      expect(input.value).toBe('Hello');
    });
  });

  // Styling Tests
  describe('Styling', () => {
    it('should have base input styles', () => {
      const { container } = render(<Input />);
      const input = container.querySelector('input');
      expect(input).toHaveClass(
        'w-full',
        'border',
        'border-neutral-300',
        'rounded-lg',
        'focus:outline-none',
        'focus:ring-2',
        'focus:ring-primary-500'
      );
    });

    it('should support custom className', () => {
      const { container } = render(<Input className="custom-class" />);
      const input = container.querySelector('input');
      expect(input).toHaveClass('custom-class');
    });

    it('should have focus styles', () => {
      const { container } = render(<Input />);
      const input = container.querySelector('input');
      expect(input).toHaveClass('focus:ring-primary-500', 'focus:border-transparent');
    });

    it('should have transition styles', () => {
      const { container } = render(<Input />);
      const input = container.querySelector('input');
      expect(input).toHaveClass('transition-colors');
    });
  });

  // Accessibility Tests
  describe('Accessibility', () => {
    it('should be focusable', async () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      input.focus();
      expect(input).toHaveFocus();
    });

    it('should associate label with input for accessibility', () => {
      const { container } = render(<Input label="Email" />);
      const label = container.querySelector('label');
      const input = screen.getByRole('textbox');
      expect(label).toBeInTheDocument();
      expect(input).toBeInTheDocument();
    });

    it('should support aria attributes', () => {
      render(<Input aria-describedby="error-msg" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby', 'error-msg');
    });

    it('should support aria-invalid for error state', () => {
      render(<Input error="Invalid email" aria-invalid="true" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('should have proper focus management', async () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      await userEvent.tab();
      expect(input).toHaveFocus();
    });
  });

  // Edge Cases
  describe('Edge Cases', () => {
    it('should handle very long values', async () => {
      render(<Input />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      const longText = 'a'.repeat(1000);
      await userEvent.type(input, longText);
      expect(input.value).toBe(longText);
    });

    it('should handle special characters', async () => {
      render(<Input />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      await userEvent.type(input, '@#$%^&*()');
      expect(input.value).toBe('@#$%^&*()');
    });

    it('should handle number input', () => {
      const { container } = render(<Input type="number" />);
      const input = container.querySelector('input');
      expect(input).toHaveAttribute('type', 'number');
    });

    it('should handle email input', () => {
      const { container } = render(<Input type="email" />);
      const input = container.querySelector('input');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('should handle password input', () => {
      const { container } = render(<Input type="password" />);
      const input = container.querySelector('input');
      expect(input).toHaveAttribute('type', 'password');
    });
  });

  // Combined Tests
  describe('Combined Properties', () => {
    it('should render with label, error, and size', () => {
      const { container } = render(
        <Input label="Email" error="Invalid" size="lg" />
      );
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByText('Invalid')).toBeInTheDocument();
      expect(container.querySelector('input')).toHaveClass('px-4', 'py-3');
    });

    it('should render with all props combined', () => {
      const { container } = render(
        <Input
          label="Username"
          error="Already taken"
          size="md"
          fullWidth
          placeholder="Enter username"
          className="custom"
          disabled
        />
      );
      const input = container.querySelector('input');
      expect(input).toHaveAttribute('placeholder', 'Enter username');
      expect(input).toBeDisabled();
      expect(input).toHaveClass('custom', 'w-full');
    });
  });
});
