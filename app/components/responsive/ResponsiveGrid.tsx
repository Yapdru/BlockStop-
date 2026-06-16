"use client";

import React, { ReactNode, useMemo } from "react";
import { GRID_CONFIG, type Breakpoint } from "@/app/utils/responsive/breakpoints";

/**
 * Column span configuration per breakpoint
 */
export interface GridColConfig {
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  xxl?: number;
}

/**
 * Props for the ResponsiveGrid component
 */
export interface ResponsiveGridProps {
  children: ReactNode;
  columns?: GridColConfig;
  gap?: "xs" | "sm" | "md" | "lg" | "xl";
  margin?: "xs" | "sm" | "md" | "lg" | "xl";
  containerMaxWidth?: string;
  className?: string;
}

/**
 * Props for the GridItem component
 */
export interface GridItemProps {
  children: ReactNode;
  colSpan?: GridColConfig;
  rowSpan?: GridColConfig;
  className?: string;
}

/**
 * 12-column responsive grid system
 *
 * Provides a flexible, mobile-first grid layout system that adapts to different breakpoints.
 * Uses CSS Grid with automatic responsive column configuration.
 *
 * @example
 * <ResponsiveGrid columns={{ xs: 1, sm: 2, md: 3, lg: 4 }} gap="lg">
 *   <GridItem>Item 1</GridItem>
 *   <GridItem>Item 2</GridItem>
 *   <GridItem>Item 3</GridItem>
 *   <GridItem>Item 4</GridItem>
 * </ResponsiveGrid>
 *
 * @example
 * // Using auto-fit for automatic column count
 * <ResponsiveGrid>
 *   {items.map((item) => (
 *     <GridItem key={item.id}>{item.content}</GridItem>
 *   ))}
 * </ResponsiveGrid>
 */
export const ResponsiveGrid = React.forwardRef<
  HTMLDivElement,
  ResponsiveGridProps
>(
  (
    {
      children,
      columns = { xs: 1, sm: 2, md: 3, lg: 4 },
      gap = "md",
      margin = "md",
      containerMaxWidth = "1280px",
      className = "",
    },
    ref
  ) => {
    const gridStyles = useMemo(() => {
      const gapValue = GRID_CONFIG.gutter[gap as keyof typeof GRID_CONFIG.gutter];
      const marginValue = GRID_CONFIG.margin[margin as keyof typeof GRID_CONFIG.margin];

      return {
        "--grid-gap": gapValue,
        "--grid-margin": marginValue,
      } as React.CSSProperties;
    }, [gap, margin]);

    const gridTemplate = useMemo(() => {
      const templates: Record<string, string> = {
        xs: `repeat(${columns.xs || 1}, 1fr)`,
        sm: `repeat(${columns.sm || columns.xs || 2}, 1fr)`,
        md: `repeat(${columns.md || columns.sm || 3}, 1fr)`,
        lg: `repeat(${columns.lg || columns.md || 4}, 1fr)`,
        xl: `repeat(${columns.xl || columns.lg || 4}, 1fr)`,
        xxl: `repeat(${columns.xxl || columns.xl || 4}, 1fr)`,
      };

      return templates;
    }, [columns]);

    return (
      <div
        ref={ref}
        className={`responsive-grid ${className}`}
        style={gridStyles}
      >
        <style>{`
          .responsive-grid {
            display: grid;
            grid-template-columns: ${gridTemplate.xs};
            gap: var(--grid-gap);
            margin-left: var(--grid-margin);
            margin-right: var(--grid-margin);
            max-width: ${containerMaxWidth};
            margin-left: auto;
            margin-right: auto;
          }

          @media (min-width: 640px) {
            .responsive-grid {
              grid-template-columns: ${gridTemplate.sm};
            }
          }

          @media (min-width: 1024px) {
            .responsive-grid {
              grid-template-columns: ${gridTemplate.md};
            }
          }

          @media (min-width: 1280px) {
            .responsive-grid {
              grid-template-columns: ${gridTemplate.lg};
            }
          }

          @media (min-width: 1536px) {
            .responsive-grid {
              grid-template-columns: ${gridTemplate.xl};
            }
          }

          @media (min-width: 2560px) {
            .responsive-grid {
              grid-template-columns: ${gridTemplate.xxl};
            }
          }
        `}</style>

        {children}
      </div>
    );
  }
);

ResponsiveGrid.displayName = "ResponsiveGrid";

/**
 * Grid item component for use within ResponsiveGrid
 * Allows per-item responsive column spanning
 *
 * @example
 * <GridItem colSpan={{ xs: 1, sm: 1, md: 2, lg: 2 }}>
 *   Wide item on larger screens
 * </GridItem>
 */
export const GridItem = React.forwardRef<HTMLDivElement, GridItemProps>(
  ({ children, colSpan, rowSpan, className = "" }, ref) => {
    const itemStyles = useMemo(() => {
      const styles: Record<string, string> = {
        xs: `${colSpan?.xs || 1}`,
        sm: `${colSpan?.sm || colSpan?.xs || 1}`,
        md: `${colSpan?.md || colSpan?.sm || 1}`,
        lg: `${colSpan?.lg || colSpan?.md || 1}`,
        xl: `${colSpan?.xl || colSpan?.lg || 1}`,
        xxl: `${colSpan?.xxl || colSpan?.xl || 1}`,
      };

      return styles;
    }, [colSpan]);

    return (
      <div
        ref={ref}
        className={`grid-item ${className}`}
        style={
          {
            "--col-span-xs": itemStyles.xs,
            "--col-span-sm": itemStyles.sm,
            "--col-span-md": itemStyles.md,
            "--col-span-lg": itemStyles.lg,
            "--col-span-xl": itemStyles.xl,
            "--col-span-xxl": itemStyles.xxl,
            "--row-span-xs": `${rowSpan?.xs || 1}`,
            "--row-span-sm": `${rowSpan?.sm || rowSpan?.xs || 1}`,
            "--row-span-md": `${rowSpan?.md || rowSpan?.sm || 1}`,
            "--row-span-lg": `${rowSpan?.lg || rowSpan?.md || 1}`,
            "--row-span-xl": `${rowSpan?.xl || rowSpan?.lg || 1}`,
            "--row-span-xxl": `${rowSpan?.xxl || rowSpan?.xl || 1}`,
          } as React.CSSProperties
        }
      >
        <style>{`
          .grid-item {
            grid-column: span var(--col-span-xs);
            grid-row: span var(--row-span-xs);
          }

          @media (min-width: 640px) {
            .grid-item {
              grid-column: span var(--col-span-sm);
              grid-row: span var(--row-span-sm);
            }
          }

          @media (min-width: 1024px) {
            .grid-item {
              grid-column: span var(--col-span-md);
              grid-row: span var(--row-span-md);
            }
          }

          @media (min-width: 1280px) {
            .grid-item {
              grid-column: span var(--col-span-lg);
              grid-row: span var(--row-span-lg);
            }
          }

          @media (min-width: 1536px) {
            .grid-item {
              grid-column: span var(--col-span-xl);
              grid-row: span var(--row-span-xl);
            }
          }

          @media (min-width: 2560px) {
            .grid-item {
              grid-column: span var(--col-span-xxl);
              grid-row: span var(--row-span-xxl);
            }
          }
        `}</style>

        {children}
      </div>
    );
  }
);

GridItem.displayName = "GridItem";

export default ResponsiveGrid;
