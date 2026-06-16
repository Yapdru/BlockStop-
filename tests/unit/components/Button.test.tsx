/**
 * Button Component Tests
 *
 * Comprehensive tests for Button component including:
 * - Rendering and variants
 * - Props handling
 * - Accessibility
 * - User interactions
 * - Loading states
 */

import React from 'react';
import { Button } from '../../../design-system/components/Button';
import { renderWithProviders, screen } from '../../utils/test-utils';
import userEvent from '@testing-library/user-event';

describe('Button Component', () => {
  it('should render button with children', () => {
    renderWithProviders(<Button>Click me</Button>);

    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  describe('Variants', () => {
    it('should render primary variant', () => {
      renderWithProviders(<Button variant="primary">Primary</Button>);

      const button = screen.getByRole('button', { name: /primary/i });
      expect(button).toHaveClass('bg-blue-600');
    });

    it('should render secondary variant', () => {
      renderWithProviders(<Button variant="secondary">Secondary</Button>);

      const button = screen.getByRole('button', { name: /secondary/i });
      expect(button).toHaveClass('bg-purple-600');
    });

    it('should render ghost variant', () => {
      renderWithProviders(<Button variant="ghost">Ghost</Button>);

      const button = screen.getByRole('button', { name: /ghost/i });
      expect(button).toHaveClass('bg-transparent');
    });

    it('should render danger variant', () => {
      renderWithProviders(<Button variant="danger">Delete</Button>);

      const button = screen.getByRole('button', { name: /delete/i });
      expect(button).toHaveClass('bg-red-600');
    });
  });

  describe('Sizes', () => {
    it('should render small size', () => {
      renderWithProviders(<Button size="sm">Small</Button>);

      const button = screen.getByRole('button', { name: /small/i });
      expect(button).toHaveClass('h-8');
      expect(button).toHaveClass('px-3');
      expect(button).toHaveClass('text-sm');
    });

    it('should render medium size', () => {
      renderWithProviders(<Button size="md">Medium</Button>);

      const button = screen.getByRole('button', { name: /medium/i });
      expect(button).toHaveClass('h-10');
      expect(button).toHaveClass('px-4');
      expect(button).toHaveClass('text-base');
    });

    it('should render large size', () => {
      renderWithProviders(<Button size="lg">Large</Button>);

      const button = screen.getByRole('button', { name: /large/i });
      expect(button).toHaveClass('h-12');
      expect(button).toHaveClass('px-6');
      expect(button).toHaveClass('text-lg');
    });
  });

  describe('States', () => {
    it('should be disabled when disabled prop is true', () => {
      renderWithProviders(<Button disabled>Disabled</Button>);

      const button = screen.getByRole('button', { name: /disabled/i });
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('should show loading state', () => {
      renderWithProviders(<Button isLoading>Loading</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('should show loading text when loading', () => {
      renderWithProviders(
        <Button isLoading loadingText="Processing...">
          Submit
        </Button>
      );

      expect(screen.getByText('Processing...')).toBeInTheDocument();
      expect(screen.queryByText('Submit')).not.toBeInTheDocument();
    });

    it('should show spinner during loading', () => {
      renderWithProviders(<Button isLoading>Submit</Button>);

      const spinner = screen.getByRole('button').querySelector('svg');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('animate-spin');
    });
  });

  describe('Full Width', () => {
    it('should take full width when fullWidth prop is true', () => {
      renderWithProviders(<Button fullWidth>Full Width</Button>);

      const button = screen.getByRole('button', { name: /full width/i });
      expect(button).toHaveClass('w-full');
    });
  });

  describe('Click Handling', () => {
    it('should call onClick handler when clicked', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      renderWithProviders(<Button onClick={handleClick}>Click</Button>);

      const button = screen.getByRole('button', { name: /click/i });
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      renderWithProviders(
        <Button disabled onClick={handleClick}>
          Disabled
        </Button>
      );

      const button = screen.getByRole('button', { name: /disabled/i });
      await user.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should not call onClick when loading', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      renderWithProviders(
        <Button isLoading onClick={handleClick}>
          Submit
        </Button>
      );

      const button = screen.getByRole('button');
      await user.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      renderWithProviders(<Button>Submit</Button>);

      const button = screen.getByRole('button', { name: /submit/i });
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('should be keyboard accessible', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      renderWithProviders(<Button onClick={handleClick}>Submit</Button>);

      const button = screen.getByRole('button', { name: /submit/i });
      button.focus();

      expect(button).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalled();
    });

    it('should have visible focus state', () => {
      renderWithProviders(<Button>Focus</Button>);

      const button = screen.getByRole('button', { name: /focus/i });
      expect(button).toHaveClass('focus:outline-none', 'focus:ring-2');
    });

    it('should indicate disabled state to screen readers', () => {
      renderWithProviders(<Button disabled>Disabled</Button>);

      const button = screen.getByRole('button', { name: /disabled/i });
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('should indicate loading state to screen readers', () => {
      renderWithProviders(<Button isLoading>Loading</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      renderWithProviders(
        <Button className="custom-class">Custom</Button>
      );

      const button = screen.getByRole('button', { name: /custom/i });
      expect(button).toHaveClass('custom-class');
    });

    it('should merge custom className with default styles', () => {
      renderWithProviders(
        <Button className="custom-padding" variant="primary">
          Custom
        </Button>
      );

      const button = screen.getByRole('button', { name: /custom/i });
      expect(button).toHaveClass('custom-padding');
      expect(button).toHaveClass('bg-blue-600');
    });
  });

  describe('HTML Attributes', () => {
    it('should support standard button attributes', () => {
      renderWithProviders(
        <Button aria-label="custom-label" data-testid="custom-button">
          Button
        </Button>
      );

      const button = screen.getByTestId('custom-button');
      expect(button).toHaveAttribute('aria-label', 'custom-label');
    });

    it('should support form attributes', () => {
      renderWithProviders(
        <Button type="submit" form="my-form">
          Submit
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
      expect(button).toHaveAttribute('form', 'my-form');
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref to button element', () => {
      const ref = React.createRef<HTMLButtonElement>();
      renderWithProviders(<Button ref={ref}>Button</Button>);

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current?.textContent).toBe('Button');
    });

    it('should allow ref to be used imperatively', () => {
      const ref = React.createRef<HTMLButtonElement>();
      renderWithProviders(<Button ref={ref}>Focus</Button>);

      expect(ref.current).not.toHaveFocus();
      ref.current?.focus();
      expect(ref.current).toHaveFocus();
    });
  });

  describe('Edge Cases', () => {
    it('should render with empty children', () => {
      renderWithProviders(<Button />);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should handle multiple children', () => {
      renderWithProviders(
        <Button>
          <span>Icon</span>
          <span>Text</span>
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('IconText');
    });

    it('should handle long text gracefully', () => {
      const longText = 'This is a very long button text that might wrap';
      renderWithProviders(<Button>{longText}</Button>);

      const button = screen.getByRole('button', { name: new RegExp(longText) });
      expect(button).toBeVisible();
    });
  });
});
