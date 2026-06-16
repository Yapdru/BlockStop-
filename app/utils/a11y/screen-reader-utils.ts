/**
 * Screen Reader Text and Announcements
 * WCAG 2.1 Level AAA - Screen Reader Support (4.1.3)
 * Utilities for creating accessible announcements and hidden text
 */

/**
 * Create visually hidden text for screen readers
 * Uses a combination of CSS properties to hide text while keeping it readable by AT
 */
export const screenReaderOnlyStyles = {
  position: 'absolute' as const,
  width: '1px' as const,
  height: '1px' as const,
  padding: '0',
  margin: '-1px',
  overflow: 'hidden' as const,
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap' as const,
  borderWidth: '0',
};

/**
 * CSS class for screen reader only text
 */
export const SCREEN_READER_ONLY_CLASS = 'sr-only';

/**
 * Get computed screen reader text for element
 * @param element - HTML element
 * @returns Text content including aria-label, aria-labelledby, etc.
 */
export function getScreenReaderText(element: HTMLElement): string {
  const parts: string[] = [];

  // Check aria-label
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) {
    parts.push(ariaLabel);
  }

  // Check aria-labelledby
  const ariaLabelledBy = element.getAttribute('aria-labelledby');
  if (ariaLabelledBy) {
    const labelIds = ariaLabelledBy.split(' ');
    labelIds.forEach((id) => {
      const labelElement = document.getElementById(id);
      if (labelElement) {
        parts.push(labelElement.textContent || '');
      }
    });
  }

  // Check aria-describedby
  const ariaDescribedBy = element.getAttribute('aria-describedby');
  if (ariaDescribedBy) {
    const descIds = ariaDescribedBy.split(' ');
    descIds.forEach((id) => {
      const descElement = document.getElementById(id);
      if (descElement) {
        parts.push(descElement.textContent || '');
      }
    });
  }

  // Include element's text content if no aria attributes
  if (parts.length === 0) {
    parts.push(element.textContent || '');
  }

  return parts.filter(Boolean).join(' ');
}

/**
 * Announce text to screen readers
 * Uses live region to announce content changes
 */
export class ScreenReaderAnnouncer {
  private liveRegion: HTMLDivElement | null = null;
  private politeness: 'polite' | 'assertive' = 'polite';

  constructor(politeness: 'polite' | 'assertive' = 'polite') {
    this.politeness = politeness;
    this.initializeLiveRegion();
  }

  /**
   * Initialize live region element
   */
  private initializeLiveRegion(): void {
    this.liveRegion = document.createElement('div');
    this.liveRegion.setAttribute('role', 'status');
    this.liveRegion.setAttribute('aria-live', this.politeness);
    this.liveRegion.setAttribute('aria-atomic', 'true');
    this.liveRegion.className = SCREEN_READER_ONLY_CLASS;
    document.body.appendChild(this.liveRegion);
  }

  /**
   * Announce a message
   */
  announce(message: string, duration = 1000): void {
    if (!this.liveRegion) {
      this.initializeLiveRegion();
    }

    this.liveRegion!.textContent = message;

    // Clear after duration to allow re-announcement
    if (duration > 0) {
      setTimeout(() => {
        if (this.liveRegion) {
          this.liveRegion.textContent = '';
        }
      }, duration);
    }
  }

  /**
   * Announce multiple messages
   */
  announceMultiple(messages: string[], delay = 500): void {
    messages.forEach((message, index) => {
      setTimeout(() => {
        this.announce(message, 0);
      }, delay * index);
    });
  }

  /**
   * Destroy the live region
   */
  destroy(): void {
    if (this.liveRegion && this.liveRegion.parentNode) {
      this.liveRegion.parentNode.removeChild(this.liveRegion);
    }
    this.liveRegion = null;
  }
}

/**
 * Singleton instance for announcements
 */
let politeAnnouncer: ScreenReaderAnnouncer | null = null;
let assertiveAnnouncer: ScreenReaderAnnouncer | null = null;

/**
 * Get or create polite announcer
 */
function getPoliteAnnouncer(): ScreenReaderAnnouncer {
  if (!politeAnnouncer) {
    politeAnnouncer = new ScreenReaderAnnouncer('polite');
  }
  return politeAnnouncer;
}

/**
 * Get or create assertive announcer
 */
function getAssertiveAnnouncer(): ScreenReaderAnnouncer {
  if (!assertiveAnnouncer) {
    assertiveAnnouncer = new ScreenReaderAnnouncer('assertive');
  }
  return assertiveAnnouncer;
}

/**
 * Announce a message (polite)
 */
export function announce(message: string): void {
  getPoliteAnnouncer().announce(message);
}

/**
 * Announce a message assertively (interrupts)
 */
export function announceError(message: string): void {
  getAssertiveAnnouncer().announce(message);
}

/**
 * Common screen reader announcement templates
 */
export const ANNOUNCEMENTS = {
  // Form validation
  FIELD_REQUIRED: (fieldName: string) => `${fieldName} is required`,
  FIELD_INVALID: (fieldName: string, error: string) => `${fieldName} is invalid: ${error}`,
  FORM_SUBMITTED: 'Form submitted successfully',
  FORM_ERROR: 'Form submission failed. Please review errors',

  // Loading
  LOADING_START: (action: string) => `${action}, loading`,
  LOADING_COMPLETE: (action: string) => `${action} complete`,
  LOADING_FAILED: (action: string) => `${action} failed`,

  // Navigation
  PAGE_CHANGED: (pageName: string) => `Navigated to ${pageName}`,
  ITEM_SELECTED: (itemName: string) => `${itemName} selected`,

  // Notifications
  SUCCESS: (message: string) => `Success: ${message}`,
  ERROR: (message: string) => `Error: ${message}`,
  WARNING: (message: string) => `Warning: ${message}`,
  INFO: (message: string) => `Information: ${message}`,

  // Interactions
  BUTTON_ACTIVATED: (buttonName: string) => `${buttonName} activated`,
  MENU_OPENED: 'Menu opened',
  MENU_CLOSED: 'Menu closed',
  DIALOG_OPENED: (dialogName: string) => `${dialogName} dialog opened`,
  DIALOG_CLOSED: (dialogName: string) => `${dialogName} dialog closed`,

  // Data updates
  DATA_LOADED: (count: number) => `${count} item${count !== 1 ? 's' : ''} loaded`,
  DATA_UPDATED: 'Data updated',
  DATA_DELETED: (itemName: string) => `${itemName} deleted`,

  // Search
  SEARCH_RESULTS: (count: number) => `${count} result${count !== 1 ? 's' : ''} found`,
  NO_RESULTS: 'No results found',

  // Accessibility
  HIGH_CONTRAST_ENABLED: 'High contrast mode enabled',
  HIGH_CONTRAST_DISABLED: 'High contrast mode disabled',
  FONT_SIZE_INCREASED: 'Font size increased',
  FONT_SIZE_DECREASED: 'Font size decreased',
} as const;

/**
 * Add screen reader only text to element
 * @param element - Target element
 * @param text - Text to add
 * @returns Created span element
 */
export function addScreenReaderText(element: HTMLElement, text: string): HTMLSpanElement {
  const span = document.createElement('span');
  span.className = SCREEN_READER_ONLY_CLASS;
  span.textContent = text;
  element.appendChild(span);
  return span;
}

/**
 * Create a visually hidden button for keyboard navigation
 */
export function createAccessibleButton(
  text: string,
  onClick: () => void,
  className = SCREEN_READER_ONLY_CLASS
): HTMLButtonElement {
  const button = document.createElement('button');
  button.textContent = text;
  button.className = className;
  button.addEventListener('click', onClick);
  return button;
}

/**
 * Hook for announcing to screen readers in React
 */
export function useScreenReaderAnnouncement() {
  return {
    announce,
    announceError,
    announceLoading: (action: string) => announce(ANNOUNCEMENTS.LOADING_START(action)),
    announceSuccess: (message: string) => announce(ANNOUNCEMENTS.SUCCESS(message)),
    announceWarning: (message: string) => announce(ANNOUNCEMENTS.WARNING(message)),
    announceInfo: (message: string) => announce(ANNOUNCEMENTS.INFO(message)),
  };
}

/**
 * Hook for managing live region cleanup
 */
export function useScreenReaderLiveRegion() {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (ref.current) {
      ref.current.setAttribute('role', 'status');
      ref.current.setAttribute('aria-live', 'polite');
      ref.current.setAttribute('aria-atomic', 'true');
    }
  }, []);

  return ref;
}

/**
 * Utility to create accessible descriptions for complex elements
 */
export function createAccessibleDescription(
  describedElementId: string,
  descriptionText: string,
  descriptionId = `${describedElementId}-description`
): HTMLElement {
  const description = document.createElement('div');
  description.id = descriptionId;
  description.className = SCREEN_READER_ONLY_CLASS;
  description.textContent = descriptionText;

  const describedElement = document.getElementById(describedElementId);
  if (describedElement) {
    describedElement.setAttribute('aria-describedby', descriptionId);
    describedElement.parentNode?.insertBefore(description, describedElement.nextSibling);
  }

  return description;
}

/**
 * Check if screen reader is likely active
 */
export function isScreenReaderActive(): boolean {
  // Check for common screen reader DOM markers
  const indicators = [
    document.querySelector('[role="complementary"]'),
    document.querySelector('[aria-live]'),
    document.querySelector('[aria-hidden="false"]'),
  ];

  return indicators.some((indicator) => indicator !== null);
}

/**
 * Utility to announce page title changes for SPAs
 */
export function announcePageChange(pageTitle: string): void {
  announce(`Page changed to ${pageTitle}`);

  // Also update document title
  document.title = pageTitle;
}

/**
 * Create skip link announcement
 */
export function announceSkipLinkActivation(targetName: string): void {
  announce(`Jumping to ${targetName}`);
}

// Default import for hooks
import React from 'react';

/**
 * Accessibility best practices for screen reader announcements:
 * 1. Use aria-live for dynamic updates
 * 2. Keep announcements concise and clear
 * 3. Use aria-label for icon-only buttons
 * 4. Provide context for form errors
 * 5. Announce loading states and completion
 */
