/**
 * Tabs Component Tests
 * Tests for Tabs component with active state, tab switching, and onChange callback
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tabs } from './Tabs';

describe('Tabs Component', () => {
  const mockTabs = [
    { id: 'tab1', label: 'Tab 1', content: <div>Content 1</div> },
    { id: 'tab2', label: 'Tab 2', content: <div>Content 2</div> },
    { id: 'tab3', label: 'Tab 3', content: <div>Content 3</div> },
  ];

  // Rendering Tests
  describe('Rendering', () => {
    it('should render tabs with labels', () => {
      render(<Tabs tabs={mockTabs} />);
      expect(screen.getByText('Tab 1')).toBeInTheDocument();
      expect(screen.getByText('Tab 2')).toBeInTheDocument();
      expect(screen.getByText('Tab 3')).toBeInTheDocument();
    });

    it('should render tab buttons', () => {
      render(<Tabs tabs={mockTabs} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(3);
    });

    it('should render content for first tab by default', () => {
      render(<Tabs tabs={mockTabs} />);
      expect(screen.getByText('Content 1')).toBeInTheDocument();
    });

    it('should not render other tab content initially', () => {
      render(<Tabs tabs={mockTabs} />);
      expect(screen.queryByText('Content 2')).not.toBeInTheDocument();
      expect(screen.queryByText('Content 3')).not.toBeInTheDocument();
    });

    it('should render single tab', () => {
      const singleTab = [{ id: 'single', label: 'Only', content: <p>Only Content</p> }];
      render(<Tabs tabs={singleTab} />);
      expect(screen.getByText('Only')).toBeInTheDocument();
      expect(screen.getByText('Only Content')).toBeInTheDocument();
    });
  });

  // Default Tab Tests
  describe('Default Tab', () => {
    it('should use first tab as default', () => {
      render(<Tabs tabs={mockTabs} />);
      expect(screen.getByText('Content 1')).toBeInTheDocument();
    });

    it('should use defaultTab when specified', () => {
      render(<Tabs tabs={mockTabs} defaultTab="tab2" />);
      expect(screen.getByText('Content 2')).toBeInTheDocument();
    });

    it('should respect defaultTab for rendering', () => {
      render(<Tabs tabs={mockTabs} defaultTab="tab3" />);
      expect(screen.getByText('Content 3')).toBeInTheDocument();
      expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
    });

    it('should fallback to first tab if defaultTab not found', () => {
      render(<Tabs tabs={mockTabs} defaultTab="nonexistent" />);
      expect(screen.getByText('Content 1')).toBeInTheDocument();
    });
  });

  // Tab Switching Tests
  describe('Tab Switching', () => {
    it('should switch tab on click', async () => {
      render(<Tabs tabs={mockTabs} />);
      const tab2Button = screen.getByText('Tab 2');

      await userEvent.click(tab2Button);
      expect(screen.getByText('Content 2')).toBeInTheDocument();
    });

    it('should update content when switching tabs', async () => {
      render(<Tabs tabs={mockTabs} />);

      await userEvent.click(screen.getByText('Tab 2'));
      expect(screen.getByText('Content 2')).toBeInTheDocument();
      expect(screen.queryByText('Content 1')).not.toBeInTheDocument();

      await userEvent.click(screen.getByText('Tab 3'));
      expect(screen.getByText('Content 3')).toBeInTheDocument();
      expect(screen.queryByText('Content 2')).not.toBeInTheDocument();
    });

    it('should allow multiple tab switches', async () => {
      render(<Tabs tabs={mockTabs} />);

      await userEvent.click(screen.getByText('Tab 2'));
      expect(screen.getByText('Content 2')).toBeInTheDocument();

      await userEvent.click(screen.getByText('Tab 1'));
      expect(screen.getByText('Content 1')).toBeInTheDocument();

      await userEvent.click(screen.getByText('Tab 3'));
      expect(screen.getByText('Content 3')).toBeInTheDocument();
    });

    it('should toggle back to previously active tab', async () => {
      render(<Tabs tabs={mockTabs} />);

      await userEvent.click(screen.getByText('Tab 2'));
      expect(screen.getByText('Content 2')).toBeInTheDocument();

      await userEvent.click(screen.getByText('Tab 1'));
      expect(screen.getByText('Content 1')).toBeInTheDocument();
    });
  });

  // onChange Callback Tests
  describe('onChange Callback', () => {
    it('should call onChange when tab is clicked', async () => {
      const handleChange = jest.fn();
      render(<Tabs tabs={mockTabs} onChange={handleChange} />);

      await userEvent.click(screen.getByText('Tab 2'));
      expect(handleChange).toHaveBeenCalledWith('tab2');
    });

    it('should call onChange with correct tab id', async () => {
      const handleChange = jest.fn();
      render(<Tabs tabs={mockTabs} onChange={handleChange} />);

      await userEvent.click(screen.getByText('Tab 3'));
      expect(handleChange).toHaveBeenCalledWith('tab3');
    });

    it('should call onChange on each tab switch', async () => {
      const handleChange = jest.fn();
      render(<Tabs tabs={mockTabs} onChange={handleChange} />);

      await userEvent.click(screen.getByText('Tab 2'));
      await userEvent.click(screen.getByText('Tab 3'));
      expect(handleChange).toHaveBeenCalledTimes(2);
    });

    it('should not call onChange if onChange is not provided', async () => {
      render(<Tabs tabs={mockTabs} />);
      await userEvent.click(screen.getByText('Tab 2'));
      // Should not throw
      expect(screen.getByText('Content 2')).toBeInTheDocument();
    });
  });

  // Styling Tests
  describe('Styling', () => {
    it('should have tab container with border', () => {
      const { container } = render(<Tabs tabs={mockTabs} />);
      const tabContainer = container.querySelector('div[class*="border-b"]');
      expect(tabContainer).toHaveClass('border-b', 'border-neutral-200');
    });

    it('should style active tab', async () => {
      const { container } = render(<Tabs tabs={mockTabs} />);
      const tab1Button = screen.getByText('Tab 1').closest('button');
      expect(tab1Button).toHaveClass('border-primary-500', 'text-primary-600');
    });

    it('should style inactive tab', () => {
      const { container } = render(<Tabs tabs={mockTabs} />);
      const tab2Button = screen.getByText('Tab 2').closest('button');
      expect(tab2Button).toHaveClass('border-transparent', 'text-neutral-600');
    });

    it('should update styling on tab switch', async () => {
      render(<Tabs tabs={mockTabs} />);
      const tab2Button = screen.getByText('Tab 2').closest('button');

      expect(tab2Button).toHaveClass('border-transparent');
      await userEvent.click(tab2Button);
      expect(tab2Button).toHaveClass('border-primary-500', 'text-primary-600');
    });

    it('should have tab button hover states', () => {
      render(<Tabs tabs={mockTabs} />);
      const tab2Button = screen.getByText('Tab 2').closest('button');
      expect(tab2Button).toHaveClass('hover:text-neutral-900');
    });
  });

  // Content Rendering Tests
  describe('Content Rendering', () => {
    it('should render tab content correctly', () => {
      render(<Tabs tabs={mockTabs} />);
      expect(screen.getByText('Content 1')).toBeInTheDocument();
    });

    it('should render complex content', () => {
      const complexTabs = [
        {
          id: 'complex1',
          label: 'Complex',
          content: (
            <div>
              <h2>Title</h2>
              <p>Paragraph</p>
              <button>Action</button>
            </div>
          ),
        },
      ];
      render(<Tabs tabs={complexTabs} />);
      expect(screen.getByRole('heading')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should render JSX elements as tab content', () => {
      const jsxTabs = [
        {
          id: 'jsx',
          label: 'JSX',
          content: (
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
          ),
        },
      ];
      render(<Tabs tabs={jsxTabs} />);
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });
  });

  // Accessibility Tests
  describe('Accessibility', () => {
    it('should have buttons as tab triggers', () => {
      render(<Tabs tabs={mockTabs} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(3);
    });

    it('should be keyboard navigable', async () => {
      render(<Tabs tabs={mockTabs} />);
      const tab1Button = screen.getByText('Tab 1').closest('button');
      const tab2Button = screen.getByText('Tab 2').closest('button');

      tab1Button?.focus();
      expect(tab1Button).toHaveFocus();

      await userEvent.tab();
      expect(tab2Button).toHaveFocus();
    });

    it('should have proper focus management', async () => {
      render(<Tabs tabs={mockTabs} />);
      const buttons = screen.getAllByRole('button');

      buttons[0].focus();
      expect(buttons[0]).toHaveFocus();
    });

    it('should support ARIA attributes if added', () => {
      render(
        <Tabs tabs={mockTabs} role="tablist" />
      );
      expect(screen.getByText('Tab 1').closest('button')).toBeInTheDocument();
    });
  });

  // Edge Cases
  describe('Edge Cases', () => {
    it('should handle tabs with special characters', () => {
      const specialTabs = [
        { id: '1', label: '@Special', content: <p>Content</p> },
        { id: '2', label: '#Hashtag', content: <p>Content</p> },
      ];
      render(<Tabs tabs={specialTabs} />);
      expect(screen.getByText('@Special')).toBeInTheDocument();
      expect(screen.getByText('#Hashtag')).toBeInTheDocument();
    });

    it('should handle very long tab labels', () => {
      const longLabel = 'A'.repeat(50);
      const longTabs = [
        { id: 'long', label: longLabel, content: <p>Content</p> },
      ];
      render(<Tabs tabs={longTabs} />);
      expect(screen.getByText(longLabel)).toBeInTheDocument();
    });

    it('should handle empty content gracefully', () => {
      const emptyTabs = [
        { id: 'empty', label: 'Empty', content: null as any },
      ];
      render(<Tabs tabs={emptyTabs} />);
      expect(screen.getByText('Empty')).toBeInTheDocument();
    });

    it('should handle rapid tab clicks', async () => {
      const handleChange = jest.fn();
      render(<Tabs tabs={mockTabs} onChange={handleChange} />);

      await userEvent.click(screen.getByText('Tab 2'));
      await userEvent.click(screen.getByText('Tab 3'));
      await userEvent.click(screen.getByText('Tab 1'));

      expect(handleChange).toHaveBeenCalledTimes(3);
      expect(screen.getByText('Content 1')).toBeInTheDocument();
    });
  });

  // Integration Tests
  describe('Integration', () => {
    it('should work with different content types', async () => {
      const mixedTabs = [
        { id: 'text', label: 'Text', content: 'Text content' },
        { id: 'jsx', label: 'JSX', content: <strong>Bold content</strong> },
        { id: 'list', label: 'List', content: <ul><li>Item</li></ul> },
      ];
      render(<Tabs tabs={mixedTabs} defaultTab="text" />);

      expect(screen.getByText('Text content')).toBeInTheDocument();

      await userEvent.click(screen.getByText('JSX'));
      expect(screen.getByText('Bold content')).toBeInTheDocument();

      await userEvent.click(screen.getByText('List'));
      expect(screen.getByText('Item')).toBeInTheDocument();
    });

    it('should work with form content in tabs', async () => {
      const formTabs = [
        {
          id: 'form',
          label: 'Form',
          content: (
            <form>
              <input type="text" placeholder="Name" />
              <button type="submit">Submit</button>
            </form>
          ),
        },
      ];
      render(<Tabs tabs={formTabs} />);
      expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
    });
  });
});
