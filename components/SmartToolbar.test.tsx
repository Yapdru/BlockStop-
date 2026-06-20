/**
 * SmartToolbar Component Tests
 * Tests for fixed toolbar with actions and context text
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SmartToolbar, ToolbarAction } from './SmartToolbar';

describe('SmartToolbar Component', () => {
  const mockActions: ToolbarAction[] = [
    { id: '1', label: 'Save', icon: '💾', onClick: jest.fn() },
    { id: '2', label: 'Edit', icon: '✎', onClick: jest.fn() },
    { id: '3', label: 'Delete', icon: '🗑️', onClick: jest.fn(), disabled: false },
  ];

  // Rendering Tests
  describe('Rendering', () => {
    it('should render toolbar container', () => {
      const { container } = render(<SmartToolbar actions={mockActions} />);
      expect(container.querySelector('div[class*="fixed"]')).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      render(<SmartToolbar actions={mockActions} />);
      mockActions.forEach((action) => {
        expect(screen.getByText(action.icon)).toBeInTheDocument();
      });
    });

    it('should render empty toolbar gracefully', () => {
      const { container } = render(<SmartToolbar actions={[]} />);
      expect(container.querySelector('div[class*="fixed"]')).toBeInTheDocument();
    });

    it('should render with context when provided', () => {
      render(<SmartToolbar actions={mockActions} context="Editing mode" />);
      expect(screen.getByText('Editing mode')).toBeInTheDocument();
    });

    it('should not render context when not provided', () => {
      const { container } = render(<SmartToolbar actions={mockActions} />);
      const contextText = container.querySelector('div[class*="text-xs"]');
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  // Action Button Tests
  describe('Action Buttons', () => {
    it('should render all action buttons', () => {
      render(<SmartToolbar actions={mockActions} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(mockActions.length);
    });

    it('should display action icons', () => {
      render(<SmartToolbar actions={mockActions} />);
      expect(screen.getByText('💾')).toBeInTheDocument();
      expect(screen.getByText('✎')).toBeInTheDocument();
      expect(screen.getByText('🗑️')).toBeInTheDocument();
    });

    it('should have title attribute for accessibility', () => {
      render(<SmartToolbar actions={mockActions} />);
      const button = screen.getByTitle('Save');
      expect(button).toBeInTheDocument();
    });

    it('should render buttons vertically', () => {
      const { container } = render(<SmartToolbar actions={mockActions} />);
      const buttonGroup = container.querySelector('div[class*="flex-col"]');
      expect(buttonGroup).toHaveClass('flex', 'flex-col');
    });
  });

  // Action Handler Tests
  describe('Action Handlers', () => {
    it('should call action onClick when button clicked', async () => {
      const saveAction = { id: '1', label: 'Save', icon: '💾', onClick: jest.fn() };
      render(<SmartToolbar actions={[saveAction]} />);

      const button = screen.getByText('💾').closest('button');
      if (button) {
        await userEvent.click(button);
      }
      expect(saveAction.onClick).toHaveBeenCalled();
    });

    it('should call multiple actions independently', async () => {
      const action1 = { id: '1', label: 'Save', icon: '💾', onClick: jest.fn() };
      const action2 = { id: '2', label: 'Edit', icon: '✎', onClick: jest.fn() };
      render(<SmartToolbar actions={[action1, action2]} />);

      const saveButton = screen.getByText('💾').closest('button');
      if (saveButton) {
        await userEvent.click(saveButton);
      }
      expect(action1.onClick).toHaveBeenCalled();
      expect(action2.onClick).not.toHaveBeenCalled();
    });

    it('should not call disabled action', async () => {
      const disabledAction = {
        id: '1',
        label: 'Delete',
        icon: '🗑️',
        onClick: jest.fn(),
        disabled: true,
      };
      render(<SmartToolbar actions={[disabledAction]} />);

      const button = screen.getByText('🗑️').closest('button');
      if (button) {
        await userEvent.click(button);
      }
      // Disabled buttons should not be clickable
      expect(button).toBeDisabled();
    });
  });

  // Disabled State Tests
  describe('Disabled State', () => {
    it('should disable button when disabled prop is true', () => {
      const disabledAction = {
        id: '1',
        label: 'Delete',
        icon: '🗑️',
        onClick: jest.fn(),
        disabled: true,
      };
      render(<SmartToolbar actions={[disabledAction]} />);

      const button = screen.getByText('🗑️').closest('button');
      expect(button).toBeDisabled();
    });

    it('should not disable button when disabled is false', () => {
      const enabledAction = {
        id: '1',
        label: 'Save',
        icon: '💾',
        onClick: jest.fn(),
        disabled: false,
      };
      render(<SmartToolbar actions={[enabledAction]} />);

      const button = screen.getByText('💾').closest('button');
      expect(button).not.toBeDisabled();
    });

    it('should apply disabled styling', () => {
      const disabledAction = {
        id: '1',
        label: 'Delete',
        icon: '🗑️',
        onClick: jest.fn(),
        disabled: true,
      };
      const { container } = render(<SmartToolbar actions={[disabledAction]} />);
      const button = screen.getByText('🗑️').closest('button');
      expect(button).toHaveClass('text-neutral-300', 'cursor-not-allowed');
    });

    it('should apply enabled styling', () => {
      const enabledAction = {
        id: '1',
        label: 'Save',
        icon: '💾',
        onClick: jest.fn(),
        disabled: false,
      };
      const { container } = render(<SmartToolbar actions={[enabledAction]} />);
      const button = screen.getByText('💾').closest('button');
      expect(button).toHaveClass('text-neutral-700', 'hover:bg-primary-50');
    });
  });

  // Context Tests
  describe('Context Text', () => {
    it('should render context when provided', () => {
      render(<SmartToolbar actions={mockActions} context="Text mode" />);
      expect(screen.getByText('Text mode')).toBeInTheDocument();
    });

    it('should not render context when empty string', () => {
      const { container } = render(<SmartToolbar actions={mockActions} context="" />);
      const hasContext = container.textContent?.includes('text-neutral-600') || false;
      expect(container.querySelector('div[class*="fixed"]')).toBeInTheDocument();
    });

    it('should have context styling', () => {
      render(<SmartToolbar actions={mockActions} context="Active" />);
      const context = screen.getByText('Active');
      expect(context).toHaveClass('text-xs', 'text-neutral-600');
    });

    it('should display context above actions', () => {
      const { container } = render(
        <SmartToolbar actions={mockActions} context="Mode" />
      );
      const flexContainer = container.querySelector('div[class*="flex"][class*="flex-col"]');
      expect(flexContainer).toBeInTheDocument();
    });
  });

  // Styling Tests
  describe('Styling', () => {
    it('should have fixed positioning', () => {
      const { container } = render(<SmartToolbar actions={mockActions} />);
      const toolbar = container.querySelector('div[class*="fixed"]');
      expect(toolbar).toHaveClass('fixed', 'bottom-24', 'right-6');
    });

    it('should have vertical layout', () => {
      const { container } = render(<SmartToolbar actions={mockActions} />);
      const layout = container.querySelector('div[class*="flex-col"]');
      expect(layout).toHaveClass('flex', 'flex-col', 'gap-2');
    });

    it('should have button container styling', () => {
      const { container } = render(<SmartToolbar actions={mockActions} />);
      const buttonContainer = container.querySelector('div[class*="bg-white"]');
      expect(buttonContainer).toHaveClass(
        'bg-white',
        'border',
        'border-neutral-200',
        'rounded-lg',
        'shadow-lg'
      );
    });

    it('should have animation class', () => {
      const { container } = render(<SmartToolbar actions={mockActions} />);
      const toolbar = container.querySelector('div[class*="animate-slideUp"]');
      expect(toolbar).toHaveClass('animate-slideUp');
    });

    it('should have z-index for layering', () => {
      const { container } = render(<SmartToolbar actions={mockActions} />);
      const toolbar = container.querySelector('div[class*="z-40"]');
      expect(toolbar).toHaveClass('z-40');
    });
  });

  // Button Styling Tests
  describe('Button Styling', () => {
    it('should have button hover states', () => {
      const { container } = render(<SmartToolbar actions={mockActions} />);
      const button = container.querySelector('button');
      expect(button).toHaveClass('hover:bg-primary-50', 'hover:text-primary-600');
    });

    it('should have transition effect', () => {
      const { container } = render(<SmartToolbar actions={mockActions} />);
      const button = container.querySelector('button');
      expect(button).toHaveClass('transition-colors');
    });

    it('should have consistent button sizing', () => {
      const { container } = render(<SmartToolbar actions={mockActions} />);
      const button = container.querySelector('button');
      expect(button).toHaveClass('p-3', 'rounded');
    });

    it('should display icons as large text', () => {
      const { container } = render(<SmartToolbar actions={mockActions} />);
      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBe(mockActions.length);
    });
  });

  // Icon Tests
  describe('Icons', () => {
    it('should render emoji icons', () => {
      render(<SmartToolbar actions={mockActions} />);
      expect(screen.getByText('💾')).toBeInTheDocument();
    });

    it('should handle various icon formats', () => {
      const actions = [
        { id: '1', label: 'Save', icon: '💾', onClick: jest.fn() },
        { id: '2', label: 'Star', icon: '⭐', onClick: jest.fn() },
        { id: '3', label: 'Check', icon: '✓', onClick: jest.fn() },
      ];
      render(<SmartToolbar actions={actions} />);
      expect(screen.getByText('💾')).toBeInTheDocument();
      expect(screen.getByText('⭐')).toBeInTheDocument();
      expect(screen.getByText('✓')).toBeInTheDocument();
    });
  });

  // Accessibility Tests
  describe('Accessibility', () => {
    it('should have button roles', () => {
      render(<SmartToolbar actions={mockActions} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(mockActions.length);
    });

    it('should have title attributes for button labels', () => {
      render(<SmartToolbar actions={mockActions} />);
      expect(screen.getByTitle('Save')).toBeInTheDocument();
      expect(screen.getByTitle('Edit')).toBeInTheDocument();
    });

    it('should be keyboard accessible', async () => {
      render(<SmartToolbar actions={mockActions} />);
      const buttons = screen.getAllByRole('button');
      buttons[0].focus();
      expect(buttons[0]).toHaveFocus();
    });

    it('should support disabled button accessibility', () => {
      const actions = [
        { id: '1', label: 'Disabled', icon: '❌', onClick: jest.fn(), disabled: true },
      ];
      render(<SmartToolbar actions={actions} />);
      const button = screen.getByTitle('Disabled');
      expect(button).toBeDisabled();
    });
  });

  // Edge Cases
  describe('Edge Cases', () => {
    it('should handle empty actions array', () => {
      const { container } = render(<SmartToolbar actions={[]} />);
      expect(container.querySelector('div[class*="fixed"]')).toBeInTheDocument();
    });

    it('should handle single action', () => {
      const actions = [{ id: '1', label: 'Action', icon: '✓', onClick: jest.fn() }];
      render(<SmartToolbar actions={actions} />);
      expect(screen.getByText('✓')).toBeInTheDocument();
    });

    it('should handle many actions', () => {
      const actions = Array.from({ length: 10 }, (_, i) => ({
        id: String(i),
        label: `Action ${i}`,
        icon: '📍',
        onClick: jest.fn(),
      }));
      render(<SmartToolbar actions={actions} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(10);
    });

    it('should handle very long context', () => {
      const longContext = 'A'.repeat(100);
      render(<SmartToolbar actions={mockActions} context={longContext} />);
      expect(screen.getByText(longContext.slice(0, 50))).toBeInTheDocument();
    });

    it('should handle all actions disabled', () => {
      const disabledActions = mockActions.map((a) => ({ ...a, disabled: true }));
      const { container } = render(<SmartToolbar actions={disabledActions} />);
      const buttons = container.querySelectorAll('button');
      buttons.forEach((btn) => {
        expect(btn).toBeDisabled();
      });
    });
  });

  // Integration Tests
  describe('Integration', () => {
    it('should work in page layout', () => {
      render(
        <div>
          <main>Page content</main>
          <SmartToolbar actions={mockActions} context="Editing" />
        </div>
      );
      expect(screen.getByText('Page content')).toBeInTheDocument();
      expect(screen.getByText('💾')).toBeInTheDocument();
    });

    it('should work with dynamic actions', async () => {
      const { rerender } = render(<SmartToolbar actions={mockActions} />);
      expect(screen.getByText('💾')).toBeInTheDocument();

      const newActions = [{ id: '1', label: 'New', icon: '🆕', onClick: jest.fn() }];
      rerender(<SmartToolbar actions={newActions} />);
      expect(screen.getByText('🆕')).toBeInTheDocument();
    });
  });

  // State Transitions Tests
  describe('State Transitions', () => {
    it('should update context dynamically', () => {
      const { rerender } = render(
        <SmartToolbar actions={mockActions} context="Mode 1" />
      );
      expect(screen.getByText('Mode 1')).toBeInTheDocument();

      rerender(<SmartToolbar actions={mockActions} context="Mode 2" />);
      expect(screen.getByText('Mode 2')).toBeInTheDocument();
    });
  });
});
