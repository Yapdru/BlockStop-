import React from 'react';
import { cn } from '../utils/cn';

/**
 * Card variant types
 */
type CardVariant = 'elevated' | 'flat' | 'outline';

/**
 * Card component props interface
 */
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Visual style variant */
  variant?: CardVariant;
  /** Card padding */
  padding?: 'sm' | 'md' | 'lg';
  /** Whether to show hover effect */
  isHoverable?: boolean;
}

/**
 * CardHeader component props interface
 */
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Header padding override */
  padding?: 'sm' | 'md' | 'lg';
}

/**
 * CardBody component props interface
 */
interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Body padding override */
  padding?: 'sm' | 'md' | 'lg';
}

/**
 * CardFooter component props interface
 */
interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Footer padding override */
  padding?: 'sm' | 'md' | 'lg';
}

/**
 * Card Component
 *
 * A container component with elevated, flat, or outline variants.
 * Can be composed with CardHeader, CardBody, and CardFooter.
 *
 * @example
 * ```tsx
 * <Card variant="elevated" padding="lg">
 *   <CardHeader>
 *     <h2>Card Title</h2>
 *   </CardHeader>
 *   <CardBody>
 *     <p>Card content goes here</p>
 *   </CardBody>
 *   <CardFooter>
 *     <Button>Action</Button>
 *   </CardFooter>
 * </Card>
 * ```
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = 'elevated',
      padding = 'md',
      isHoverable = false,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'rounded-lg bg-white transition-all duration-200';

    const variantStyles = {
      elevated: 'shadow-md hover:shadow-lg',
      flat: 'bg-neutral-50 border border-neutral-200',
      outline: 'border border-neutral-300',
    };

    const paddingStyles = {
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    };

    return (
      <div
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          paddingStyles[padding],
          isHoverable && 'cursor-pointer hover:shadow-lg',
          className
        )}
        role="article"
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

/**
 * CardHeader Component
 *
 * A header section for a Card component.
 */
export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  (
    {
      className,
      padding = 'md',
      children,
      ...props
    },
    ref
  ) => {
    const paddingStyles = {
      sm: 'pb-2',
      md: 'pb-3',
      lg: 'pb-4',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'border-b border-neutral-200',
          paddingStyles[padding],
          className
        )}
        role="heading"
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

/**
 * CardBody Component
 *
 * The main content section of a Card component.
 */
export const CardBody = React.forwardRef<HTMLDivElement, CardBodyProps>(
  (
    {
      className,
      padding = 'md',
      children,
      ...props
    },
    ref
  ) => {
    const paddingStyles = {
      sm: 'py-2',
      md: 'py-3',
      lg: 'py-4',
    };

    return (
      <div
        ref={ref}
        className={cn(paddingStyles[padding], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardBody.displayName = 'CardBody';

/**
 * CardFooter Component
 *
 * A footer section for a Card component.
 */
export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  (
    {
      className,
      padding = 'md',
      children,
      ...props
    },
    ref
  ) => {
    const paddingStyles = {
      sm: 'pt-2',
      md: 'pt-3',
      lg: 'pt-4',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'border-t border-neutral-200',
          paddingStyles[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = 'CardFooter';
