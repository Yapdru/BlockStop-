/**
 * Keyboard Shortcut Definitions and Handlers
 * WCAG 2.1 Level AAA - Keyboard Accessible (2.1.1)
 * All functionality accessible via keyboard
 */

export type KeyModifier = 'ctrl' | 'alt' | 'shift' | 'cmd' | 'meta';
export type KeyboardEventType = 'keydown' | 'keyup' | 'keypress';

/**
 * Standard keyboard shortcuts for universal UI patterns
 */
export const KEYBOARD_SHORTCUTS = {
  // Navigation
  SKIP_TO_MAIN: { key: 'k', modifiers: ['alt'] },
  FOCUS_SEARCH: { key: '/', modifiers: [] },
  OPEN_MENU: { key: 'm', modifiers: ['alt'] },
  PREVIOUS_ITEM: { key: 'ArrowUp', modifiers: [] },
  NEXT_ITEM: { key: 'ArrowDown', modifiers: [] },
  FIRST_ITEM: { key: 'Home', modifiers: [] },
  LAST_ITEM: { key: 'End', modifiers: [] },

  // Form Controls
  SUBMIT_FORM: { key: 'Enter', modifiers: ['ctrl'] },
  CANCEL_FORM: { key: 'Escape', modifiers: [] },
  RESET_FORM: { key: 'r', modifiers: ['ctrl'] },

  // Modal/Dialog
  CLOSE_MODAL: { key: 'Escape', modifiers: [] },
  CONFIRM_ACTION: { key: 'Enter', modifiers: [] },

  // Selection
  SELECT_ALL: { key: 'a', modifiers: ['ctrl'] },
  TOGGLE_SELECTION: { key: ' ', modifiers: [] },

  // Actions
  DELETE: { key: 'Delete', modifiers: [] },
  UNDO: { key: 'z', modifiers: ['ctrl'] },
  REDO: { key: 'z', modifiers: ['ctrl', 'shift'] },
  SAVE: { key: 's', modifiers: ['ctrl'] },

  // Accessibility
  INCREASE_FONT: { key: '+', modifiers: ['ctrl'] },
  DECREASE_FONT: { key: '-', modifiers: ['ctrl'] },
  TOGGLE_THEME: { key: 't', modifiers: ['alt'] },
  HELP: { key: '?', modifiers: [] },
} as const;

/**
 * Standard modifier key mappings across platforms
 */
export const MODIFIER_KEYS = {
  CTRL: /Mac|iPhone|iPad|iPod/.test(navigator.platform) ? 'cmd' : 'ctrl',
  ALT: /Mac|iPhone|iPad|iPod/.test(navigator.platform) ? 'option' : 'alt',
} as const;

/**
 * Keyboard shortcut definition interface
 */
export interface KeyboardShortcut {
  key: string;
  modifiers?: KeyModifier[];
  description?: string;
  category?: string;
  preventDefault?: boolean;
}

/**
 * Keyboard event handler interface
 */
export interface KeyboardEventHandler {
  (event: KeyboardEvent): void | boolean;
}

/**
 * Registry for keyboard shortcuts
 */
class KeyboardShortcutRegistry {
  private shortcuts: Map<string, KeyboardShortcut> = new Map();
  private handlers: Map<string, Set<KeyboardEventHandler>> = new Map();

  /**
   * Register a keyboard shortcut
   */
  register(id: string, shortcut: KeyboardShortcut): void {
    this.shortcuts.set(id, shortcut);
    if (!this.handlers.has(id)) {
      this.handlers.set(id, new Set());
    }
  }

  /**
   * Register a handler for a shortcut
   */
  onShortcut(id: string, handler: KeyboardEventHandler): void {
    if (!this.handlers.has(id)) {
      this.handlers.set(id, new Set());
    }
    this.handlers.get(id)!.add(handler);
  }

  /**
   * Unregister a handler
   */
  offShortcut(id: string, handler: KeyboardEventHandler): void {
    this.handlers.get(id)?.delete(handler);
  }

  /**
   * Get registered shortcut by ID
   */
  getShortcut(id: string): KeyboardShortcut | undefined {
    return this.shortcuts.get(id);
  }

  /**
   * Get all registered shortcuts
   */
  getAllShortcuts(): Map<string, KeyboardShortcut> {
    return new Map(this.shortcuts);
  }

  /**
   * Handle keyboard event and trigger registered handlers
   */
  handleKeyEvent(event: KeyboardEvent): boolean {
    for (const [id, shortcut] of this.shortcuts) {
      if (this.matchesShortcut(event, shortcut)) {
        const handlers = this.handlers.get(id);
        if (handlers) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }
          for (const handler of handlers) {
            handler(event);
          }
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Check if keyboard event matches a shortcut definition
   */
  private matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
    const modifiers = shortcut.modifiers || [];

    // Check modifiers
    const ctrlKey = event.ctrlKey || event.metaKey;
    const altKey = event.altKey;
    const shiftKey = event.shiftKey;

    const hasCtrl = modifiers.includes('ctrl') || modifiers.includes('meta');
    const hasAlt = modifiers.includes('alt');
    const hasShift = modifiers.includes('shift');

    if (ctrlKey !== hasCtrl || altKey !== hasAlt || shiftKey !== hasShift) {
      return false;
    }

    // Check key
    return event.key.toLowerCase() === shortcut.key.toLowerCase();
  }

  /**
   * Clear all shortcuts
   */
  clear(): void {
    this.shortcuts.clear();
    this.handlers.clear();
  }
}

// Export singleton registry
export const shortcutRegistry = new KeyboardShortcutRegistry();

/**
 * Hook for registering keyboard shortcuts in React components
 */
export function useKeyboardShortcut(
  id: string,
  shortcut: KeyboardShortcut,
  handler: KeyboardEventHandler,
  enabled = true
) {
  // Register shortcut on mount
  React.useEffect(() => {
    if (enabled) {
      shortcutRegistry.register(id, shortcut);
      shortcutRegistry.onShortcut(id, handler);

      // Add global listener
      const handleKeyDown = (event: KeyboardEvent) => {
        shortcutRegistry.handleKeyEvent(event);
      };

      window.addEventListener('keydown', handleKeyDown);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        shortcutRegistry.offShortcut(id, handler);
      };
    }
  }, [id, shortcut, handler, enabled]);
}

/**
 * Format keyboard shortcut for display
 * @param shortcut - Keyboard shortcut definition
 * @returns Formatted string like "Ctrl+S" or "Cmd+Shift+K"
 */
export function formatKeyboardShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  if (shortcut.modifiers) {
    for (const modifier of shortcut.modifiers) {
      parts.push(capitalize(modifier));
    }
  }

  parts.push(formatKey(shortcut.key));

  return parts.join('+');
}

/**
 * Format individual key for display
 */
function formatKey(key: string): string {
  const keyMap: Record<string, string> = {
    ' ': 'Space',
    'Enter': 'Enter',
    'Escape': 'Esc',
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    'ArrowLeft': '←',
    'ArrowRight': '→',
    'Backspace': 'Backspace',
    'Delete': 'Delete',
    'Tab': 'Tab',
    'Control': 'Ctrl',
    'Shift': 'Shift',
    'Alt': 'Alt',
    'Meta': 'Cmd',
  };

  return keyMap[key] || key.toUpperCase();
}

/**
 * Capitalize first letter of string
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Check if keyboard event is a standard navigation key
 */
export function isNavigationKey(event: KeyboardEvent): boolean {
  const navigationKeys = [
    'ArrowUp',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'Home',
    'End',
    'PageUp',
    'PageDown',
    'Tab',
  ];
  return navigationKeys.includes(event.key);
}

/**
 * Check if keyboard event is an activation key
 */
export function isActivationKey(event: KeyboardEvent): boolean {
  return event.key === 'Enter' || event.key === ' ';
}

/**
 * Check if keyboard event should close a modal/dialog
 */
export function isDismissKey(event: KeyboardEvent): boolean {
  return event.key === 'Escape';
}

/**
 * Prevent keyboard event from bubbling
 */
export function stopKeyboardEventPropagation(event: KeyboardEvent): void {
  event.preventDefault();
  event.stopPropagation();
}

/**
 * Get keyboard event modifiers as string
 */
export function getModifierString(event: KeyboardEvent): string {
  const modifiers: string[] = [];
  if (event.ctrlKey) modifiers.push('ctrl');
  if (event.altKey) modifiers.push('alt');
  if (event.shiftKey) modifiers.push('shift');
  if (event.metaKey) modifiers.push('meta');
  return modifiers.join('+');
}

/**
 * Utility to generate keyboard shortcut help text
 */
export function generateShortcutHelpText(shortcuts: Map<string, KeyboardShortcut>): string {
  const lines: string[] = ['Available Keyboard Shortcuts:'];

  for (const [id, shortcut] of shortcuts) {
    const formatted = formatKeyboardShortcut(shortcut);
    const description = shortcut.description || id;
    lines.push(`  ${formatted}: ${description}`);
  }

  return lines.join('\n');
}

// Default import needed for useKeyboardShortcut
import React from 'react';

/**
 * Accessibility note: All keyboard shortcuts should:
 * 1. Not conflict with browser/AT shortcuts
 * 2. Be documented and available via help dialog
 * 3. Be optional (not required for any functionality)
 * 4. Work with any keyboard layout
 * 5. Include modifiers to avoid conflicts with single keys
 */
