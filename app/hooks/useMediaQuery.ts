"use client";

import { useState, useEffect, useCallback } from "react";
import { MEDIA_QUERIES } from "@/app/utils/responsive/breakpoints";

/**
 * Hook for custom media queries
 * Returns boolean indicating if media query matches
 *
 * @param query - CSS media query string or predefined media query key
 * @returns Boolean indicating if media query matches
 *
 * @example
 * const isMobile = useMediaQuery("(max-width: 640px)");
 * const isDarkMode = useMediaQuery("dark"); // Uses predefined dark mode query
 *
 * @example
 * const isLandscape = useMediaQuery("landscape"); // Uses predefined landscape query
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false);

  // Resolve predefined queries
  const resolveQuery = useCallback((q: string): string => {
    const mediaQuery = MEDIA_QUERIES[q as keyof typeof MEDIA_QUERIES];
    return mediaQuery || q;
  }, []);

  useEffect(() => {
    const resolvedQuery = resolveQuery(query);
    const mediaQueryList = window.matchMedia(resolvedQuery);

    // Set initial state
    setMatches(mediaQueryList.matches);

    // Create event listener
    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    // Add listener (handle both old and new API)
    if (mediaQueryList.addListener) {
      mediaQueryList.addListener(handleChange);
    } else {
      mediaQueryList.addEventListener("change", handleChange);
    }

    // Cleanup
    return () => {
      if (mediaQueryList.removeListener) {
        mediaQueryList.removeListener(handleChange);
      } else {
        mediaQueryList.removeEventListener("change", handleChange);
      }
    };
  }, [query, resolveQuery]);

  return matches;
}

/**
 * Convenience hooks for common media queries
 */

export function useIsMobile(): boolean {
  return useMediaQuery("mobile");
}

export function useIsTablet(): boolean {
  return useMediaQuery("tablet");
}

export function useIsDesktop(): boolean {
  return useMediaQuery("md");
}

export function useIsTouchDevice(): boolean {
  return useMediaQuery("touch");
}

export function useIsPortrait(): boolean {
  return useMediaQuery("portrait");
}

export function useIsLandscape(): boolean {
  return useMediaQuery("landscape");
}

export function useIsDarkMode(): boolean {
  return useMediaQuery("dark");
}

export function useIsHighContrast(): boolean {
  return useMediaQuery("highContrast");
}

export function usePreferReducedMotion(): boolean {
  return useMediaQuery("reduceMotion");
}

export function useIsPrintMode(): boolean {
  return useMediaQuery("print");
}

/**
 * Hook to get multiple media queries at once
 * Useful when you need to check multiple conditions
 *
 * @example
 * const queries = useMultipleMediaQueries(["md", "dark", "portrait"]);
 * // { md: true, dark: false, portrait: true }
 */
export function useMultipleMediaQueries(
  queryKeys: (keyof typeof MEDIA_QUERIES)[]
): Record<string, boolean> {
  const [matches, setMatches] = useState<Record<string, boolean>>(
    Object.fromEntries(queryKeys.map((key) => [key, false]))
  );

  useEffect(() => {
    const mediaQueryLists = Object.fromEntries(
      queryKeys.map((key) => [
        key,
        window.matchMedia(MEDIA_QUERIES[key]),
      ])
    );

    const updateMatches = () => {
      const newMatches = Object.fromEntries(
        Object.entries(mediaQueryLists).map(([key, mql]) => [
          key,
          mql.matches,
        ])
      );
      setMatches(newMatches);
    };

    // Set initial state
    updateMatches();

    // Create event listeners
    const handleChange = () => {
      updateMatches();
    };

    Object.values(mediaQueryLists).forEach((mql) => {
      if (mql.addListener) {
        mql.addListener(handleChange);
      } else {
        mql.addEventListener("change", handleChange);
      }
    });

    // Cleanup
    return () => {
      Object.values(mediaQueryLists).forEach((mql) => {
        if (mql.removeListener) {
          mql.removeListener(handleChange);
        } else {
          mql.removeEventListener("change", handleChange);
        }
      });
    };
  }, [queryKeys]);

  return matches;
}

export default useMediaQuery;
