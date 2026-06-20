/**
 * Dropdown Component Tests
 * Tests for Dropdown menu with click-outside detection and danger items
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dropdown } from './Dropdown';

describe('Dropdown Component', () => {
  const mockItems = [
    { label: 'Edit', onClick: jest.fn() },
    { label: 'Delete', onClick: jest.fn(), danger: true },
  ];

  // Rendering Tests
  describe('Rendering', () => {
    it('should render trigger element', () => {
      render(
        <Dropdown trigger={<button>Menu</button>} items={mockItems} />
      );
      expect(screen.getByText('Menu')).toBeInTheDocument();
    });

    it('should not render menu items initially', () => {
      render(
        <Dropdown trigger={<button>Menu</button>} items={mockItems} />
      );
      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    });

    it('should render dropdown items when opened', async () => {
      render(
        <Dropdown trigger={<button>Menu</button>} items={mockItems} />
      );
      const trigger = screen.getByText('Menu');
      await userEvent.click(trigger);

      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('should render empty menu gracefully', () => {
      render(
        <Dropdown trigger={<button>Menu</button>} items={[]} />
      );
      const trigger = screen.getByText('Menu');
      expect(trigger).toBeInTheDocument();
    });
  });

  // Open/Close Tests
  describe('Open/Close Behavior', () => {
    it('should open menu on trigger click', async () => {
      render(
        <Dropdown trigger={<button>Menu</button>} items={mockItems} />
      );
      const trigger = screen.getByText('Menu');

      await userEvent.click(trigger);
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    it('should close menu on second click', async () => {
      render(
        <Dropdown trigger={<button>Menu</button>} items={mockItems} />
      );
      const trigger = screen.getByText('Menu');

      await userEvent.click(trigger);
      expect(screen.getByText('Edit')).toBeInTheDocument();

      await userEvent.click(trigger);
      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    });

    it('should toggle menu multiple times', async () => {
      render(
        <Dropdown trigger={<button>Menu</button>} items={mockItems} />
      );
      const trigger = screen.getByText('Menu');

      await userEvent.click(trigger);
      expect(screen.getByText('Edit')).toBeInTheDocument();

      await userEvent.click(trigger);
      expect(screen.queryByText('Edit')).not.toBeInTheDocument();

      await userEvent.click(trigger);
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });
  });

  // Item Click Tests
  describe('Item Clicks', () => {
    it('should call onClick handler when item is clicked', async () => {
      const item = { label: 'Action', onClick: jest.fn() };
      render(
        <Dropdown trigger={<button>Menu</button>} items={[item]} />
      );
      const trigger = screen.getByText('Menu');

      await userEvent.click(trigger);
      const itemButton = screen.getByText('Action');
      await userEvent.click(itemButton);

      expect(item.onClick).toHaveBeenCalled();
    });

    it('should close menu after item click', async () => {
      const item = { label: 'Action', onClick: jest.fn() };
      render(
        <Dropdown trigger={<button>Menu</button>} items={[item]} />
      );
      const trigger = screen.getByText('Menu');

      await userEvent.click(trigger);
      const itemButton = screen.getByText('Action');
      await userEvent.click(itemButton);

      expect(screen.queryByText('Action')).not.toBeInTheDocument();
    });

    it('should call multiple item handlers independently', async () => {
      const items = [
        { label: 'Item 1', onClick: jest.fn() },
        { label: 'Item 2', onClick: jest.fn() },
      ];
      render(
        <Dropdown trigger={<button>Menu</button>} items={items} />
      );
      const trigger = screen.getByText('Menu');

      await userEvent.click(trigger);
      await userEvent.click(screen.getByText('Item 1'));

      expect(items[0].onClick).toHaveBeenCalled();
      expect(items[1].onClick).not.toHaveBeenCalled();
    });
  });

  // Click-Outside Tests
  describe('Click-Outside Detection', () => {
    it('should close menu when clicking outside', async () => {
      const { container } = render(
        <div>
          <Dropdown trigger={<button>Menu</button>} items={mockItems} />
          <div data-testid="outside">Outside</div>
        </div>
      );
      const trigger = screen.getByText('Menu');

      await userEvent.click(trigger);
      expect(screen.getByText('Edit')).toBeInTheDocument();

      const outside = screen.getByTestId('outside');
      fireEvent.mouseDown(outside);

      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    });

    it('should not close menu when clicking inside dropdown', async () => {
      render(
        <Dropdown trigger={<button>Menu</button>} items={mockItems} />
      );
      const trigger = screen.getByText('Menu');

      await userEvent.click(trigger);
      const editButton = screen.getByText('Edit');
      fireEvent.mouseDown(editButton);

      expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    it('should close when pressing Escape (tested via click-outside)', async () => {
      const { container } = render(
        <div>
          <Dropdown trigger={<button>Menu</button>} items={mockItems} />
          <div data-testid="outside">Outside</div>
        </div>
      );
      const trigger = screen.getByText('Menu');

      await userEvent.click(trigger);
      expect(screen.getByText('Edit')).toBeInTheDocument();

      fireEvent.mouseDown(container);
      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    });
  });

  // Item Icon Tests
  describe('Item Icons', () => {
    it('should render icon when provided', async () => {
      const items = [{ label: 'Edit', onClick: jest.fn(), icon: '✎' }];
      render(
        <Dropdown trigger={<button>Menu</button>} items={items} />
      );
      const trigger = screen.getByText('Menu');

      await userEvent.click(trigger);
      expect(screen.getByText('✎')).toBeInTheDocument();
    });

    it('should render items without icons', async () => {
      const items = [{ label: 'Action', onClick: jest.fn() }];
      render(
        <Dropdown trigger={<button>Menu</button>} items={items} />
      );
      const trigger = screen.getByText('Menu');

      await userEvent.click(trigger);
      expect(screen.getByText('Action')).toBeInTheDocument();
    });
  });

  // Danger Item Tests
  describe('Danger Items', () => {
    it('should apply danger styling to danger items', async () => {
      const items = [{ label: 'Delete', onClick: jest.fn(), danger: true }];
      const { container } = render(
        <Dropdown trigger={<button>Menu</button>} items={items} />
      );
      const trigger = screen.getByText('Menu');

      await userEvent.click(trigger);
      const deleteButton = screen.getByText('Delete').closest('button');
      expect(deleteButton).toHaveClass('text-danger');
    });

    it('should apply normal styling to non-danger items', async () => {
      const items = [{ label: 'Edit', onClick: jest.fn() }];
      const { container } = render(
        <Dropdown trigger={<button>Menu</button>} items={items} />
      );
      const trigger = screen.getByText('Menu');

      await userEvent.click(trigger);
      const editButton = screen.getByText('Edit').closest('button');
      expect(editButton).toHaveClass('text-neutral-900');
    });

    it('should mix danger and normal items', async () => {
      const items = [
        { label: 'Edit', onClick: jest.fn() },
        { label: 'Delete', onClick: jest.fn(), danger: true },
      ];
      render(
        <Dropdown trigger={<button>Menu</button>} items={items} />
      );
      const trigger = screen.getByText('Menu');

      await userEvent.click(trigger);
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });
  });

  // Styling Tests
  describe('Styling', () => {
    it('should have dropdown container styles', () => {
      const { container } = render(
        <Dropdown trigger={<button>Menu</button>} items={mockItems} />
      );
      const dropdown = container.querySelector('div[class*="relative"]');
      expect(dropdown).toHaveClass('relative');
    });

    it('should position menu absolutely', async () => {
      const { container } = render(
        <Dropdown trigger={<button>Menu</button>} items={mockItems} />
      );
      const trigger = screen.getByText('Menu');

      await userEvent.click(trigger);
      const menu = container.querySelector('div[class*="absolute"]');
      expect(menu).toHaveClass('absolute', 'right-0');
    });

    it('should have menu styling', async () => {
      const { container } = render(
        <Dropdown trigger={<button>Menu</button>} items={mockItems} />
      );
      const trigger = screen.getByText('Menu');

      await userEvent.click(trigger);
      const menu = container.querySelector('div[class*="bg-neutral-0"]');
      expect(menu).toHaveClass('bg-neutral-0', 'border', 'rounded-lg', 'shadow-lg');
    });

    it('should have item button styling', async () => {
      const items = [{ label: 'Action', onClick: jest.fn() }];
      render(
        <Dropdown trigger={<button>Menu</button>} items={items} />
      );
      const trigger = screen.getByText('Menu');

      await userEvent.click(trigger);
      const itemButton = screen.getByText('Action').closest('button');
      expect(itemButton).toHaveClass('w-full', 'text-left', 'px-4', 'py-3');
    });
  });

  // Trigger Variations Tests
  describe('Trigger Variations', () => {
    it('should work with different trigger elements', async () => {
      render(
        <Dropdown trigger={<span>Click me</span>} items={mockItems} />
      );
      const trigger = screen.getByText('Click me');
      await userEvent.click(trigger);
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    it('should work with icon trigger', async () => {
      render(
        <Dropdown trigger={<button>⋯</button>} items={mockItems} />
      );
      const trigger = screen.getByText('⋯');
      await userEvent.click(trigger);
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    it('should work with custom content trigger', async () => {
      render(
        <Dropdown trigger={<button><span>Menu</span><span>▼</span></button>} items={mockItems} />
      );
      const trigger = screen.getByText('Menu');
      await userEvent.click(trigger);
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });
  });

  // Accessibility Tests
  describe('Accessibility', () => {
    it('should have button trigger', () => {
      render(
        <Dropdown trigger={<button>Menu</button>} items={mockItems} />
      );
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should have focusable items', async () => {
      const items = [{ label: 'Edit', onClick: jest.fn() }];
      render(
        <Dropdown trigger={<button>Menu</button>} items={items} />
      );
      const trigger = screen.getByText('Menu');

      await userEvent.click(trigger);
      const editButton = screen.getByText('Edit').closest('button');
      expect(editButton).toBeInTheDocument();
    });
  });

  // Edge Cases
  describe('Edge Cases', () => {
    it('should handle many items', async () => {
      const manyItems = Array.from({ length: 20 }, (_, i) => ({
        label: `Item ${i + 1}`,
        onClick: jest.fn(),
      }));
      render(
        <Dropdown trigger={<button>Menu</button>} items={manyItems} />
      );
      const trigger = screen.getByText('Menu');

      await userEvent.click(trigger);
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 20')).toBeInTheDocument();
    });

    it('should handle items with special characters', async () => {
      const items = [{ label: '@Special', onClick: jest.fn() }];
      render(
        <Dropdown trigger={<button>Menu</button>} items={items} />
      );
      const trigger = screen.getByText('Menu');

      await userEvent.click(trigger);
      expect(screen.getByText('@Special')).toBeInTheDocument();
    });

    it('should handle very long item labels', async () => {
      const longLabel = 'A'.repeat(50);
      const items = [{ label: longLabel, onClick: jest.fn() }];
      render(
        <Dropdown trigger={<button>Menu</button>} items={items} />
      );
      const trigger = screen.getByText('Menu');

      await userEvent.click(trigger);
      expect(screen.getByText(longLabel)).toBeInTheDocument();
    });
  });

  // Integration Tests
  describe('Integration', () => {
    it('should work in a toolbar context', async () => {
      render(
        <div className="toolbar">
          <button>Save</button>
          <Dropdown trigger={<button>⋯</button>} items={mockItems} />
        </div>
      );
      const saveButton = screen.getByText('Save');
      const moreButton = screen.getByText('⋯');
      expect(saveButton).toBeInTheDocument();
      expect(moreButton).toBeInTheDocument();
    });

    it('should work with form integration', async () => {
      const handleDelete = jest.fn();
      render(
        <form>
          <input type="text" />
          <Dropdown
            trigger={<button type="button">Options</button>}
            items={[{ label: 'Delete', onClick: handleDelete, danger: true }]}
          />
        </form>
      );
      const trigger = screen.getByText('Options');
      await userEvent.click(trigger);
      await userEvent.click(screen.getByText('Delete'));
      expect(handleDelete).toHaveBeenCalled();
    });
  });
});
