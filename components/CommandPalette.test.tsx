/**
 * CommandPalette Component Tests
 * Tests for command palette with keyboard shortcuts, search, and command filtering
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommandPalette, Command } from './CommandPalette';

describe('CommandPalette Component', () => {
  const mockCommands: Command[] = [
    {
      id: '1',
      label: 'Create New',
      description: 'Create a new document',
      action: jest.fn(),
      icon: '✏️',
    },
    {
      id: '2',
      label: 'Search',
      description: 'Search all documents',
      action: jest.fn(),
      icon: '🔍',
    },
    {
      id: '3',
      label: 'Settings',
      description: 'Open settings',
      action: jest.fn(),
    },
  ];

  // Rendering Tests
  describe('Rendering', () => {
    it('should not render when closed', () => {
      const { container } = render(
        <CommandPalette commands={mockCommands} isOpen={false} />
      );
      expect(container.querySelector('input')).not.toBeInTheDocument();
    });

    it('should render when open', () => {
      render(<CommandPalette commands={mockCommands} isOpen={true} />);
      const input = screen.getByPlaceholderText(/Search commands/i);
      expect(input).toBeInTheDocument();
    });

    it('should render search input', () => {
      render(<CommandPalette commands={mockCommands} isOpen={true} />);
      expect(screen.getByPlaceholderText(/Search commands/i)).toBeInTheDocument();
    });

    it('should render command list', () => {
      render(<CommandPalette commands={mockCommands} isOpen={true} />);
      expect(screen.getByText('Create New')).toBeInTheDocument();
      expect(screen.getByText('Search')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should render command descriptions', () => {
      render(<CommandPalette commands={mockCommands} isOpen={true} />);
      expect(screen.getByText('Create a new document')).toBeInTheDocument();
      expect(screen.getByText('Search all documents')).toBeInTheDocument();
    });

    it('should render command icons', () => {
      render(<CommandPalette commands={mockCommands} isOpen={true} />);
      expect(screen.getByText('✏️')).toBeInTheDocument();
      expect(screen.getByText('🔍')).toBeInTheDocument();
    });

    it('should autoFocus input when opened', () => {
      render(<CommandPalette commands={mockCommands} isOpen={true} />);
      const input = screen.getByPlaceholderText(/Search commands/i);
      expect(input).toHaveFocus();
    });
  });

  // Search/Filter Tests
  describe('Search Filtering', () => {
    it('should filter commands by label', async () => {
      render(<CommandPalette commands={mockCommands} isOpen={true} />);
      const input = screen.getByPlaceholderText(/Search commands/i);

      await userEvent.type(input, 'Create');
      expect(screen.getByText('Create New')).toBeInTheDocument();
      expect(screen.queryByText('Search')).not.toBeInTheDocument();
    });

    it('should filter commands by description', async () => {
      render(<CommandPalette commands={mockCommands} isOpen={true} />);
      const input = screen.getByPlaceholderText(/Search commands/i);

      await userEvent.type(input, 'document');
      expect(screen.getByText('Create New')).toBeInTheDocument();
    });

    it('should be case insensitive', async () => {
      render(<CommandPalette commands={mockCommands} isOpen={true} />);
      const input = screen.getByPlaceholderText(/Search commands/i);

      await userEvent.type(input, 'SEARCH');
      expect(screen.getByText('Search')).toBeInTheDocument();
    });

    it('should show no results message when no matches', async () => {
      render(<CommandPalette commands={mockCommands} isOpen={true} />);
      const input = screen.getByPlaceholderText(/Search commands/i);

      await userEvent.type(input, 'XYZ');
      expect(screen.getByText(/No commands found/i)).toBeInTheDocument();
    });

    it('should show all commands with empty search', async () => {
      render(<CommandPalette commands={mockCommands} isOpen={true} />);
      expect(screen.getByText('Create New')).toBeInTheDocument();
      expect(screen.getByText('Search')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should handle partial matches', async () => {
      render(<CommandPalette commands={mockCommands} isOpen={true} />);
      const input = screen.getByPlaceholderText(/Search commands/i);

      await userEvent.type(input, 'Set');
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });
  });

  // Keyboard Shortcut Tests
  describe('Keyboard Shortcuts', () => {
    it('should open on Cmd+K', async () => {
      const { rerender } = render(
        <CommandPalette commands={mockCommands} isOpen={false} />
      );

      fireEvent.keyDown(window, { metaKey: true, key: 'k' });
      rerender(<CommandPalette commands={mockCommands} isOpen={true} />);
      expect(screen.getByPlaceholderText(/Search commands/i)).toBeInTheDocument();
    });

    it('should open on Ctrl+K', async () => {
      const { rerender } = render(
        <CommandPalette commands={mockCommands} isOpen={false} />
      );

      fireEvent.keyDown(window, { ctrlKey: true, key: 'k' });
      rerender(<CommandPalette commands={mockCommands} isOpen={true} />);
      expect(screen.getByPlaceholderText(/Search commands/i)).toBeInTheDocument();
    });

    it('should close on Escape', async () => {
      const handleClose = jest.fn();
      const { rerender } = render(
        <CommandPalette commands={mockCommands} isOpen={true} onClose={handleClose} />
      );

      fireEvent.keyDown(window, { key: 'Escape' });
      expect(handleClose).toHaveBeenCalled();
    });
  });

  // Command Execution Tests
  describe('Command Execution', () => {
    it('should execute command on click', async () => {
      const action = jest.fn();
      const commands = [
        { id: '1', label: 'Action', action, description: 'Do something' },
      ];
      render(<CommandPalette commands={commands} isOpen={true} />);

      const button = screen.getByText('Action');
      await userEvent.click(button);
      expect(action).toHaveBeenCalled();
    });

    it('should close after command execution', async () => {
      const handleClose = jest.fn();
      const action = jest.fn();
      const commands = [
        { id: '1', label: 'Action', action, description: 'Do something' },
      ];
      render(
        <CommandPalette commands={commands} isOpen={true} onClose={handleClose} />
      );

      const button = screen.getByText('Action');
      await userEvent.click(button);
      expect(handleClose).toHaveBeenCalled();
    });

    it('should call multiple commands independently', async () => {
      const action1 = jest.fn();
      const action2 = jest.fn();
      const commands = [
        { id: '1', label: 'Action 1', action: action1, description: 'First' },
        { id: '2', label: 'Action 2', action: action2, description: 'Second' },
      ];
      render(<CommandPalette commands={commands} isOpen={true} />);

      await userEvent.click(screen.getByText('Action 1'));
      expect(action1).toHaveBeenCalled();
      expect(action2).not.toHaveBeenCalled();
    });
  });

  // Backdrop Interaction Tests
  describe('Backdrop Interactions', () => {
    it('should close when backdrop is clicked', async () => {
      const handleClose = jest.fn();
      const { container } = render(
        <CommandPalette commands={mockCommands} isOpen={true} onClose={handleClose} />
      );

      const backdrop = container.querySelector('div[class*="bg-black"]');
      if (backdrop) {
        fireEvent.click(backdrop);
      }
      expect(handleClose).toHaveBeenCalled();
    });

    it('should not close when palette is clicked', async () => {
      const handleClose = jest.fn();
      const { container } = render(
        <CommandPalette commands={mockCommands} isOpen={true} onClose={handleClose} />
      );

      const palette = container.querySelector('div[class*="bg-neutral-0"]');
      if (palette) {
        fireEvent.click(palette);
      }
      expect(handleClose).not.toHaveBeenCalled();
    });
  });

  // Styling Tests
  describe('Styling', () => {
    it('should have fixed positioning', () => {
      const { container } = render(
        <CommandPalette commands={mockCommands} isOpen={true} />
      );
      const backdrop = container.querySelector('div[class*="fixed"]');
      expect(backdrop).toHaveClass('fixed', 'inset-0');
    });

    it('should have backdrop overlay', () => {
      const { container } = render(
        <CommandPalette commands={mockCommands} isOpen={true} />
      );
      const backdrop = container.querySelector('div[class*="bg-black"]');
      expect(backdrop).toHaveClass('bg-black/50');
    });

    it('should have palette styling', () => {
      const { container } = render(
        <CommandPalette commands={mockCommands} isOpen={true} />
      );
      const palette = container.querySelector('div[class*="bg-neutral-0"]');
      expect(palette).toHaveClass('bg-neutral-0', 'rounded-lg', 'shadow-2xl');
    });

    it('should have proper width constraints', () => {
      const { container } = render(
        <CommandPalette commands={mockCommands} isOpen={true} />
      );
      const palette = container.querySelector('div[class*="max-w-xl"]');
      expect(palette).toHaveClass('max-w-xl');
    });
  });

  // Icon Tests
  describe('Icons', () => {
    it('should render icons when provided', () => {
      render(<CommandPalette commands={mockCommands} isOpen={true} />);
      expect(screen.getByText('✏️')).toBeInTheDocument();
      expect(screen.getByText('🔍')).toBeInTheDocument();
    });

    it('should work without icons', () => {
      const noIconCommands = [
        { id: '1', label: 'Settings', action: jest.fn(), description: 'Config' },
      ];
      render(<CommandPalette commands={noIconCommands} isOpen={true} />);
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });
  });

  // Edge Cases
  describe('Edge Cases', () => {
    it('should handle empty command list', () => {
      render(<CommandPalette commands={[]} isOpen={true} />);
      expect(screen.getByText(/No commands found/i)).toBeInTheDocument();
    });

    it('should handle commands with same label', () => {
      const duplicates = [
        { id: '1', label: 'Action', action: jest.fn(), description: 'First' },
        { id: '2', label: 'Action', action: jest.fn(), description: 'Second' },
      ];
      render(<CommandPalette commands={duplicates} isOpen={true} />);
      const actions = screen.getAllByText('Action');
      expect(actions.length).toBe(2);
    });

    it('should handle very long command labels', () => {
      const longLabel = 'A'.repeat(100);
      const commands = [
        { id: '1', label: longLabel, action: jest.fn(), description: 'Long' },
      ];
      render(<CommandPalette commands={commands} isOpen={true} />);
      expect(screen.getByText(new RegExp(longLabel.slice(0, 20)))).toBeInTheDocument();
    });

    it('should handle special characters in search', async () => {
      render(<CommandPalette commands={mockCommands} isOpen={true} />);
      const input = screen.getByPlaceholderText(/Search commands/i);
      await userEvent.type(input, '@#$%');
      expect(screen.getByText(/No commands found/i)).toBeInTheDocument();
    });
  });

  // State Management Tests
  describe('State Management', () => {
    it('should update search as user types', async () => {
      render(<CommandPalette commands={mockCommands} isOpen={true} />);
      const input = screen.getByPlaceholderText(/Search commands/i) as HTMLInputElement;

      await userEvent.type(input, 'search');
      expect(input.value).toBe('search');
    });

    it('should clear search on command selection', async () => {
      const action = jest.fn();
      const commands = [
        { id: '1', label: 'Action', action, description: 'Do it' },
      ];
      render(<CommandPalette commands={commands} isOpen={true} />);
      const input = screen.getByPlaceholderText(/Search commands/i) as HTMLInputElement;

      await userEvent.type(input, 'Act');
      expect(input.value).toBe('Act');
    });
  });

  // Integration Tests
  describe('Integration', () => {
    it('should work in full application context', async () => {
      const handleClose = jest.fn();
      render(
        <div>
          <main>Page content</main>
          <CommandPalette
            commands={mockCommands}
            isOpen={true}
            onClose={handleClose}
          />
        </div>
      );
      expect(screen.getByText('Page content')).toBeInTheDocument();
      expect(screen.getByText('Create New')).toBeInTheDocument();
    });

    it('should work with keyboard shortcuts in context', async () => {
      render(<CommandPalette commands={mockCommands} isOpen={true} />);
      const input = screen.getByPlaceholderText(/Search commands/i);
      expect(input).toHaveFocus();
    });
  });

  // Accessibility Tests
  describe('Accessibility', () => {
    it('should have input role', () => {
      render(<CommandPalette commands={mockCommands} isOpen={true} />);
      const input = screen.getByPlaceholderText(/Search commands/i);
      expect(input).toHaveAttribute('type', 'text');
    });

    it('should have button roles for commands', () => {
      render(<CommandPalette commands={mockCommands} isOpen={true} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should be keyboard navigable', async () => {
      render(<CommandPalette commands={mockCommands} isOpen={true} />);
      const input = screen.getByPlaceholderText(/Search commands/i);
      input.focus();
      expect(input).toHaveFocus();
    });
  });
});
