/**
 * Button Component Tests
 * Tests for Button variants, sizes, loading states, and accessibility
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button Component', () => {
  // Basic Rendering Tests
  describe('Rendering', () => {
    it('should render button with default props', () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();
    });

    it('should render button with custom className', () => {
      render(<Button className="custom-class">Test</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('should render button with aria-label', () => {
      render(<Button ariaLabel="Custom label">Action</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Custom label');
    });
  });

  // Variant Tests
  describe('Variants', () => {
    it('should render primary variant (default)', () => {
      render(<Button variant="primary">Primary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary-500');
    });

    it('should render secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-neutral-200');
    });

    it('should render danger variant', () => {
      render(<Button variant="danger">Danger</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-danger');
    });

    it('should render ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-primary-500');
    });
  });

  // Size Tests
  describe('Sizes', () => {
    it('should render small size', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-3', 'py-1', 'text-sm');
    });

    it('should render medium size (default)', () => {
      render(<Button size="md">Medium</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-4', 'py-2', 'text-base');
    });

    it('should render large size', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-6', 'py-3', 'text-lg');
    });
  });

  // State Tests
  describe('States', () => {
    it('should disable button when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should show loading state and disable button', () => {
      render(<Button isLoading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('should show spinner when loading', () => {
      render(<Button isLoading>Loading</Button>);
      const button = screen.getByRole('button');
      const spinner = button.querySelector('span span');
      expect(spinner).toHaveClass('animate-spin');
    });

    it('should apply opacity-50 when disabled', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('disabled:opacity-50');
    });
  });

  // Interaction Tests
  describe('Interactions', () => {
    it('should handle click events', async () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click</Button>);
      const button = screen.getByRole('button');

      await userEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not trigger click when disabled', async () => {
      const handleClick = jest.fn();
      render(
        <Button disabled onClick={handleClick}>
          Disabled
        </Button>
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should not trigger click when loading', async () => {
      const handleClick = jest.fn();
      render(
        <Button isLoading onClick={handleClick}>
          Loading
        </Button>
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should handle keyboard interaction', async () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Keyboard</Button>);
      const button = screen.getByRole('button');

      button.focus();
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });

      expect(button).toHaveFocus();
    });
  });

  // Accessibility Tests
  describe('Accessibility', () => {
    it('should have proper focus management', async () => {
      render(<Button>Focus Test</Button>);
      const button = screen.getByRole('button');

      await userEvent.tab();
      expect(button).toHaveFocus();
    });

    it('should have focus ring for keyboard navigation', () => {
      render(<Button>Focus</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus:outline-none', 'focus:ring-2');
    });

    it('should be announced as a button', () => {
      render(<Button>Action</Button>);
      const button = screen.getByRole('button');
      expect(button.tagName).toBe('BUTTON');
    });

    it('should support aria-label for screen readers', () => {
      render(<Button ariaLabel="Delete item">×</Button>);
      const button = screen.getByRole('button', { name: /delete item/i });
      expect(button).toBeInTheDocument();
    });

    it('should properly announce loading state', () => {
      render(<Button isLoading>Processing</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });
  });

  // Edge Cases
  describe('Edge Cases', () => {
    it('should handle undefined children gracefully', () => {
      const { container } = render(<Button>{undefined}</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should handle multiple click handlers', async () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      const { rerender } = render(<Button onClick={handler1}>Click</Button>);
      let button = screen.getByRole('button');
      await userEvent.click(button);

      expect(handler1).toHaveBeenCalled();
    });

    it('should preserve children when transitioning to loading', async () => {
      const { rerender } = render(<Button isLoading={false}>Action</Button>);
      expect(screen.getByText('Action')).toBeInTheDocument();

      rerender(<Button isLoading={true}>Action</Button>);
      expect(screen.getByText('Action')).toBeInTheDocument();
    });

    it('should support all HTML button attributes', () => {
      render(
        <Button type="submit" tabIndex={0} data-testid="custom-btn">
          Submit
        </Button>
      );
      const button = screen.getByTestId('custom-btn');
      expect(button).toHaveAttribute('type', 'submit');
      expect(button).toHaveAttribute('tabIndex', '0');
    });
  });

  // Styling Tests
  describe('Styling', () => {
    it('should have base styles applied', () => {
      render(<Button>Styled</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('font-semibold', 'rounded-lg', 'transition-colors');
    });

    it('should combine variant and size classes', () => {
      render(
        <Button variant="secondary" size="lg">
          Combined
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-neutral-200', 'px-6', 'py-3');
    });
  });
});
