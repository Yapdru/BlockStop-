/**
 * Accessibility utilities for WCAG 2.1 compliance
 */

export const a11y = {
  /**
   * Generate aria-label for filter/toggle buttons
   */
  filterLabel: (label: string, isActive: boolean) =>
    `${label}${isActive ? ' (currently selected)' : ''}`,

  /**
   * Generate aria-label for status badges
   */
  statusLabel: (status: string, value?: string | number) =>
    `${status}${value ? ': ' + value : ''}`,

  /**
   * Generate aria-label for risk levels
   */
  riskLabel: (level: 'critical' | 'high' | 'medium' | 'low') => {
    const descriptions = {
      critical: 'Critical severity threat',
      high: 'High severity threat',
      medium: 'Medium severity threat',
      low: 'Low severity threat',
    };
    return descriptions[level];
  },

  /**
   * Keyboard event handler for buttons that should act on Enter/Space
   */
  createKeyboardHandler: (callback: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      callback();
    }
  },

  /**
   * Focus trap utility for modals
   */
  trapFocus: (e: React.KeyboardEvent, containerRef: React.RefObject<HTMLDivElement>) => {
    if (e.key !== 'Tab') return;

    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement?.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement?.focus();
        e.preventDefault();
      }
    }
  },

  /**
   * Announce screen reader updates
   */
  announce: (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);

    setTimeout(() => {
      announcement.remove();
    }, 1000);
  },

  /**
   * Skip to main content link handler
   */
  skipToMain: () => {
    const main = document.querySelector('main');
    if (main) {
      main.tabIndex = -1;
      main.focus();
    }
  },
};

/**
 * CSS class for screen-reader-only content
 */
export const srOnly = 'sr-only absolute -inset-1 h-1 w-1 overflow-hidden whitespace-nowrap border-0 p-0 clip';
