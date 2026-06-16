/**
 * Color Contrast Validation Utilities
 * WCAG 2.1 Level AAA - Color Contrast (1.4.11)
 * Ensures minimum 7:1 color contrast ratio for AAA compliance
 */

/**
 * Color representation
 */
export interface Color {
  r: number;
  g: number;
  b: number;
  a?: number;
}

/**
 * Parse hex color to RGB
 * @param hex - Hex color string (#RRGGBB or #RGB)
 * @returns Color object with r, g, b values
 */
export function parseHexColor(hex: string): Color {
  const cleaned = hex.replace('#', '');

  let r: number, g: number, b: number;

  if (cleaned.length === 3) {
    // Expand shorthand #RGB to #RRGGBB
    r = parseInt(cleaned[0] + cleaned[0], 16);
    g = parseInt(cleaned[1] + cleaned[1], 16);
    b = parseInt(cleaned[2] + cleaned[2], 16);
  } else if (cleaned.length === 6) {
    r = parseInt(cleaned.substring(0, 2), 16);
    g = parseInt(cleaned.substring(2, 4), 16);
    b = parseInt(cleaned.substring(4, 6), 16);
  } else {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  return { r, g, b };
}

/**
 * Parse RGB color string to Color object
 * @param rgb - RGB color string (rgb(255, 0, 0) or rgba(255, 0, 0, 1))
 * @returns Color object
 */
export function parseRgbColor(rgb: string): Color {
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);

  if (!match) {
    throw new Error(`Invalid RGB color: ${rgb}`);
  }

  return {
    r: parseInt(match[1], 10),
    g: parseInt(match[2], 10),
    b: parseInt(match[3], 10),
    a: match[4] ? parseFloat(match[4]) : 1,
  };
}

/**
 * Convert color to hex string
 */
export function colorToHex(color: Color): string {
  const toHex = (n: number) => {
    const hex = Math.round(n).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
}

/**
 * Convert color to RGB string
 */
export function colorToRgb(color: Color): string {
  if (color.a !== undefined && color.a < 1) {
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
  }
  return `rgb(${color.r}, ${color.g}, ${color.b})`;
}

/**
 * Calculate relative luminance of a color
 * @param color - Color object
 * @returns Relative luminance (0-1)
 */
export function calculateLuminance(color: Color): number {
  const { r, g, b } = color;

  // Normalize RGB values to 0-1 range
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const normalized = c / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });

  // Calculate relative luminance
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 * @param color1 - First color
 * @param color2 - Second color
 * @returns Contrast ratio (1-21)
 */
export function calculateContrastRatio(color1: Color, color2: Color): number {
  const luminance1 = calculateLuminance(color1);
  const luminance2 = calculateLuminance(color2);

  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * WCAG contrast level thresholds
 */
export const WCAG_CONTRAST_LEVELS = {
  AA: 4.5, // For normal text
  AA_LARGE: 3, // For large text (18pt+ or 14pt+ bold)
  AAA: 7, // For normal text
  AAA_LARGE: 4.5, // For large text
} as const;

/**
 * Check if contrast ratio meets WCAG AAA standard for normal text
 */
export function isWCAG_AAA(ratio: number): boolean {
  return ratio >= WCAG_CONTRAST_LEVELS.AAA;
}

/**
 * Check if contrast ratio meets WCAG AAA standard for large text
 */
export function isWCAG_AAA_Large(ratio: number): boolean {
  return ratio >= WCAG_CONTRAST_LEVELS.AAA_LARGE;
}

/**
 * Check if contrast ratio meets WCAG AA standard for normal text
 */
export function isWCAG_AA(ratio: number): boolean {
  return ratio >= WCAG_CONTRAST_LEVELS.AA;
}

/**
 * Check if contrast ratio meets WCAG AA standard for large text
 */
export function isWCAG_AA_Large(ratio: number): boolean {
  return ratio >= WCAG_CONTRAST_LEVELS.AA_LARGE;
}

/**
 * Contrast level result
 */
export interface ContrastResult {
  ratio: number;
  AAA: boolean;
  AAA_Large: boolean;
  AA: boolean;
  AA_Large: boolean;
  level: 'AAA' | 'AAA_Large' | 'AA' | 'AA_Large' | 'Fail';
}

/**
 * Validate contrast between two colors
 */
export function validateContrast(color1: Color | string, color2: Color | string): ContrastResult {
  const c1 = typeof color1 === 'string' ? parseColorString(color1) : color1;
  const c2 = typeof color2 === 'string' ? parseColorString(color2) : color2;

  const ratio = calculateContrastRatio(c1, c2);

  let level: ContrastResult['level'] = 'Fail';
  if (isWCAG_AAA(ratio)) {
    level = 'AAA';
  } else if (isWCAG_AAA_Large(ratio)) {
    level = 'AAA_Large';
  } else if (isWCAG_AA(ratio)) {
    level = 'AA';
  } else if (isWCAG_AA_Large(ratio)) {
    level = 'AA_Large';
  }

  return {
    ratio: Math.round(ratio * 100) / 100,
    AAA: isWCAG_AAA(ratio),
    AAA_Large: isWCAG_AAA_Large(ratio),
    AA: isWCAG_AA(ratio),
    AA_Large: isWCAG_AA_Large(ratio),
    level,
  };
}

/**
 * Parse color string in any format
 */
function parseColorString(color: string): Color {
  if (color.startsWith('#')) {
    return parseHexColor(color);
  } else if (color.startsWith('rgb')) {
    return parseRgbColor(color);
  } else {
    throw new Error(`Unsupported color format: ${color}`);
  }
}

/**
 * Get recommended text color (white or black) for background
 */
export function getContrastTextColor(backgroundColor: Color | string): 'white' | 'black' {
  const bg = typeof backgroundColor === 'string' ? parseColorString(backgroundColor) : backgroundColor;

  const luminance = calculateLuminance(bg);
  const white = { r: 255, g: 255, b: 255 };
  const black = { r: 0, g: 0, b: 0 };

  const whiteContrast = calculateContrastRatio(bg, white);
  const blackContrast = calculateContrastRatio(bg, black);

  return blackContrast > whiteContrast ? 'black' : 'white';
}

/**
 * Generate color palette with guaranteed WCAG AAA contrast
 */
export function generateAccessiblePalette(
  primaryColor: Color | string,
  backgroundColor: Color | string = { r: 255, g: 255, b: 255 }
): {
  primary: Color;
  primaryText: Color;
  background: Color;
  text: Color;
  success: Color;
  warning: Color;
  error: Color;
} {
  const primary = typeof primaryColor === 'string' ? parseColorString(primaryColor) : primaryColor;
  const bg = typeof backgroundColor === 'string' ? parseColorString(backgroundColor) : backgroundColor;

  const primaryText = getContrastTextColor(primary) === 'white' ? white : black;
  const text = getContrastTextColor(bg) === 'white' ? white : black;

  const white = { r: 255, g: 255, b: 255 };
  const black = { r: 0, g: 0, b: 0 };

  return {
    primary,
    primaryText,
    background: bg,
    text,
    success: { r: 34, g: 139, b: 34 }, // Forest green (high contrast)
    warning: { r: 204, g: 102, b: 0 }, // Dark orange (high contrast)
    error: { r: 139, g: 0, b: 0 }, // Dark red (high contrast)
  };
}

/**
 * Check if element has sufficient color contrast
 */
export function checkElementContrast(element: HTMLElement): ContrastResult | null {
  try {
    const style = window.getComputedStyle(element);
    const color = style.color;
    const backgroundColor = style.backgroundColor;

    if (!color || !backgroundColor) {
      return null;
    }

    return validateContrast(color, backgroundColor);
  } catch (error) {
    console.error('Error checking contrast:', error);
    return null;
  }
}

/**
 * Validate contrast for all text elements on page
 */
export function validatePageContrast(): ContrastResult[] {
  const textElements = document.querySelectorAll('body *');
  const results: ContrastResult[] = [];

  textElements.forEach((element) => {
    if (element.children.length === 0) {
      const result = checkElementContrast(element as HTMLElement);
      if (result) {
        results.push(result);
      }
    }
  });

  return results;
}

/**
 * Report accessibility color violations
 */
export function reportColorViolations(elements: HTMLElement[] = []): void {
  const toCheck = elements.length > 0 ? elements : Array.from(document.querySelectorAll('*'));

  const violations: Array<{ element: HTMLElement; ratio: number }> = [];

  toCheck.forEach((element) => {
    const result = checkElementContrast(element);
    if (result && !result.AAA) {
      violations.push({ element, ratio: result.ratio });
    }
  });

  if (violations.length > 0) {
    console.warn(`Found ${violations.length} elements with insufficient color contrast (< 7:1)`);
    violations.forEach(({ element, ratio }) => {
      console.warn(`  - Contrast ratio: ${ratio}:1`, element);
    });
  }
}

/**
 * CSS class for high contrast mode
 */
export const HIGH_CONTRAST_CLASS = 'high-contrast-mode';

/**
 * Enable high contrast mode
 */
export function enableHighContrastMode(): void {
  document.documentElement.classList.add(HIGH_CONTRAST_CLASS);
}

/**
 * Disable high contrast mode
 */
export function disableHighContrastMode(): void {
  document.documentElement.classList.remove(HIGH_CONTRAST_CLASS);
}

/**
 * Check if system prefers high contrast
 */
export function prefersHighContrast(): boolean {
  return window.matchMedia('(prefers-contrast: more)').matches;
}

/**
 * Listen for contrast preference changes
 */
export function onContrastPreferenceChange(callback: (prefersMore: boolean) => void): () => void {
  const mediaQuery = window.matchMedia('(prefers-contrast: more)');

  const handler = (e: MediaQueryListEvent) => {
    callback(e.matches);
  };

  mediaQuery.addEventListener('change', handler);

  return () => {
    mediaQuery.removeEventListener('change', handler);
  };
}
