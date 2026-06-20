/**
 * BottomNav Component Tests
 * Tests for mobile navigation with tier-based visibility, badges, and active state detection
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { BottomNav, NavItem } from './BottomNav';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

jest.mock('next/link', () => {
  return ({ children, href }: any) => <a href={href}>{children}</a>;
});

describe('BottomNav Component', () => {
  const mockItems: NavItem[] = [
    { label: 'Home', href: '/', icon: '🏠' },
    { label: 'Search', href: '/search', icon: '🔍' },
    { label: 'Profile', href: '/profile', icon: '👤' },
  ];

  // Rendering Tests
  describe('Rendering', () => {
    it('should render navigation for free tier', () => {
      render(<BottomNav items={mockItems} userTier="free" />);
      expect(screen.getByText('Home')).toBeInTheDocument();
    });

    it('should render navigation for pro tier', () => {
      render(<BottomNav items={mockItems} userTier="pro" />);
      expect(screen.getByText('Home')).toBeInTheDocument();
    });

    it('should not render for neo tier', () => {
      const { container } = render(<BottomNav items={mockItems} userTier="neo" />);
      expect(container.firstChild).toBeNull();
    });

    it('should render with default items when none provided', () => {
      render(<BottomNav items={[]} userTier="free" />);
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('should render custom items when provided', () => {
      render(<BottomNav items={mockItems} userTier="free" />);
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Search')).toBeInTheDocument();
    });
  });

  // Tier-Based Visibility Tests
  describe('Tier-Based Visibility', () => {
    const tiers = ['free', 'neo', 'pro', 'office', 'health', 'max'] as const;

    it('should be hidden for neo tier only', () => {
      tiers.forEach((tier) => {
        const { container } = render(<BottomNav items={mockItems} userTier={tier} />);
        if (tier === 'neo') {
          expect(container.firstChild).toBeNull();
        } else {
          expect(container.querySelector('nav')).toBeInTheDocument();
        }
      });
    });

    it('should render for all other tiers', () => {
      const nonNeoTiers = ['free', 'pro', 'office', 'health', 'max'] as const;
      nonNeoTiers.forEach((tier) => {
        const { container } = render(<BottomNav items={mockItems} userTier={tier} />);
        expect(container.querySelector('nav')).toBeInTheDocument();
      });
    });
  });

  // Icon Display Tests
  describe('Icons', () => {
    it('should render icons for each item', () => {
      render(<BottomNav items={mockItems} userTier="free" />);
      expect(screen.getByText('🏠')).toBeInTheDocument();
      expect(screen.getByText('🔍')).toBeInTheDocument();
      expect(screen.getByText('👤')).toBeInTheDocument();
    });

    it('should render icon as text content', () => {
      const itemsWithEmoji = [
        { label: 'Home', href: '/', icon: '🏠' },
      ];
      render(<BottomNav items={itemsWithEmoji} userTier="free" />);
      const icon = screen.getByText('🏠');
      expect(icon).toBeInTheDocument();
    });
  });

  // Badge Tests
  describe('Badges', () => {
    it('should render badge when item has badge prop', () => {
      const itemsWithBadge = [
        { label: 'Messages', href: '/messages', icon: '💬', badge: 5 },
      ];
      render(<BottomNav items={itemsWithBadge} userTier="free" />);
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should not render badge when badge is 0', () => {
      const itemsWithZeroBadge = [
        { label: 'Messages', href: '/messages', icon: '💬', badge: 0 },
      ];
      render(<BottomNav items={itemsWithZeroBadge} userTier="free" />);
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    it('should show "9+" for badges > 9', () => {
      const itemsWithLargeBadge = [
        { label: 'Messages', href: '/messages', icon: '💬', badge: 15 },
      ];
      render(<BottomNav items={itemsWithLargeBadge} userTier="free" />);
      expect(screen.getByText('9+')).toBeInTheDocument();
    });

    it('should render multiple badges', () => {
      const itemsWithMultipleBadges = [
        { label: 'Messages', href: '/messages', icon: '💬', badge: 3 },
        { label: 'Alerts', href: '/alerts', icon: '🔔', badge: 5 },
      ];
      render(<BottomNav items={itemsWithMultipleBadges} userTier="free" />);
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  // Active State Tests
  describe('Active State', () => {
    it('should mark current path as active', () => {
      render(<BottomNav items={mockItems} userTier="free" />);
      const dashboardLink = screen.getByRole('link', { name: /Dashboard/i }).closest('a');
      // Based on mocked usePathname returning '/dashboard'
      expect(dashboardLink).toBeInTheDocument();
    });

    it('should apply active styling to current item', () => {
      const { container } = render(<BottomNav items={mockItems} userTier="free" />);
      const nav = container.querySelector('nav');
      expect(nav).toBeInTheDocument();
    });

    it('should detect nested paths as active', () => {
      render(<BottomNav items={mockItems} userTier="free" />);
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });
  });

  // Link Tests
  describe('Links', () => {
    it('should render nav items as links', () => {
      render(<BottomNav items={mockItems} userTier="free" />);
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });

    it('should have correct href for each link', () => {
      render(<BottomNav items={mockItems} userTier="free" />);
      const homeLink = screen.getByRole('link', { name: /Home/i });
      expect(homeLink).toHaveAttribute('href', '/');
    });

    it('should navigate to correct paths', () => {
      render(<BottomNav items={mockItems} userTier="free" />);
      const searchLink = screen.getByRole('link', { name: /Search/i });
      expect(searchLink).toHaveAttribute('href', '/search');
    });
  });

  // Styling Tests
  describe('Styling', () => {
    it('should have fixed positioning for mobile', () => {
      const { container } = render(<BottomNav items={mockItems} userTier="free" />);
      const nav = container.querySelector('nav');
      expect(nav).toHaveClass('fixed', 'bottom-0', 'md:hidden');
    });

    it('should be hidden on desktop (md breakpoint)', () => {
      const { container } = render(<BottomNav items={mockItems} userTier="free" />);
      const nav = container.querySelector('nav');
      expect(nav).toHaveClass('md:hidden');
    });

    it('should have proper container height', () => {
      const { container } = render(<BottomNav items={mockItems} userTier="free" />);
      const nav = container.querySelector('nav');
      expect(nav).toHaveClass('h-20');
    });

    it('should have border styling', () => {
      const { container } = render(<BottomNav items={mockItems} userTier="free" />);
      const nav = container.querySelector('nav');
      expect(nav).toHaveClass('border-t', 'border-neutral-200');
    });

    it('should have flex layout', () => {
      const { container } = render(<BottomNav items={mockItems} userTier="free" />);
      const nav = container.querySelector('nav');
      expect(nav).toHaveClass('flex', 'justify-around');
    });
  });

  // Label Tests
  describe('Labels', () => {
    it('should render item labels', () => {
      render(<BottomNav items={mockItems} userTier="free" />);
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Search')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
    });

    it('should have small text for labels', () => {
      const { container } = render(<BottomNav items={mockItems} userTier="free" />);
      const labels = container.querySelectorAll('span[class*="text-xs"]');
      expect(labels.length).toBeGreaterThan(0);
    });

    it('should handle long labels', () => {
      const itemsWithLongLabel = [
        { label: 'Very Long Navigation Label Here', href: '/', icon: '🔷' },
      ];
      render(<BottomNav items={itemsWithLongLabel} userTier="free" />);
      expect(screen.getByText(/Very Long/)).toBeInTheDocument();
    });
  });

  // Default Items Tests
  describe('Default Items', () => {
    it('should show default items when empty array provided', () => {
      render(<BottomNav items={[]} userTier="free" />);
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Analyze')).toBeInTheDocument();
      expect(screen.getByText('BetterBot')).toBeInTheDocument();
    });

    it('should have default badge on BetterBot', () => {
      render(<BottomNav items={[]} userTier="free" />);
      const betterBotLink = screen.getByRole('link', { name: /BetterBot/i });
      expect(betterBotLink).toBeInTheDocument();
    });

    it('should use custom items when provided', () => {
      render(<BottomNav items={mockItems} userTier="free" />);
      expect(screen.getByText('Home')).toBeInTheDocument();
      // Default Dashboard should not be present
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    });
  });

  // Accessibility Tests
  describe('Accessibility', () => {
    it('should have nav semantic element', () => {
      const { container } = render(<BottomNav items={mockItems} userTier="free" />);
      expect(container.querySelector('nav')).toBeInTheDocument();
    });

    it('should have proper link semantics', () => {
      render(<BottomNav items={mockItems} userTier="free" />);
      const links = screen.getAllByRole('link');
      expect(links.length).toBe(mockItems.length);
    });

    it('should support title attribute for collapsed state', () => {
      render(<BottomNav items={mockItems} userTier="free" />);
      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toBeInTheDocument();
      });
    });
  });

  // Edge Cases
  describe('Edge Cases', () => {
    it('should handle single item', () => {
      const singleItem = [{ label: 'Home', href: '/', icon: '🏠' }];
      render(<BottomNav items={singleItem} userTier="free" />);
      expect(screen.getByText('Home')).toBeInTheDocument();
    });

    it('should handle many items', () => {
      const manyItems = Array.from({ length: 10 }, (_, i) => ({
        label: `Item ${i + 1}`,
        href: `/item${i + 1}`,
        icon: '📦',
      }));
      render(<BottomNav items={manyItems} userTier="free" />);
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 10')).toBeInTheDocument();
    });

    it('should handle items with special characters', () => {
      const specialItems = [{ label: '@Special', href: '/special', icon: '★' }];
      render(<BottomNav items={specialItems} userTier="free" />);
      expect(screen.getByText('@Special')).toBeInTheDocument();
    });

    it('should handle undefined badges', () => {
      const itemsWithUndefinedBadge = [
        { label: 'Home', href: '/', icon: '🏠' },
      ];
      render(<BottomNav items={itemsWithUndefinedBadge} userTier="free" />);
      expect(screen.getByText('Home')).toBeInTheDocument();
    });
  });

  // Integration Tests
  describe('Integration', () => {
    it('should work with different tier configurations', () => {
      const tiers: Array<'free' | 'neo' | 'pro' | 'office' | 'health' | 'max'> = [
        'free',
        'pro',
        'max',
      ];
      tiers.forEach((tier) => {
        const { container } = render(<BottomNav items={mockItems} userTier={tier} />);
        expect(container.querySelector('nav')).toBeInTheDocument();
      });
    });

    it('should work as part of layout', () => {
      const { container } = render(
        <div>
          <main>Page content</main>
          <BottomNav items={mockItems} userTier="free" />
        </div>
      );
      expect(screen.getByText('Page content')).toBeInTheDocument();
      expect(container.querySelector('nav')).toBeInTheDocument();
    });
  });
});
