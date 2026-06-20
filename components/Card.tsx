import React from 'react';

type CardPadding = 'sm' | 'md' | 'lg';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: CardPadding;
  children: React.ReactNode;
}

export function Card({
  padding = 'md',
  className = '',
  children,
  ...props
}: CardProps) {
  const paddingStyles = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <div
      className={`bg-neutral-0 rounded-lg border border-neutral-200 shadow-sm hover:shadow-md transition-shadow ${paddingStyles[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
