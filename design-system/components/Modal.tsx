import React from 'react';
import { cn } from '../utils/cn';

/**
 * Modal type variants
 */
type ModalType = 'dialog' | 'drawer' | 'modal';

/**
 * Modal size types
 */
type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

/**
 * Modal component props interface
 */
interface ModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Close modal callback */
  onClose: () => void;
  /** Modal type variant */
  type?: ModalType;
  /** Modal size */
  size?: ModalSize;
  /** Modal title */
  title?: string;
  /** Modal content */
  children: React.ReactNode;
  /** Whether to show close button */
  isCloseable?: boolean;
  /** Whether clicking overlay closes modal */
  closeOnOverlayClick?: boolean;
  /** Modal content className */
  contentClassName?: string;
}

/**
 * Modal Component
 *
 * A flexible modal/dialog component with dialog, drawer, and modal variants.
 * Supports animations and proper focus management.
 *
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 * <Modal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Confirm Action"
 *   type="dialog"
 * >
 *   <p>Are you sure you want to proceed?</p>
 * </Modal>
 * ```
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  type = 'modal',
  size = 'md',
  title,
  children,
  isCloseable = true,
  closeOnOverlayClick = true,
  contentClassName,
}) => {
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      contentRef.current?.focus();
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && isCloseable) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const sizeStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full mx-4',
  };

  const typeStyles = {
    dialog: 'fixed inset-0 flex items-center justify-center',
    drawer: 'fixed inset-y-0 right-0 max-w-md w-full',
    modal: 'fixed inset-0 flex items-center justify-center',
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-200 animate-fadeIn"
        onClick={closeOnOverlayClick ? onClose : undefined}
        aria-hidden="true"
        role="presentation"
      />

      {/* Modal Content */}
      <div
        className={cn(typeStyles[type], 'z-50 pointer-events-none')}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        onKeyDown={handleKeyDown}
      >
        <div
          ref={contentRef}
          className={cn(
            'bg-white rounded-lg shadow-2xl pointer-events-auto',
            sizeStyles[size],
            type === 'drawer' ? 'h-full rounded-l-lg' : '',
            'animate-slideIn',
            contentClassName
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
              <h2 id="modal-title" className="text-lg font-semibold text-neutral-900">
                {title}
              </h2>
              {isCloseable && (
                <button
                  onClick={onClose}
                  className="inline-flex items-center justify-center w-8 h-8 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors"
                  aria-label="Close modal"
                  type="button"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className="px-6 py-4">{children}</div>
        </div>
      </div>
    </>
  );
};

Modal.displayName = 'Modal';

/**
 * ModalFooter Component
 *
 * Footer section for modal with action buttons.
 */
interface ModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const ModalFooter = React.forwardRef<HTMLDivElement, ModalFooterProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);

ModalFooter.displayName = 'ModalFooter';
