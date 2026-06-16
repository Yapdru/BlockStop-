/**
 * ARIA Live Region Component
 * WCAG 2.1 Level AAA - Live Region Support (4.1.3)
 * Announces dynamic content changes to screen readers
 */

'use client';

import React from 'react';

export type Politeness = 'polite' | 'assertive' | 'off';

export interface AriaLiveRegionProps {
  /**
   * Content to announce
   */
  children?: React.ReactNode;

  /**
   * Politeness level for announcements
   * - 'polite': Wait for pause in speech
   * - 'assertive': Interrupt current speech
   * - 'off': Don't announce (default)
   */
  politeness?: Politeness;

  /**
   * Whether to announce entire region or just changes
   */
  atomic?: boolean;

  /**
   * Whether region is relevant (live property)
   */
  relevant?: 'additions' | 'removals' | 'text' | 'all';

  /**
   * ARIA label for the live region
   */
  ariaLabel?: string;

  /**
   * CSS class name
   */
  className?: string;

  /**
   * Whether to visually hide the region
   */
  hidden?: boolean;

  /**
   * Role for semantic meaning
   */
  role?: 'status' | 'log' | 'alert' | 'marquee' | 'timer';

  /**
   * Callback when content changes
   */
  onChange?: (content: string) => void;
}

/**
 * ARIA Live Region Component
 *
 * Announces dynamic content changes to screen readers without interrupting page navigation.
 * Essential for status updates, notifications, and form validation feedback.
 *
 * WCAG 2.1 Level AAA compliance:
 * - aria-live for dynamic content announcement
 * - aria-atomic for complete region announcement
 * - aria-relevant for specifying what to announce
 * - Proper roles for semantic meaning
 *
 * Usage:
 * <AriaLiveRegion politeness="polite">
 *   Loading data...
 * </AriaLiveRegion>
 *
 * <AriaLiveRegion politeness="assertive" role="alert">
 *   Error: Please check your input
 * </AriaLiveRegion>
 */
export const AriaLiveRegion: React.FC<AriaLiveRegionProps> = ({
  children,
  politeness = 'polite',
  atomic = true,
  relevant = 'all',
  ariaLabel,
  className = '',
  hidden = true,
  role = 'status',
  onChange,
}) => {
  const regionRef = React.useRef<HTMLDivElement>(null);
  const prevContentRef = React.useRef<string>('');

  // Announce content changes
  React.useEffect(() => {
    if (regionRef.current && politeness !== 'off') {
      const content = regionRef.current.textContent || '';
      if (content !== prevContentRef.current) {
        prevContentRef.current = content;
        onChange?.(content);
      }
    }
  }, [children, onChange, politeness]);

  const ariaProps: Record<string, any> = {
    'aria-live': politeness,
    'aria-atomic': atomic,
  };

  if (relevant !== 'all') {
    ariaProps['aria-relevant'] = relevant;
  }

  if (role !== 'status') {
    ariaProps.role = role;
  }

  if (ariaLabel) {
    ariaProps['aria-label'] = ariaLabel;
  }

  return (
    <div
      ref={regionRef}
      className={className}
      style={{
        ...(hidden && {
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: '0',
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          borderWidth: '0',
        }),
      }}
      {...ariaProps}
    >
      {children}
    </div>
  );
};

/**
 * Status Message Live Region
 * For status updates and confirmations
 */
export interface StatusLiveRegionProps {
  /**
   * Status message to announce
   */
  message?: string;

  /**
   * Duration to show message (ms)
   */
  duration?: number;

  /**
   * Type of status message
   */
  type?: 'info' | 'success' | 'warning' | 'error';

  /**
   * Callback when message expires
   */
  onExpire?: () => void;
}

export const StatusLiveRegion: React.FC<StatusLiveRegionProps> = ({
  message,
  duration = 5000,
  type = 'info',
  onExpire,
}) => {
  const [displayMessage, setDisplayMessage] = React.useState(message);

  React.useEffect(() => {
    if (!message) {
      setDisplayMessage('');
      return;
    }

    setDisplayMessage(message);

    if (duration > 0) {
      const timer = setTimeout(() => {
        setDisplayMessage('');
        onExpire?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [message, duration, onExpire]);

  return (
    <AriaLiveRegion
      politeness={type === 'error' ? 'assertive' : 'polite'}
      role={type === 'error' ? 'alert' : 'status'}
      hidden
    >
      {displayMessage && `${type.charAt(0).toUpperCase() + type.slice(1)}: ${displayMessage}`}
    </AriaLiveRegion>
  );
};

/**
 * Hook for managing live region announcements
 */
export function useAriaLiveRegion(initialMessage = '') {
  const [message, setMessage] = React.useState(initialMessage);
  const [politeness, setPoliteness] = React.useState<Politeness>('polite');

  const announce = React.useCallback((text: string, assertive = false) => {
    setPoliteness(assertive ? 'assertive' : 'polite');
    setMessage(text);
  }, []);

  const clear = React.useCallback(() => {
    setMessage('');
  }, []);

  return { message, politeness, announce, clear, setMessage, setPoliteness };
}

/**
 * List of live region announcements with auto-clear
 */
export interface AnnouncementQueueProps {
  /**
   * Announcements to queue
   */
  announcements: Array<{
    id: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    duration?: number;
  }>;

  /**
   * Callback when announcement is removed
   */
  onRemove?: (id: string) => void;
}

export const AnnouncementQueue: React.FC<AnnouncementQueueProps> = ({
  announcements,
  onRemove,
}) => {
  return (
    <>
      {announcements.map((announcement) => (
        <AriaLiveRegion
          key={announcement.id}
          politeness={announcement.type === 'error' ? 'assertive' : 'polite'}
          role={announcement.type === 'error' ? 'alert' : 'status'}
          hidden
        >
          {announcement.message}
        </AriaLiveRegion>
      ))}
    </>
  );
};

/**
 * Real-time list updates announcements
 */
export interface ListUpdateAnnounceProps {
  /**
   * Number of items added
   */
  itemsAdded?: number;

  /**
   * Number of items removed
   */
  itemsRemoved?: number;

  /**
   * Number of items updated
   */
  itemsUpdated?: number;
}

export const ListUpdateAnnounce: React.FC<ListUpdateAnnounceProps> = ({
  itemsAdded = 0,
  itemsRemoved = 0,
  itemsUpdated = 0,
}) => {
  const messages: string[] = [];

  if (itemsAdded > 0) {
    messages.push(`${itemsAdded} item${itemsAdded > 1 ? 's' : ''} added`);
  }
  if (itemsRemoved > 0) {
    messages.push(`${itemsRemoved} item${itemsRemoved > 1 ? 's' : ''} removed`);
  }
  if (itemsUpdated > 0) {
    messages.push(`${itemsUpdated} item${itemsUpdated > 1 ? 's' : ''} updated`);
  }

  const announcementText = messages.join(', ');

  return (
    <AriaLiveRegion politeness="polite" role="status" hidden>
      {announcementText}
    </AriaLiveRegion>
  );
};

/**
 * Progress announcement for long-running operations
 */
export interface ProgressAnnounceProps {
  /**
   * Current progress percentage (0-100)
   */
  progress?: number;

  /**
   * Whether operation is complete
   */
  isComplete?: boolean;

  /**
   * Label for the operation
   */
  label?: string;
}

export const ProgressAnnounce: React.FC<ProgressAnnounceProps> = ({
  progress = 0,
  isComplete = false,
  label = 'Operation',
}) => {
  const message = isComplete
    ? `${label} complete`
    : `${label} in progress: ${Math.round(progress)}%`;

  return (
    <AriaLiveRegion
      politeness="assertive"
      role="progressbar"
      ariaLabel={`${label} progress`}
      hidden
    >
      {message}
    </AriaLiveRegion>
  );
};

/**
 * Search results announcement
 */
export interface SearchResultsAnnounceProps {
  /**
   * Number of results found
   */
  resultCount: number;

  /**
   * Search query
   */
  query?: string;
}

export const SearchResultsAnnounce: React.FC<SearchResultsAnnounceProps> = ({
  resultCount,
  query,
}) => {
  const message =
    resultCount === 0
      ? query
        ? `No results found for "${query}"`
        : 'No results'
      : `${resultCount} result${resultCount > 1 ? 's' : ''} found${query ? ` for "${query}"` : ''}`;

  return (
    <AriaLiveRegion politeness="polite" role="status" hidden>
      {message}
    </AriaLiveRegion>
  );
};

/**
 * Form validation announcement
 */
export interface ValidationAnnounceProps {
  /**
   * Field name
   */
  fieldName: string;

  /**
   * Error message
   */
  error?: string;

  /**
   * Whether field is valid
   */
  isValid: boolean;
}

export const ValidationAnnounce: React.FC<ValidationAnnounceProps> = ({
  fieldName,
  error,
  isValid,
}) => {
  const message = isValid ? `${fieldName} is valid` : `${fieldName} error: ${error}`;

  return (
    <AriaLiveRegion
      politeness={isValid ? 'polite' : 'assertive'}
      role={isValid ? 'status' : 'alert'}
      hidden
    >
      {message}
    </AriaLiveRegion>
  );
};

export default AriaLiveRegion;

/**
 * Accessibility best practices for live regions:
 * 1. Use polite for non-urgent updates
 * 2. Use assertive for errors and important alerts
 * 3. Keep announcements concise and clear
 * 4. Use atomic=true to announce entire region
 * 5. Include context for better understanding
 */
