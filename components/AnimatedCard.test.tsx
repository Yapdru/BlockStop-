/**
 * AnimatedCard Component Tests
 * Tests for animated card with delay support and animations
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { AnimatedCard } from './AnimatedCard';

describe('AnimatedCard Component', () => {
  // Rendering Tests
  describe('Rendering', () => {
    it('should render card with children', () => {
      render(<AnimatedCard>Card Content</AnimatedCard>);
      expect(screen.getByText('Card Content')).toBeInTheDocument();
    });

    it('should render as a div element', () => {
      const { container } = render(<AnimatedCard>Content</AnimatedCard>);
      expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      const { container } = render(
        <AnimatedCard className="custom-card">Content</AnimatedCard>
      );
      const card = container.firstChild;
      expect(card).toHaveClass('custom-card');
    });

    it('should render multiple children', () => {
      render(
        <AnimatedCard>
          <p>Child 1</p>
          <p>Child 2</p>
        </AnimatedCard>
      );
      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
    });

    it('should render complex JSX content', () => {
      render(
        <AnimatedCard>
          <h2>Title</h2>
          <p>Description</p>
          <button>Action</button>
        </AnimatedCard>
      );
      expect(screen.getByRole('heading')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  // Base Styling Tests
  describe('Base Styling', () => {
    it('should have card container styles', () => {
      const { container } = render(<AnimatedCard>Styled</AnimatedCard>);
      const card = container.firstChild;
      expect(card).toHaveClass(
        'bg-neutral-0',
        'rounded-lg',
        'border',
        'border-neutral-200',
        'shadow-sm'
      );
    });

    it('should have padding', () => {
      const { container } = render(<AnimatedCard>Padded</AnimatedCard>);
      const card = container.firstChild;
      expect(card).toHaveClass('p-6');
    });

    it('should have hover shadow effect', () => {
      const { container } = render(<AnimatedCard>Hover</AnimatedCard>);
      const card = container.firstChild;
      expect(card).toHaveClass('hover:shadow-lg', 'transition-shadow');
    });

    it('should have rounded corners', () => {
      const { container } = render(<AnimatedCard>Rounded</AnimatedCard>);
      const card = container.firstChild;
      expect(card).toHaveClass('rounded-lg');
    });

    it('should have border styling', () => {
      const { container } = render(<AnimatedCard>Bordered</AnimatedCard>);
      const card = container.firstChild;
      expect(card).toHaveClass('border', 'border-neutral-200');
    });
  });

  // Animation Tests
  describe('Animation', () => {
    it('should have slideUp animation', () => {
      const { container } = render(<AnimatedCard>Animated</AnimatedCard>);
      const card = container.firstChild;
      expect(card).toHaveClass('animate-slideUp');
    });

    it('should apply animation delay prop', () => {
      const { container } = render(<AnimatedCard delay={2}>Delayed</AnimatedCard>);
      const card = container.firstChild as HTMLElement;
      expect(card.style.animationDelay).toBe('100ms');
    });

    it('should handle zero delay', () => {
      const { container } = render(<AnimatedCard delay={0}>NoDelay</AnimatedCard>);
      const card = container.firstChild as HTMLElement;
      expect(card.style.animationDelay).toBe('0ms');
    });

    it('should handle various delay values', () => {
      const delays = [0, 1, 2, 5, 10];
      delays.forEach((delay) => {
        const { container } = render(
          <AnimatedCard delay={delay}>Delay {delay}</AnimatedCard>
        );
        const card = container.firstChild as HTMLElement;
        expect(card.style.animationDelay).toBe(`${delay * 50}ms`);
      });
    });

    it('should calculate delay correctly', () => {
      const { container } = render(<AnimatedCard delay={3}>3x Delay</AnimatedCard>);
      const card = container.firstChild as HTMLElement;
      expect(card.style.animationDelay).toBe('150ms');
    });

    it('should work with large delay values', () => {
      const { container } = render(<AnimatedCard delay={100}>LargeDelay</AnimatedCard>);
      const card = container.firstChild as HTMLElement;
      expect(card.style.animationDelay).toBe('5000ms');
    });
  });

  // Custom className Tests
  describe('Custom Styling', () => {
    it('should combine base and custom classes', () => {
      const { container } = render(
        <AnimatedCard className="custom-class">Styled</AnimatedCard>
      );
      const card = container.firstChild;
      expect(card).toHaveClass(
        'bg-neutral-0',
        'rounded-lg',
        'custom-class'
      );
    });

    it('should support override classes', () => {
      const { container } = render(
        <AnimatedCard className="bg-white">Override</AnimatedCard>
      );
      const card = container.firstChild;
      expect(card).toHaveClass('custom-class', 'bg-white');
    });

    it('should allow multiple custom classes', () => {
      const { container } = render(
        <AnimatedCard className="class1 class2 class3">Multi</AnimatedCard>
      );
      const card = container.firstChild;
      expect(card).toHaveClass('class1', 'class2', 'class3');
    });

    it('should work with responsive classes', () => {
      const { container } = render(
        <AnimatedCard className="md:w-1/2 lg:w-1/3">Responsive</AnimatedCard>
      );
      const card = container.firstChild;
      expect(card).toHaveClass('md:w-1/2', 'lg:w-1/3');
    });
  });

  // HTML Attributes Tests
  describe('HTML Attributes', () => {
    it('should support data attributes', () => {
      const { container } = render(
        <AnimatedCard data-testid="card-1" data-variant="primary">
          Content
        </AnimatedCard>
      );
      const card = container.firstChild;
      expect(card).toHaveAttribute('data-testid', 'card-1');
      expect(card).toHaveAttribute('data-variant', 'primary');
    });

    it('should support id attribute', () => {
      const { container } = render(<AnimatedCard id="my-card">Content</AnimatedCard>);
      const card = container.firstChild;
      expect(card).toHaveAttribute('id', 'my-card');
    });

    it('should support style prop', () => {
      const { container } = render(
        <AnimatedCard style={{ maxWidth: '400px' }}>Styled</AnimatedCard>
      );
      const card = container.firstChild as HTMLElement;
      expect(card.style.maxWidth).toBe('400px');
    });

    it('should forward all HTML div props', () => {
      const { container } = render(
        <AnimatedCard role="region" aria-label="Important">
          Content
        </AnimatedCard>
      );
      const card = container.firstChild;
      expect(card).toHaveAttribute('role', 'region');
      expect(card).toHaveAttribute('aria-label', 'Important');
    });

    it('should support title attribute', () => {
      const { container } = render(
        <AnimatedCard title="Tooltip text">Content</AnimatedCard>
      );
      const card = container.firstChild;
      expect(card).toHaveAttribute('title', 'Tooltip text');
    });
  });

  // Content Rendering Tests
  describe('Content Rendering', () => {
    it('should render text content', () => {
      render(<AnimatedCard>Plain text</AnimatedCard>);
      expect(screen.getByText('Plain text')).toBeInTheDocument();
    });

    it('should render HTML elements', () => {
      render(
        <AnimatedCard>
          <h3>Heading</h3>
          <p>Paragraph</p>
        </AnimatedCard>
      );
      expect(screen.getByRole('heading')).toBeInTheDocument();
      expect(screen.getByText('Paragraph')).toBeInTheDocument();
    });

    it('should render empty card', () => {
      const { container } = render(<AnimatedCard>{''}</AnimatedCard>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render null children gracefully', () => {
      const { container } = render(<AnimatedCard>{null}</AnimatedCard>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render mixed content types', () => {
      render(
        <AnimatedCard>
          Text
          <span>Element</span>
          {123}
        </AnimatedCard>
      );
      expect(screen.getByText(/Text/)).toBeInTheDocument();
      expect(screen.getByText('Element')).toBeInTheDocument();
      expect(screen.getByText('123')).toBeInTheDocument();
    });
  });

  // Accessibility Tests
  describe('Accessibility', () => {
    it('should support semantic role attributes', () => {
      const { container } = render(
        <AnimatedCard role="article">Content</AnimatedCard>
      );
      const card = container.firstChild;
      expect(card).toHaveAttribute('role', 'article');
    });

    it('should support aria-label', () => {
      const { container } = render(
        <AnimatedCard aria-label="Featured item">Content</AnimatedCard>
      );
      const card = container.firstChild;
      expect(card).toHaveAttribute('aria-label', 'Featured item');
    });

    it('should support aria-describedby', () => {
      const { container } = render(
        <AnimatedCard aria-describedby="description">Content</AnimatedCard>
      );
      const card = container.firstChild;
      expect(card).toHaveAttribute('aria-describedby', 'description');
    });

    it('should maintain semantic structure of children', () => {
      const { container } = render(
        <AnimatedCard>
          <h2>Title</h2>
          <p>Content</p>
        </AnimatedCard>
      );
      expect(container.querySelector('h2')).toBeInTheDocument();
      expect(container.querySelector('p')).toBeInTheDocument();
    });
  });

  // Integration Tests
  describe('Integration', () => {
    it('should work in a grid layout', () => {
      const { container } = render(
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatedCard>Card 1</AnimatedCard>
          <AnimatedCard>Card 2</AnimatedCard>
          <AnimatedCard>Card 3</AnimatedCard>
        </div>
      );
      expect(screen.getByText('Card 1')).toBeInTheDocument();
      expect(screen.getByText('Card 2')).toBeInTheDocument();
      expect(screen.getByText('Card 3')).toBeInTheDocument();
    });

    it('should work with staggered animations', () => {
      const { container } = render(
        <div>
          <AnimatedCard delay={0}>Card 1</AnimatedCard>
          <AnimatedCard delay={1}>Card 2</AnimatedCard>
          <AnimatedCard delay={2}>Card 3</AnimatedCard>
        </div>
      );
      const cards = container.querySelectorAll('div[class*="bg-neutral-0"]');
      expect(cards.length).toBe(3);

      const card1 = cards[0] as HTMLElement;
      const card2 = cards[1] as HTMLElement;
      const card3 = cards[2] as HTMLElement;

      expect(card1.style.animationDelay).toBe('0ms');
      expect(card2.style.animationDelay).toBe('50ms');
      expect(card3.style.animationDelay).toBe('100ms');
    });

    it('should work with interactive elements', () => {
      render(
        <AnimatedCard>
          <button>Click me</button>
          <input type="text" />
        </AnimatedCard>
      );
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should work as a list item container', () => {
      const { container } = render(
        <ul>
          <li>
            <AnimatedCard>Item 1</AnimatedCard>
          </li>
          <li>
            <AnimatedCard>Item 2</AnimatedCard>
          </li>
        </ul>
      );
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });
  });

  // Edge Cases
  describe('Edge Cases', () => {
    it('should handle undefined className', () => {
      const { container } = render(
        <AnimatedCard className={undefined as any}>Content</AnimatedCard>
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle conditional content', () => {
      const show = true;
      render(
        <AnimatedCard>
          {show && <p>Visible</p>}
          {!show && <p>Hidden</p>}
        </AnimatedCard>
      );
      expect(screen.getByText('Visible')).toBeInTheDocument();
      expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
    });

    it('should handle very long content', () => {
      const longContent = 'A'.repeat(500);
      render(<AnimatedCard>{longContent}</AnimatedCard>);
      expect(screen.getByText(longContent)).toBeInTheDocument();
    });

    it('should handle nested animated cards', () => {
      render(
        <AnimatedCard delay={0}>
          <p>Outer</p>
          <AnimatedCard delay={1}>Inner</AnimatedCard>
        </AnimatedCard>
      );
      expect(screen.getByText('Outer')).toBeInTheDocument();
      expect(screen.getByText('Inner')).toBeInTheDocument();
    });

    it('should handle dynamic delay changes', () => {
      const { rerender, container } = render(<AnimatedCard delay={1}>Content</AnimatedCard>);
      const card = container.firstChild as HTMLElement;
      expect(card.style.animationDelay).toBe('50ms');

      rerender(<AnimatedCard delay={3}>Content</AnimatedCard>);
      expect((container.firstChild as HTMLElement).style.animationDelay).toBe('150ms');
    });

    it('should handle negative delay values', () => {
      const { container } = render(<AnimatedCard delay={-1}>Content</AnimatedCard>);
      const card = container.firstChild as HTMLElement;
      expect(card.style.animationDelay).toBe('-50ms');
    });
  });

  // Styling Combinations Tests
  describe('Styling Combinations', () => {
    it('should combine all styles correctly', () => {
      const { container } = render(
        <AnimatedCard
          delay={2}
          className="mt-4 mb-4"
          id="special"
          data-testid="combo"
        >
          Combined
        </AnimatedCard>
      );
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass(
        'bg-neutral-0',
        'rounded-lg',
        'border',
        'p-6',
        'animate-slideUp',
        'mt-4',
        'mb-4'
      );
      expect(card).toHaveAttribute('id', 'special');
      expect(card.style.animationDelay).toBe('100ms');
    });

    it('should work with utility classes', () => {
      const { container } = render(
        <AnimatedCard className="opacity-75 cursor-pointer">Utility</AnimatedCard>
      );
      const card = container.firstChild;
      expect(card).toHaveClass('opacity-75', 'cursor-pointer');
    });
  });
});
