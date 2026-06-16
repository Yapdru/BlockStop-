import React from 'react';
import { cn } from '../utils/cn';

/**
 * Tooltip position types
 */
type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

/**
 * Tooltip component props interface
 */
interface TooltipProps {
  /** Tooltip content */
  content: React.ReactNode;
  /** Tooltip position relative to trigger */
  position?: TooltipPosition;
  /** Whether tooltip is open */
  isOpen?: boolean;
  /** Open/close callback */
  onOpenChange?: (open: boolean) => void;
  /** Delay before showing tooltip (ms) */
  delayMs?: number;
  /** Trigger element */
  children: React.ReactNode;
  /** Custom className for tooltip content */
  contentClassName?: string;
}

/**
 * Tooltip Component
 *
 * A positioned tooltip component that displays helpful information on hover.
 * Supports multiple positions and delay configuration.
 *
 * @example
 * ```tsx
 * <Tooltip content="Click to save your changes" position="top">
 *   <button>Save</button>
 * </Tooltip>
 * ```
 */
export const Tooltip: React.FC<TooltipProps> = ({
  content,
  position = 'top',
  isOpen: controlledIsOpen,
  onOpenChange,
  delayMs = 200,
  children,
  contentClassName,
}) => {
  const [uncontrolledIsOpen, setUncontrolledIsOpen] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout>();
  const triggerRef = React.useRef<HTMLDivElement>(null);

  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : uncontrolledIsOpen;

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setUncontrolledIsOpen(true);
      setIsVisible(true);
      onOpenChange?.(true);
    }, delayMs);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setUncontrolledIsOpen(false);
    setIsVisible(false);
    onOpenChange?.(false);
  };

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const positionStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowStyles = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-neutral-900 border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-neutral-900 border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-neutral-900 border-t-transparent border-b-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-neutral-900 border-t-transparent border-b-transparent border-l-transparent',
  };

  return (
    <div
      ref={triggerRef}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger */}
      {children}

      {/* Tooltip content */}
      {isOpen && isVisible && (
        <div
          className={cn(
            'absolute z-50 px-3 py-2 text-sm font-medium text-white bg-neutral-900 rounded-md whitespace-nowrap pointer-events-none animate-fadeIn',
            positionStyles[position],
            contentClassName
          )}
          role="tooltip"
          aria-hidden="true"
        >
          {content}

          {/* Arrow */}
          <div
            className={cn(
              'absolute w-0 h-0 border-4',
              arrowStyles[position]
            )}
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
};

Tooltip.displayName = 'Tooltip';
