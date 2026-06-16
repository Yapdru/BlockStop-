'use client';

import React, { ReactNode } from 'react';

interface ResponsiveGridProps {
  children: ReactNode;
  columns?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
  };
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const columnClasses: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  12: 'grid-cols-12',
};

const gapClasses: Record<string, string> = {
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
};

const responsiveColClasses: Record<string, Record<number, string>> = {
  sm: { 1: 'sm:grid-cols-1', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-4', 12: 'sm:grid-cols-12' },
  md: { 1: 'md:grid-cols-1', 2: 'md:grid-cols-2', 3: 'md:grid-cols-3', 4: 'md:grid-cols-4', 12: 'md:grid-cols-12' },
  lg: { 1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4', 12: 'lg:grid-cols-12' },
  xl: { 1: 'xl:grid-cols-1', 2: 'xl:grid-cols-2', 3: 'xl:grid-cols-3', 4: 'xl:grid-cols-4', 12: 'xl:grid-cols-12' },
  '2xl': { 1: '2xl:grid-cols-1', 2: '2xl:grid-cols-2', 3: '2xl:grid-cols-3', 4: '2xl:grid-cols-4', 12: '2xl:grid-cols-12' },
};

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  columns = { default: 1, sm: 1, md: 2, lg: 3, xl: 4 },
  gap = 'md',
  className = '',
}) => {
  const defaultCols = columns.default || 1;
  const classes = [
    'grid',
    columnClasses[defaultCols] || 'grid-cols-1',
    gapClasses[gap],
  ];

  if (columns.sm) classes.push(responsiveColClasses.sm[columns.sm] || '');
  if (columns.md) classes.push(responsiveColClasses.md[columns.md] || '');
  if (columns.lg) classes.push(responsiveColClasses.lg[columns.lg] || '');
  if (columns.xl) classes.push(responsiveColClasses.xl[columns.xl] || '');
  if (columns['2xl']) classes.push(responsiveColClasses['2xl'][columns['2xl']] || '');

  return (
    <div className={`${classes.join(' ')} ${className}`}>
      {children}
    </div>
  );
};

interface GridItemProps {
  children: ReactNode;
  span?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  className?: string;
}

const spanClasses: Record<number, string> = {
  1: 'col-span-1',
  2: 'col-span-2',
  3: 'col-span-3',
  4: 'col-span-4',
  6: 'col-span-6',
  12: 'col-span-12',
};

const responsiveSpanClasses: Record<string, Record<number, string>> = {
  sm: { 1: 'sm:col-span-1', 2: 'sm:col-span-2', 3: 'sm:col-span-3', 4: 'sm:col-span-4', 6: 'sm:col-span-6', 12: 'sm:col-span-12' },
  md: { 1: 'md:col-span-1', 2: 'md:col-span-2', 3: 'md:col-span-3', 4: 'md:col-span-4', 6: 'md:col-span-6', 12: 'md:col-span-12' },
  lg: { 1: 'lg:col-span-1', 2: 'lg:col-span-2', 3: 'lg:col-span-3', 4: 'lg:col-span-4', 6: 'lg:col-span-6', 12: 'lg:col-span-12' },
  xl: { 1: 'xl:col-span-1', 2: 'xl:col-span-2', 3: 'xl:col-span-3', 4: 'xl:col-span-4', 6: 'xl:col-span-6', 12: 'xl:col-span-12' },
};

export const GridItem: React.FC<GridItemProps> = ({
  children,
  span = { default: 1 },
  className = '',
}) => {
  const defaultSpan = span.default || 1;
  const classes = [spanClasses[defaultSpan] || 'col-span-1'];

  if (span.sm) classes.push(responsiveSpanClasses.sm[span.sm] || '');
  if (span.md) classes.push(responsiveSpanClasses.md[span.md] || '');
  if (span.lg) classes.push(responsiveSpanClasses.lg[span.lg] || '');
  if (span.xl) classes.push(responsiveSpanClasses.xl[span.xl] || '');

  return (
    <div className={`${classes.join(' ')} ${className}`}>
      {children}
    </div>
  );
};
