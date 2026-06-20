/**
 * Card Component Tests
 * Tests for Card padding, styling, and slot rendering
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Card } from './Card';

describe('Card Component', () => {
  // Basic Rendering Tests
  describe('Rendering', () => {
    it('should render card with children', () => {
      render(<Card>Card Content</Card>);
      expect(screen.getByText('Card Content')).toBeInTheDocument();
    });

    it('should render as a div element', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.querySelector('div');
      expect(card).toBeInTheDocument();
    });

    it('should support custom className', () => {
      const { container } = render(<Card className="custom-card">Content</Card>);
      const card = container.firstChild;
      expect(card).toHaveClass('custom-card');
    });

    it('should render multiple children', () => {
      render(
        <Card>
          <p>Child 1</p>
          <p>Child 2</p>
        </Card>
      );
      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
    });
  });

  // Padding Tests
  describe('Padding Variants', () => {
    it('should apply small padding by default is md', () => {
      const { container } = render(<Card padding="sm">Small</Card>);
      const card = container.firstChild;
      expect(card).toHaveClass('p-3');
    });

    it('should apply medium padding (default)', () => {
      const { container } = render(<Card>Medium</Card>);
      const card = container.firstChild;
      expect(card).toHaveClass('p-4');
    });

    it('should apply large padding', () => {
      const { container } = render(<Card padding="lg">Large</Card>);
      const card = container.firstChild;
      expect(card).toHaveClass('p-6');
    });

    it('should apply correct padding for each variant', () => {
      const { container: smContainer } = render(<Card padding="sm">Small</Card>);
      expect(smContainer.firstChild).toHaveClass('p-3');

      const { container: lgContainer } = render(<Card padding="lg">Large</Card>);
      expect(lgContainer.firstChild).toHaveClass('p-6');
    });
  });

  // Styling Tests
  describe('Styling', () => {
    it('should have base card styles', () => {
      const { container } = render(<Card>Styled</Card>);
      const card = container.firstChild;
      expect(card).toHaveClass(
        'bg-neutral-0',
        'rounded-lg',
        'border',
        'border-neutral-200',
        'shadow-sm'
      );
    });

    it('should have hover shadow transition', () => {
      const { container } = render(<Card>Hover</Card>);
      const card = container.firstChild;
      expect(card).toHaveClass('hover:shadow-md', 'transition-shadow');
    });

    it('should combine padding and base styles', () => {
      const { container } = render(<Card padding="lg">Combo</Card>);
      const card = container.firstChild;
      expect(card).toHaveClass('p-6', 'bg-neutral-0', 'border');
    });
  });

  // HTML Attributes Tests
  describe('HTML Attributes', () => {
    it('should support data attributes', () => {
      const { container } = render(
        <Card data-testid="card-1" data-variant="primary">
          Content
        </Card>
      );
      const card = container.firstChild;
      expect(card).toHaveAttribute('data-testid', 'card-1');
      expect(card).toHaveAttribute('data-variant', 'primary');
    });

    it('should support id attribute', () => {
      const { container } = render(<Card id="my-card">Content</Card>);
      const card = container.firstChild;
      expect(card).toHaveAttribute('id', 'my-card');
    });

    it('should support style prop', () => {
      const { container } = render(
        <Card style={{ maxWidth: '400px' }}>Styled</Card>
      );
      const card = container.firstChild as HTMLElement;
      expect(card.style.maxWidth).toBe('400px');
    });

    it('should forward all HTML div props', () => {
      const { container } = render(
        <Card role="region" aria-label="Important">
          Content
        </Card>
      );
      const card = container.firstChild;
      expect(card).toHaveAttribute('role', 'region');
      expect(card).toHaveAttribute('aria-label', 'Important');
    });
  });

  // Content Rendering
  describe('Content Rendering', () => {
    it('should render JSX elements as children', () => {
      render(
        <Card>
          <h2>Title</h2>
          <p>Description</p>
        </Card>
      );
      expect(screen.getByRole('heading', { name: /title/i })).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
    });

    it('should render text content', () => {
      render(<Card>Plain text content</Card>);
      expect(screen.getByText('Plain text content')).toBeInTheDocument();
    });

    it('should render mixed content types', () => {
      render(
        <Card>
          Text content
          <button>Action</button>
          {123}
        </Card>
      );
      expect(screen.getByText(/Text content/i)).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText('123')).toBeInTheDocument();
    });

    it('should render empty card', () => {
      const { container } = render(<Card>{''}</Card>);
      const card = container.firstChild;
      expect(card).toBeInTheDocument();
    });
  });

  // Integration Tests
  describe('Integration', () => {
    it('should work with complex nested structure', () => {
      render(
        <Card padding="lg" className="featured" data-testid="featured-card">
          <div>
            <h3>Featured Item</h3>
            <p>Description here</p>
          </div>
        </Card>
      );
      const card = screen.getByTestId('featured-card');
      expect(card).toHaveClass('p-6', 'featured');
      expect(screen.getByText('Featured Item')).toBeInTheDocument();
    });

    it('should support responsive usage', () => {
      const { container } = render(
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>Card 1</Card>
          <Card>Card 2</Card>
        </div>
      );
      const cards = container.querySelectorAll('[class*="bg-neutral-0"]');
      expect(cards.length).toBe(2);
    });

    it('should support image content', () => {
      render(
        <Card>
          <img src="test.jpg" alt="test" />
          <p>Image caption</p>
        </Card>
      );
      expect(screen.getByAltText('test')).toBeInTheDocument();
    });
  });

  // Edge Cases
  describe('Edge Cases', () => {
    it('should handle null className gracefully', () => {
      const { container } = render(<Card className="">Content</Card>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle undefined children', () => {
      const { container } = render(<Card>{undefined}</Card>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle conditional children', () => {
      const condition = true;
      render(
        <Card>
          {condition && <p>Visible</p>}
          {!condition && <p>Hidden</p>}
        </Card>
      );
      expect(screen.getByText('Visible')).toBeInTheDocument();
      expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
    });

    it('should work with dynamic padding', () => {
      const paddings = ['sm', 'md', 'lg'] as const;
      paddings.forEach((padding) => {
        const { container } = render(<Card padding={padding}>{padding}</Card>);
        const card = container.firstChild;
        expect(card).toBeInTheDocument();
      });
    });
  });

  // Accessibility Tests
  describe('Accessibility', () => {
    it('should be keyboard accessible if it contains interactive elements', () => {
      render(
        <Card>
          <button>Click me</button>
        </Card>
      );
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should support aria attributes', () => {
      const { container } = render(
        <Card role="article" aria-label="Card description">
          Content
        </Card>
      );
      const card = container.firstChild;
      expect(card).toHaveAttribute('role', 'article');
      expect(card).toHaveAttribute('aria-label', 'Card description');
    });

    it('should maintain semantic structure', () => {
      const { container } = render(
        <Card>
          <h2>Title</h2>
          <p>Content</p>
        </Card>
      );
      expect(container.querySelector('h2')).toBeInTheDocument();
      expect(container.querySelector('p')).toBeInTheDocument();
    });
  });
});
