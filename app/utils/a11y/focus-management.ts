/**
 * Focus Management Utilities
 * WCAG 2.1 Level AAA - Focus Management (2.4.3, 2.4.7)
 * Handles focus trapping, focus restoration, and focus indicators
 */

/**
 * Find all focusable elements within a container
 * Includes interactive elements and elements with tabindex >= 0
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'textarea:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    'audio[controls]',
    'video[controls]',
  ];

  const focusableElements = Array.from(
    container.querySelectorAll<HTMLElement>(selectors.join(','))
  ).filter((element) => {
    return element.offsetParent !== null && getComputedStyle(element).visibility !== 'hidden';
  });

  return focusableElements;
}

/**
 * Get the first focusable element in a container
 */
export function getFirstFocusableElement(container: HTMLElement): HTMLElement | null {
  const focusableElements = getFocusableElements(container);
  return focusableElements.length > 0 ? focusableElements[0] : null;
}

/**
 * Get the last focusable element in a container
 */
export function getLastFocusableElement(container: HTMLElement): HTMLElement | null {
  const focusableElements = getFocusableElements(container);
  return focusableElements.length > 0 ? focusableElements[focusableElements.length - 1] : null;
}

/**
 * Check if an element is currently focused
 */
export function isFocused(element: HTMLElement): boolean {
  return document.activeElement === element;
}

/**
 * Focus an element safely
 */
export function focusElement(element: HTMLElement, options?: { preventScroll?: boolean }): void {
  if (element && typeof element.focus === 'function') {
    element.focus(options);
  }
}

/**
 * Focus an element with a smooth scroll into view
 */
export function focusElementWithScroll(element: HTMLElement): void {
  focusElement(element, { preventScroll: true });
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * Move focus to the first focusable element in container
 */
export function focusFirstElement(container: HTMLElement): boolean {
  const firstElement = getFirstFocusableElement(container);
  if (firstElement) {
    focusElement(firstElement);
    return true;
  }
  return false;
}

/**
 * Move focus to the last focusable element in container
 */
export function focusLastElement(container: HTMLElement): boolean {
  const lastElement = getLastFocusableElement(container);
  if (lastElement) {
    focusElement(lastElement);
    return true;
  }
  return false;
}

/**
 * Save the currently focused element for later restoration
 */
let savedFocusElement: HTMLElement | null = null;

export function saveFocusPosition(): void {
  savedFocusElement = document.activeElement as HTMLElement;
}

/**
 * Restore focus to previously saved element
 */
export function restoreFocusPosition(): boolean {
  if (savedFocusElement && savedFocusElement.offsetParent !== null) {
    focusElement(savedFocusElement);
    savedFocusElement = null;
    return true;
  }
  savedFocusElement = null;
  return false;
}

/**
 * Clear saved focus position
 */
export function clearSavedFocusPosition(): void {
  savedFocusElement = null;
}

/**
 * Focus trap implementation for modals and dialogs
 */
export class FocusTrap {
  private container: HTMLElement;
  private firstFocusable: HTMLElement | null = null;
  private lastFocusable: HTMLElement | null = null;
  private keydownHandler: ((event: KeyboardEvent) => void) | null = null;
  private isActive = false;

  constructor(container: HTMLElement) {
    this.container = container;
    this.updateFocusableElements();
  }

  /**
   * Update list of focusable elements (call after DOM changes)
   */
  updateFocusableElements(): void {
    const focusableElements = getFocusableElements(this.container);
    this.firstFocusable = focusableElements[0] || null;
    this.lastFocusable = focusableElements[focusableElements.length - 1] || null;
  }

  /**
   * Activate the focus trap
   */
  activate(): void {
    if (this.isActive) return;

    this.isActive = true;
    this.updateFocusableElements();

    // Focus first focusable element
    if (this.firstFocusable) {
      focusElement(this.firstFocusable);
    }

    // Set up keyboard handler
    this.keydownHandler = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        this.handleTabKey(event);
      }
    };

    document.addEventListener('keydown', this.keydownHandler);
  }

  /**
   * Deactivate the focus trap
   */
  deactivate(): void {
    if (!this.isActive) return;

    this.isActive = false;

    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }
  }

  /**
   * Handle Tab key navigation within trap
   */
  private handleTabKey(event: KeyboardEvent): void {
    if (!this.firstFocusable || !this.lastFocusable) {
      event.preventDefault();
      return;
    }

    const isShiftPressed = event.shiftKey;
    const activeElement = document.activeElement as HTMLElement;

    if (isShiftPressed) {
      // Shift + Tab: move backwards
      if (activeElement === this.firstFocusable) {
        event.preventDefault();
        focusElement(this.lastFocusable);
      }
    } else {
      // Tab: move forwards
      if (activeElement === this.lastFocusable) {
        event.preventDefault();
        focusElement(this.firstFocusable);
      }
    }
  }

  /**
   * Check if focus trap is active
   */
  isActive_(): boolean {
    return this.isActive;
  }

  /**
   * Destroy the focus trap
   */
  destroy(): void {
    this.deactivate();
    this.firstFocusable = null;
    this.lastFocusable = null;
  }
}

/**
 * Hook for managing focus trap in React components
 */
export function useFocusTrap(containerRef: React.RefObject<HTMLElement>, isActive = true) {
  const trapRef = React.useRef<FocusTrap | null>(null);

  React.useEffect(() => {
    if (!containerRef.current) return;

    trapRef.current = new FocusTrap(containerRef.current);

    if (isActive) {
      trapRef.current.activate();
    }

    return () => {
      trapRef.current?.destroy();
      trapRef.current = null;
    };
  }, [containerRef, isActive]);

  return trapRef;
}

/**
 * Manage focus on page navigation
 */
export function manageFocusOnNavigation(targetId?: string): void {
  let targetElement: HTMLElement | null = null;

  if (targetId) {
    targetElement = document.getElementById(targetId);
  }

  if (!targetElement) {
    // Try to find main content area
    targetElement =
      document.querySelector('main') ||
      document.querySelector('[role="main"]') ||
      document.querySelector('h1');
  }

  if (targetElement) {
    // Add tabindex if needed
    if (!targetElement.hasAttribute('tabindex')) {
      targetElement.setAttribute('tabindex', '-1');
    }
    focusElementWithScroll(targetElement);
  }
}

/**
 * Announce focus change to screen readers
 */
export function announceFocusChange(element: HTMLElement, message: string): void {
  // Create temporary live region
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Clean up after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Check if an element is visible and can receive focus
 */
export function canReceiveFocus(element: HTMLElement): boolean {
  if (element.offsetParent === null) {
    return false; // Element is hidden
  }

  const style = getComputedStyle(element);
  if (style.visibility === 'hidden' || style.display === 'none') {
    return false;
  }

  return true;
}

/**
 * Get the next focusable element in the tab order
 */
export function getNextFocusableElement(
  container: HTMLElement,
  direction: 'forward' | 'backward' = 'forward'
): HTMLElement | null {
  const focusableElements = getFocusableElements(container);
  const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);

  if (direction === 'forward') {
    return focusableElements[currentIndex + 1] || null;
  } else {
    return focusableElements[currentIndex - 1] || null;
  }
}

/**
 * Create a keyboard shortcut for focus management
 */
export function createFocusShortcut(element: HTMLElement, key: string = 'f'): void {
  const handler = (event: KeyboardEvent) => {
    if (event.key === key && event.altKey) {
      event.preventDefault();
      focusElement(element);
    }
  };

  document.addEventListener('keydown', handler);
}

/**
 * React hook for managing focus on element mount
 */
export function useAutoFocus(ref: React.RefObject<HTMLElement>, enabled = true) {
  React.useEffect(() => {
    if (enabled && ref.current) {
      focusElement(ref.current);
    }
  }, [enabled, ref]);
}

/**
 * Reset focus to body (for cleaning up focus)
 */
export function resetFocus(): void {
  (document.body as HTMLElement).focus();
}

// Default import for hooks
import React from 'react';

/**
 * Accessibility best practices for focus management:
 * 1. Focus indicators must be visible (3:1 contrast ratio)
 * 2. Focus order should match visual order
 * 3. Focus traps should be used in modals and dialogs
 * 4. Focus should be managed on page navigation
 * 5. Focus should be restored when closing modals/dialogs
 */
