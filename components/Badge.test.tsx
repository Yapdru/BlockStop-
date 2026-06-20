/**
 * Badge Component Tests
 * Tests for Badge variants and styling
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

describe('Badge Component', () => {
  // Basic Rendering Tests
  describe('Rendering', () => {
    it('should render badge with children', () => {
      render(<Badge>New</Badge>);
      expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('should render as span element', () => {
      const { container } = render(<Badge>Badge</Badge>);
      expect(container.querySelector('span')).toBeInTheDocument();
    });

    it('should render with multiple children', () => {
      render(
        <Badge>
          <span>Icon</span>
          <span>Text</span>
        </Badge>
      );
      expect(screen.getByText('Icon')).toBeInTheDocument();
      expect(screen.getByText('Text')).toBeInTheDocument();
    });

    it('should render inline element', () => {
      const { container } = render(<Badge>Inline</Badge>);
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('inline-flex');
    });
  });

  // Variant Tests
  describe('Variants', () => {
    it('should render primary variant (default)', () => {
      const { container } = render(<Badge variant="primary">Primary</Badge>);
      const badge = container.firstChild;
      expect(badge).toHaveClass('bg-primary-100', 'text-primary-700');
    });

    it('should render success variant', () => {
      const { container } = render(<Badge variant="success">Success</Badge>);
      const badge = container.firstChild;
      expect(badge).toHaveClass('bg-success/10', 'text-success');
    });

    it('should render warning variant', () => {
      const { container } = render(<Badge variant="warning">Warning</Badge>);
      const badge = container.firstChild;
      expect(badge).toHaveClass('bg-warning/10', 'text-warning');
    });

    it('should render danger variant', () => {
      const { container } = render(<Badge variant="danger">Danger</Badge>);
      const badge = container.firstChild;
      expect(badge).toHaveClass('bg-danger/10', 'text-danger');
    });

    it('should render info variant', () => {
      const { container } = render(<Badge variant="info">Info</Badge>);
      const badge = container.firstChild;
      expect(badge).toHaveClass('bg-info/10', 'text-info');
    });

    it('should apply correct colors for each variant', () => {
      const variants = [
        { variant: 'primary' as const, expectedClasses: ['bg-primary-100', 'text-primary-700'] },
        { variant: 'success' as const, expectedClasses: ['bg-success/10', 'text-success'] },
        { variant: 'warning' as const, expectedClasses: ['bg-warning/10', 'text-warning'] },
        { variant: 'danger' as const, expectedClasses: ['bg-danger/10', 'text-danger'] },
        { variant: 'info' as const, expectedClasses: ['bg-info/10', 'text-info'] },
      ];

      variants.forEach(({ variant, expectedClasses }) => {
        const { container } = render(<Badge variant={variant}>Test</Badge>);
        const badge = container.firstChild;
        expectedClasses.forEach((cls) => {
          expect(badge).toHaveClass(cls);
        });
      });
    });
  });

  // Styling Tests
  describe('Styling', () => {
    it('should have base badge styles', () => {
      const { container } = render(<Badge>Styled</Badge>);
      const badge = container.firstChild;
      expect(badge).toHaveClass('inline-flex', 'items-center', 'rounded-full', 'text-xs', 'font-semibold');
    });

    it('should have padding', () => {
      const { container } = render(<Badge>Padded</Badge>);
      const badge = container.firstChild;
      expect(badge).toHaveClass('px-3', 'py-1');
    });

    it('should support custom className', () => {
      const { container } = render(<Badge className="custom-badge">Custom</Badge>);
      const badge = container.firstChild;
      expect(badge).toHaveClass('custom-badge');
    });

    it('should combine variant and custom classes', () => {
      const { container } = render(
        <Badge variant="danger" className="uppercase">
          Alert
        </Badge>
      );
      const badge = container.firstChild;
      expect(badge).toHaveClass('bg-danger/10', 'text-danger', 'uppercase');
    });
  });

  // Content Tests
  describe('Content', () => {
    it('should render text content', () => {
      render(<Badge>Label</Badge>);
      expect(screen.getByText('Label')).toBeInTheDocument();
    });

    it('should render numeric content', () => {
      render(<Badge>{42}</Badge>);
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('should render icon with text', () => {
      render(
        <Badge>
          ✓ Done
        </Badge>
      );
      expect(screen.getByText(/Done/)).toBeInTheDocument();
    });

    it('should render JSX content', () => {
      render(
        <Badge>
          <strong>Important</strong>
        </Badge>
      );
      expect(screen.getByText('Important')).toBeInTheDocument();
    });

    it('should handle long text', () => {
      render(<Badge>This is a very long badge text that should still display</Badge>);
      expect(
        screen.getByText(/This is a very long badge text/)
      ).toBeInTheDocument();
    });
  });

  // HTML Attributes Tests
  describe('HTML Attributes', () => {
    it('should support data attributes', () => {
      const { container } = render(
        <Badge data-testid="badge-1" data-status="active">
          Active
        </Badge>
      );
      const badge = container.firstChild;
      expect(badge).toHaveAttribute('data-testid', 'badge-1');
      expect(badge).toHaveAttribute('data-status', 'active');
    });

    it('should support id attribute', () => {
      const { container } = render(<Badge id="status-badge">Status</Badge>);
      const badge = container.firstChild;
      expect(badge).toHaveAttribute('id', 'status-badge');
    });

    it('should support style prop', () => {
      const { container } = render(
        <Badge style={{ opacity: 0.8 }}>Faded</Badge>
      );
      const badge = container.firstChild as HTMLElement;
      expect(badge.style.opacity).toBe('0.8');
    });

    it('should support aria attributes', () => {
      const { container } = render(
        <Badge aria-label="New notification" role="status">
          1
        </Badge>
      );
      const badge = container.firstChild;
      expect(badge).toHaveAttribute('aria-label', 'New notification');
      expect(badge).toHaveAttribute('role', 'status');
    });

    it('should support className and other props together', () => {
      const { container } = render(
        <Badge
          variant="success"
          className="custom"
          data-testid="success-badge"
          title="Successfully completed"
        >
          Complete
        </Badge>
      );
      const badge = container.firstChild;
      expect(badge).toHaveClass('bg-success/10', 'custom');
      expect(badge).toHaveAttribute('data-testid', 'success-badge');
      expect(badge).toHaveAttribute('title', 'Successfully completed');
    });
  });

  // Accessibility Tests
  describe('Accessibility', () => {
    it('should have semantic role attributes', () => {
      const { container } = render(<Badge role="status">Status</Badge>);
      const badge = container.firstChild;
      expect(badge).toHaveAttribute('role', 'status');
    });

    it('should support aria-label for context', () => {
      const { container } = render(
        <Badge aria-label="2 new messages">2</Badge>
      );
      const badge = container.firstChild;
      expect(badge).toHaveAttribute('aria-label', '2 new messages');
    });

    it('should work with screen readers', () => {
      render(<Badge role="status">Online</Badge>);
      expect(screen.getByText('Online')).toHaveAttribute('role', 'status');
    });

    it('should support live regions for updates', () => {
      const { container } = render(
        <Badge aria-live="polite" aria-atomic="true">
          New message
        </Badge>
      );
      const badge = container.firstChild;
      expect(badge).toHaveAttribute('aria-live', 'polite');
      expect(badge).toHaveAttribute('aria-atomic', 'true');
    });
  });

  // Size Tests
  describe('Size', () => {
    it('should have consistent sizing across variants', () => {
      const variants = ['primary', 'success', 'warning', 'danger', 'info'] as const;
      variants.forEach((variant) => {
        const { container } = render(<Badge variant={variant}>Test</Badge>);
        const badge = container.firstChild;
        expect(badge).toHaveClass('px-3', 'py-1', 'text-xs');
      });
    });

    it('should display text as small', () => {
      const { container } = render(<Badge>Small Text</Badge>);
      const badge = container.firstChild;
      expect(badge).toHaveClass('text-xs');
    });
  });

  // Edge Cases
  describe('Edge Cases', () => {
    it('should handle empty children', () => {
      const { container } = render(<Badge>{''}</Badge>);
      expect(container.querySelector('span')).toBeInTheDocument();
    });

    it('should handle null children', () => {
      const { container } = render(<Badge>{null}</Badge>);
      expect(container.querySelector('span')).toBeInTheDocument();
    });

    it('should handle conditional rendering', () => {
      const show = true;
      render(
        <Badge>
          {show && 'Visible'}
          {!show && 'Hidden'}
        </Badge>
      );
      expect(screen.getByText('Visible')).toBeInTheDocument();
    });

    it('should handle special characters', () => {
      render(<Badge>@#$%</Badge>);
      expect(screen.getByText('@#$%')).toBeInTheDocument();
    });

    it('should handle emoji', () => {
      render(<Badge>✨ New</Badge>);
      expect(screen.getByText(/New/)).toBeInTheDocument();
    });

    it('should handle unicode characters', () => {
      render(<Badge>★ Featured</Badge>);
      expect(screen.getByText(/Featured/)).toBeInTheDocument();
    });
  });

  // Integration Tests
  describe('Integration', () => {
    it('should work in a list context', () => {
      const { container } = render(
        <ul>
          <li>
            Item 1 <Badge variant="success">New</Badge>
          </li>
          <li>
            Item 2 <Badge variant="danger">Urgent</Badge>
          </li>
        </ul>
      );
      expect(screen.getByText('New')).toBeInTheDocument();
      expect(screen.getByText('Urgent')).toBeInTheDocument();
    });

    it('should work with button elements', () => {
      render(
        <button>
          Notifications <Badge>5</Badge>
        </button>
      );
      expect(screen.getByText('Notifications')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should work with multiple badges', () => {
      render(
        <div>
          <Badge variant="primary">Primary</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="danger">Danger</Badge>
        </div>
      );
      expect(screen.getByText('Primary')).toBeInTheDocument();
      expect(screen.getByText('Success')).toBeInTheDocument();
      expect(screen.getByText('Danger')).toBeInTheDocument();
    });
  });
});
