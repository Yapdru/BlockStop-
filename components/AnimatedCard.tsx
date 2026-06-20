import React from 'react';

interface AnimatedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  delay?: number;
  children: React.ReactNode;
}

export function AnimatedCard({ delay = 0, children, className = '', ...props }: AnimatedCardProps) {
  return (
    <div
      className={`bg-neutral-0 rounded-lg border border-neutral-200 shadow-sm hover:shadow-lg transition-shadow p-6 animate-slideUp ${className}`}
      style={{
        animationDelay: `${delay * 50}ms`,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
