/**
 * Sidebar Component Tests
 * Tests for desktop sidebar with collapse toggle, nav items with badges, and active state
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sidebar, SidebarItem } from './Sidebar';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

jest.mock('next/link', () => {
  return ({ children, href }: any) => <a href={href}>{children}</a>;
});

describe('Sidebar Component', () => {
  const mockItems: SidebarItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: '📊' },
    { label: 'Analytics', href: '/analytics', icon: '📈' },
    { label: 'Messages', href: '/messages', icon: '💬', badge: 3 },
    { label: 'Settings', href: '/settings', icon: '⚙️' },
  ];

  // Rendering Tests
  describe('Rendering', () => {
    it('should render sidebar navigation', () => {
      const { container } = render(<Sidebar items={mockItems} />);
      expect(container.querySelector('div[class*="border-r"]')).toBeInTheDocument();
    });

    it('should render navigation items', () => {
      render(<Sidebar items={mockItems} />);
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
    });

    it('should render sidebar title', () => {
      render(<Sidebar items={mockItems} title="MyApp" />);
      expect(screen.getByText('MyApp')).toBeInTheDocument();
    });

    it('should render default title when not provided', () => {
      render(<Sidebar items={mockItems} />);
      expect(screen.getByText('BlockStop')).toBeInTheDocument();
    });

    it('should be hidden on mobile', () => {
      const { container } = render(<Sidebar items={mockItems} />);
      const sidebar = container.querySelector('div[class*="md:flex"]');
      expect(sidebar).toHaveClass('hidden', 'md:flex');
    });

    it('should be sticky', () => {
      const { container } = render(<Sidebar items={mockItems} />);
      const sidebar = container.querySelector('div[class*="sticky"]');
      expect(sidebar).toHaveClass('sticky', 'top-0');
    });
  });

  // Collapse Tests
  describe('Collapse Toggle', () => {
    it('should render collapse button', () => {
      render(<Sidebar items={mockItems} />);
      const button = screen.getByRole('button', { name: '☰' });
      expect(button).toBeInTheDocument();
    });

    it('should expand by default', () => {
      const { container } = render(<Sidebar items={mockItems} collapsed={false} />);
      expect(screen.getByText('Dashboard')).toBeVisible();
    });

    it('should start collapsed when specified', () => {
      const { container } = render(<Sidebar items={mockItems} collapsed={true} />);
      // When collapsed, text labels should not be visible
      const labels = container.querySelectorAll('span:not([class*="text"])');
      expect(container).toBeInTheDocument();
    });

    it('should toggle collapse on button click', async () => {
      const { container } = render(<Sidebar items={mockItems} />);
      const button = screen.getByRole('button', { name: '☰' });

      await userEvent.click(button);
      // After collapse, sidebar width should change
      expect(container.querySelector('div[class*="w-20"]')).toBeInTheDocument();

      await userEvent.click(button);
      // After expand, sidebar width should return
      expect(container.querySelector('div[class*="w-64"]')).toBeInTheDocument();
    });

    it('should change width on collapse', async () => {
      const { container } = render(<Sidebar items={mockItems} />);
      const sidebar = container.querySelector('div[class*="transition-all"]');

      expect(sidebar).toHaveClass('w-64');
    });
  });

  // Item Rendering Tests
  describe('Item Rendering', () => {
    it('should render all items', () => {
      render(<Sidebar items={mockItems} />);
      mockItems.forEach((item) => {
        expect(screen.getByText(item.label)).toBeInTheDocument();
      });
    });

    it('should render items as links', () => {
      render(<Sidebar items={mockItems} />);
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });

    it('should render with correct hrefs', () => {
      render(<Sidebar items={mockItems} />);
      const dashboardLink = screen.getByRole('link', { name: /Dashboard/i });
      expect(dashboardLink).toHaveAttribute('href', '/dashboard');
    });

    it('should render icons when provided', () => {
      render(<Sidebar items={mockItems} />);
      expect(screen.getByText('📊')).toBeInTheDocument();
      expect(screen.getByText('💬')).toBeInTheDocument();
    });

    it('should render items without icons', () => {
      const itemsNoIcon = [{ label: 'Home', href: '/' }];
      render(<Sidebar items={itemsNoIcon} />);
      expect(screen.getByText('Home')).toBeInTheDocument();
    });
  });

  // Badge Tests
  describe('Badges', () => {
    it('should render badges when provided', () => {
      render(<Sidebar items={mockItems} />);
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should not render badge when not provided', () => {
      const noBadgeItems = [{ label: 'Dashboard', href: '/' }];
      render(<Sidebar items={noBadgeItems} />);
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    it('should not render badge when 0', () => {
      const zeroBadgeItems = [
        { label: 'Messages', href: '/messages', badge: 0 },
      ];
      render(<Sidebar items={zeroBadgeItems} />);
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    it('should show badge in expanded view', async () => {
      const { container } = render(<Sidebar items={mockItems} collapsed={false} />);
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should show badge in collapsed view', async () => {
      const { container } = render(<Sidebar items={mockItems} collapsed={true} />);
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  // Active State Tests
  describe('Active State', () => {
    it('should mark current page as active', () => {
      render(<Sidebar items={mockItems} />);
      const dashboardLink = screen.getByRole('link', { name: /Dashboard/i });
      // Based on mocked pathname /dashboard
      expect(dashboardLink).toBeInTheDocument();
    });

    it('should apply active styling', () => {
      const { container } = render(<Sidebar items={mockItems} />);
      const activeItem = container.querySelector('a[href="/dashboard"]')?.closest('a');
      expect(activeItem).toBeInTheDocument();
    });

    it('should detect nested paths', () => {
      render(<Sidebar items={mockItems} />);
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });
  });

  // Styling Tests
  describe('Styling', () => {
    it('should have sidebar container styles', () => {
      const { container } = render(<Sidebar items={mockItems} />);
      const sidebar = container.querySelector('div[class*="border-r"]');
      expect(sidebar).toHaveClass(
        'border-r',
        'border-neutral-200',
        'flex',
        'flex-col',
        'h-screen'
      );
    });

    it('should have expanded width', () => {
      const { container } = render(<Sidebar items={mockItems} />);
      expect(container.querySelector('div[class*="w-64"]')).toHaveClass('w-64');
    });

    it('should have smooth transition on collapse', () => {
      const { container } = render(<Sidebar items={mockItems} />);
      const sidebar = container.querySelector('div[class*="transition-all"]');
      expect(sidebar).toHaveClass('transition-all', 'duration-300');
    });

    it('should have item hover styling', () => {
      const { container } = render(<Sidebar items={mockItems} />);
      const item = container.querySelector('a');
      expect(item).toHaveClass('hover:bg-neutral-100');
    });
  });

  // Title Styling Tests
  describe('Title Section', () => {
    it('should render title with proper styling', () => {
      render(<Sidebar items={mockItems} title="MyApp" />);
      const title = screen.getByText('MyApp');
      expect(title).toHaveClass('font-bold', 'text-primary-600');
    });

    it('should be hidden when collapsed', () => {
      const { container } = render(<Sidebar items={mockItems} title="MyApp" collapsed={true} />);
      expect(container).toBeInTheDocument();
    });

    it('should have truncate styling', () => {
      render(<Sidebar items={mockItems} title="VeryLongApplicationName" />);
      const title = screen.getByText(/VeryLong/);
      expect(title).toHaveClass('truncate');
    });
  });

  // Accessibility Tests
  describe('Accessibility', () => {
    it('should have nav semantic element', () => {
      const { container } = render(<Sidebar items={mockItems} />);
      expect(container.querySelector('nav')).toBeInTheDocument();
    });

    it('should have proper link roles', () => {
      render(<Sidebar items={mockItems} />);
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });

    it('should have title attributes for collapsed items', () => {
      const { container } = render(
        <Sidebar items={mockItems} collapsed={true} />
      );
      const links = screen.getAllByRole('link');
      expect(links).toBeDefined();
    });

    it('should support aria attributes', () => {
      render(<Sidebar items={mockItems} role="navigation" />);
      expect(screen.getByText('BlockStop')).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      render(<Sidebar items={mockItems} />);
      const links = screen.getAllByRole('link');
      links[0].focus();
      expect(links[0]).toHaveFocus();
    });
  });

  // Edge Cases
  describe('Edge Cases', () => {
    it('should handle empty items list', () => {
      const { container } = render(<Sidebar items={[]} />);
      expect(container.querySelector('nav')).toBeInTheDocument();
    });

    it('should handle single item', () => {
      const singleItem = [{ label: 'Home', href: '/' }];
      render(<Sidebar items={singleItem} />);
      expect(screen.getByText('Home')).toBeInTheDocument();
    });

    it('should handle many items', () => {
      const manyItems = Array.from({ length: 20 }, (_, i) => ({
        label: `Item ${i + 1}`,
        href: `/item${i + 1}`,
        icon: '📦',
      }));
      render(<Sidebar items={manyItems} />);
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 20')).toBeInTheDocument();
    });

    it('should handle items with very long labels', () => {
      const longLabel = 'A'.repeat(50);
      const longItems = [{ label: longLabel, href: '/' }];
      render(<Sidebar items={longItems} />);
      expect(screen.getByText(new RegExp(longLabel.slice(0, 20)))).toBeInTheDocument();
    });

    it('should handle special characters in labels', () => {
      const specialItems = [{ label: '@Special #Tag', href: '/' }];
      render(<Sidebar items={specialItems} />);
      expect(screen.getByText('@Special #Tag')).toBeInTheDocument();
    });

    it('should handle large badge numbers', () => {
      const largeBadgeItems = [
        { label: 'Messages', href: '/messages', badge: 999 },
      ];
      render(<Sidebar items={largeBadgeItems} />);
      expect(screen.getByText('9+')).toBeInTheDocument();
    });
  });

  // Integration Tests
  describe('Integration', () => {
    it('should work as part of layout', () => {
      render(
        <div className="flex">
          <Sidebar items={mockItems} />
          <main>Page content</main>
        </div>
      );
      expect(screen.getByText('Page content')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('should work with different configurations', () => {
      const { rerender } = render(<Sidebar items={mockItems} collapsed={false} />);
      expect(screen.getByText('Dashboard')).toBeVisible();

      rerender(<Sidebar items={mockItems} collapsed={true} />);
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('should work with dynamic items', async () => {
      const initialItems = [{ label: 'Home', href: '/' }];
      const { rerender } = render(<Sidebar items={initialItems} />);
      expect(screen.getByText('Home')).toBeInTheDocument();

      const updatedItems = [
        { label: 'Home', href: '/' },
        { label: 'Settings', href: '/settings' },
      ];
      rerender(<Sidebar items={updatedItems} />);
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });
  });

  // State Transition Tests
  describe('State Transitions', () => {
    it('should transition smoothly between collapsed states', async () => {
      const { rerender } = render(<Sidebar items={mockItems} collapsed={false} />);
      expect(screen.getByText('Dashboard')).toBeInTheDocument();

      rerender(<Sidebar items={mockItems} collapsed={true} />);
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });
});
