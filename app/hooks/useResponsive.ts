"use client";

import { useState, useEffect } from "react";
import { BREAKPOINTS, type Breakpoint } from "@/app/utils/responsive/breakpoints";

interface ResponsiveState {
  breakpoint: Breakpoint | null;
  isXs: boolean;
  isSm: boolean;
  isMd: boolean;
  isLg: boolean;
  isXl: boolean;
  isXxl: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  width: number;
  height: number;
  isTouchDevice: boolean;
  isPortrait: boolean;
  isLandscape: boolean;
}

/**
 * Hook to detect current breakpoint and responsive state
 * Provides convenience properties for conditional rendering based on screen size
 *
 * @example
 * const { isMobile, isDesktop, breakpoint } = useResponsive();
 *
 * if (isMobile) {
 *   return <MobileLayout />;
 * }
 *
 * return <DesktopLayout />;
 */
export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>({
    breakpoint: null,
    isXs: false,
    isSm: false,
    isMd: false,
    isLg: false,
    isXl: false,
    isXxl: false,
    isMobile: true,
    isTablet: false,
    isDesktop: false,
    isLargeDesktop: false,
    width: 0,
    height: 0,
    isTouchDevice: false,
    isPortrait: true,
    isLandscape: false,
  });

  useEffect(() => {
    // Check if touch device on mount
    const isTouchDevice =
      typeof window !== "undefined" &&
      (navigator.maxTouchPoints > 0 ||
        // @ts-ignore - vendor prefix check
        navigator.msMaxTouchPoints > 0 ||
        (window.matchMedia && window.matchMedia("(hover: none)").matches));

    const updateResponsiveState = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Determine breakpoint
      let breakpoint: Breakpoint | null = "xs";
      if (width >= BREAKPOINTS.xxl) breakpoint = "xxl";
      else if (width >= BREAKPOINTS.xl) breakpoint = "xl";
      else if (width >= BREAKPOINTS.lg) breakpoint = "lg";
      else if (width >= BREAKPOINTS.md) breakpoint = "md";
      else if (width >= BREAKPOINTS.sm) breakpoint = "sm";
      else breakpoint = "xs";

      // Calculate boolean flags for each breakpoint
      const isXs = width >= BREAKPOINTS.xs;
      const isSm = width >= BREAKPOINTS.sm;
      const isMd = width >= BREAKPOINTS.md;
      const isLg = width >= BREAKPOINTS.lg;
      const isXl = width >= BREAKPOINTS.xl;
      const isXxl = width >= BREAKPOINTS.xxl;

      // Semantic breakpoints
      const isMobile = width < BREAKPOINTS.sm;
      const isTablet =
        width >= BREAKPOINTS.sm && width < BREAKPOINTS.md;
      const isDesktop = width >= BREAKPOINTS.md;
      const isLargeDesktop = width >= BREAKPOINTS.lg;

      // Orientation
      const isPortrait = height >= width;
      const isLandscape = width > height;

      setState({
        breakpoint,
        isXs,
        isSm,
        isMd,
        isLg,
        isXl,
        isXxl,
        isMobile,
        isTablet,
        isDesktop,
        isLargeDesktop,
        width,
        height,
        isTouchDevice,
        isPortrait,
        isLandscape,
      });
    };

    // Initial call
    updateResponsiveState();

    // Add event listener
    const handleResize = () => {
      updateResponsiveState();
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return state;
}

export default useResponsive;
