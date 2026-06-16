/**
 * Focus Trap Component
 * WCAG 2.1 Level AAA - Focus Management (2.4.3)
 * Traps focus within modal or dialog components
 */

'use client';

import React from 'react';
import { FocusTrap as FocusTrapUtil, focusFirstElement } from '@/app/utils/a11y/focus-management';

export interface FocusTrapProps {
  /**
   * Child components to apply focus trap to
   */
  children: React.ReactNode;

  /**
   * Whether the focus trap is active
   */
  isActive?: boolean;

  /**
   * ID of element to focus on mount
   */
  initialFocusId?: string;

  /**
   * Callback when focus trap is activated
   */
  onActivate?: () => void;

  /**
   * Callback when focus trap is deactivated
   */
  onDeactivate?: () => void;

  /**
   * Whether to automatically focus first element
   */
  autoFocus?: boolean;

  /**
   * CSS class name
   */
  className?: string;

  /**
   * Role for accessibility (e.g., 'dialog', 'alertdialog')
   */
  role?: 'dialog' | 'alertdialog' | 'none';

  /**
   * ARIA label for the focus trap container
   */
  ariaLabel?: string;

  /**
   * ARIA labelledby for the focus trap container
   */
  ariaLabelledBy?: string;

  /**
   * ARIA describedby for the focus trap container
   */
  ariaDescribedBy?: string;
}

/**
 * Focus Trap Component
 *
 * Implements a focus trap to keep keyboard focus within a modal or dialog.
 * This is essential for accessibility when showing overlay content.
 *
 * WCAG 2.1 Level AAA compliance:
 * - Traps Tab/Shift+Tab navigation within component
 * - Focuses first focusable element on open
 * - Restores focus on close
 * - Properly announces to screen readers
 *
 * Usage:
 * <FocusTrap isActive={isModalOpen} role="dialog" ariaLabel="Confirmation dialog">
 *   <div className="modal">
 *     <h2>Are you sure?</h2>
 *     <button>Cancel</button>
 *     <button>Confirm</button>
 *   </div>
 * </FocusTrap>
 */
export const FocusTrap: React.FC<FocusTrapProps> = ({
  children,
  isActive = true,
  initialFocusId,
  onActivate,
  onDeactivate,
  autoFocus = true,
  className = '',
  role = 'none',
  ariaLabel,
  ariaLabelledBy,
  ariaDescribedBy,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const focusTrapRef = React.useRef<FocusTrapUtil | null>(null);
  const previousFocusRef = React.useRef<HTMLElement | null>(null);

  // Initialize focus trap
  React.useEffect(() => {
    if (!containerRef.current) return;

    if (isActive) {
      // Save current focus
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Create and activate focus trap
      focusTrapRef.current = new FocusTrapUtil(containerRef.current);

      // Handle initial focus
      if (initialFocusId) {
        const initialElement = document.getElementById(initialFocusId);
        if (initialElement) {
          setTimeout(() => {
            initialElement.focus();
          }, 0);
        }
      } else if (autoFocus) {
        focusFirstElement(containerRef.current);
      }

      focusTrapRef.current.activate();
      onActivate?.();
    } else {
      // Deactivate focus trap
      if (focusTrapRef.current) {
        focusTrapRef.current.deactivate();
        focusTrapRef.current = null;
      }

      // Restore previous focus
      if (previousFocusRef.current && previousFocusRef.current.offsetParent !== null) {
        previousFocusRef.current.focus();
      }

      onDeactivate?.();
    }

    return () => {
      if (focusTrapRef.current) {
        focusTrapRef.current.destroy();
        focusTrapRef.current = null;
      }
    };
  }, [isActive, initialFocusId, autoFocus, onActivate, onDeactivate]);

  // Handle DOM mutations (for dynamic content)
  React.useEffect(() => {
    if (!isActive || !focusTrapRef.current) return;

    const observer = new MutationObserver(() => {
      focusTrapRef.current?.updateFocusableElements();
    });

    if (containerRef.current) {
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['disabled', 'tabindex', 'aria-hidden'],
      });
    }

    return () => observer.disconnect();
  }, [isActive]);

  const ariaProps: Record<string, any> = {};
  if (role !== 'none') {
    ariaProps.role = role;
  }
  if (ariaLabel) {
    ariaProps['aria-label'] = ariaLabel;
  }
  if (ariaLabelledBy) {
    ariaProps['aria-labelledby'] = ariaLabelledBy;
  }
  if (ariaDescribedBy) {
    ariaProps['aria-describedby'] = ariaDescribedBy;
  }

  return (
    <div ref={containerRef} className={className} {...ariaProps}>
      {children}
    </div>
  );
};

/**
 * Hook for using focus trap in custom components
 */
export function useFocusTrap(
  enabled = true,
  initialFocusId?: string
): {
  ref: React.RefObject<HTMLDivElement>;
  isFocused: boolean;
} {
  const ref = React.useRef<HTMLDivElement>(null);
  const focusTrapRef = React.useRef<FocusTrapUtil | null>(null);
  const [isFocused, setIsFocused] = React.useState(false);

  React.useEffect(() => {
    if (!ref.current || !enabled) return;

    focusTrapRef.current = new FocusTrapUtil(ref.current);

    // Handle initial focus
    if (initialFocusId) {
      const initialElement = document.getElementById(initialFocusId);
      if (initialElement) {
        setTimeout(() => {
          initialElement.focus();
          setIsFocused(true);
        }, 0);
      }
    } else {
      focusFirstElement(ref.current);
      setIsFocused(true);
    }

    focusTrapRef.current.activate();

    return () => {
      focusTrapRef.current?.destroy();
      focusTrapRef.current = null;
      setIsFocused(false);
    };
  }, [enabled, initialFocusId]);

  return { ref, isFocused };
}

/**
 * Modal component with built-in focus trap
 */
export interface ModalProps extends Omit<FocusTrapProps, 'children' | 'role'> {
  /**
   * Whether the modal is open
   */
  isOpen: boolean;

  /**
   * Modal title
   */
  title?: string;

  /**
   * Modal title ID for aria-labelledby
   */
  titleId?: string;

  /**
   * Modal body content
   */
  children: React.ReactNode;

  /**
   * Close button click handler
   */
  onClose?: () => void;

  /**
   * Whether to show close button
   */
  showCloseButton?: boolean;

  /**
   * CSS class for modal overlay
   */
  overlayClassName?: string;

  /**
   * CSS class for modal content
   */
  contentClassName?: string;
}

/**
 * Accessible Modal Component with Focus Trap
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  title,
  titleId = 'modal-title',
  children,
  onClose,
  showCloseButton = true,
  overlayClassName = '',
  contentClassName = '',
  ...focusTrapProps
}) => {
  if (!isOpen) {
    return null;
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  };

  const handleEscapeKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose?.();
    }
  };

  return (
    <div
      className={`modal-overlay ${overlayClassName}`.trim()}
      onClick={handleOverlayClick}
      role="presentation"
      aria-hidden={!isOpen}
    >
      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          padding: 24px;
          max-width: 90vw;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
        }

        .modal-title {
          margin: 0 0 16px 0;
          font-size: 20px;
          font-weight: 600;
        }

        .modal-close-button {
          position: absolute;
          top: 16px;
          right: 16px;
          background: none;
          border: none;
          font-size: 28px;
          line-height: 1;
          cursor: pointer;
          padding: 8px;
          color: #666;
          transition: color 0.2s;
        }

        .modal-close-button:hover {
          color: #000;
        }

        .modal-close-button:focus {
          outline: 2px solid #0066cc;
          outline-offset: 2px;
          border-radius: 4px;
        }

        @media (prefers-reduced-motion: reduce) {
          .modal-overlay,
          .modal-content {
            transition: none;
          }
        }
      `}</style>

      <FocusTrap
        isActive={isOpen}
        role="dialog"
        ariaLabel={title}
        ariaLabelledBy={title ? titleId : undefined}
        {...focusTrapProps}
      >
        <div className={`modal-content ${contentClassName}`.trim()} onKeyDown={handleEscapeKey}>
          {title && <h2 id={titleId} className="modal-title">{title}</h2>}

          {showCloseButton && (
            <button
              className="modal-close-button"
              onClick={onClose}
              aria-label="Close modal"
              title="Close (Esc)"
            >
              ×
            </button>
          )}

          {children}
        </div>
      </FocusTrap>
    </div>
  );
};

export default FocusTrap;

/**
 * Accessibility best practices for focus traps:
 * 1. Always trap focus in modals and dialogs
 * 2. Focus first element on open
 * 3. Restore previous focus on close
 * 4. Allow Escape key to close
 * 5. Announce dialog role to screen readers
 */
