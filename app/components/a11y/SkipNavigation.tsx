/**
 * Skip Navigation Component
 * WCAG 2.1 Level AAA - Skip Links (2.4.1)
 * Provides skip to main content link for keyboard users
 */

'use client';

import React from 'react';
import { ARIA_LABELS } from '@/app/utils/a11y/aria-labels';
import { manageFocusOnNavigation } from '@/app/utils/a11y/focus-management';
import styles from './SkipNavigation.module.css';

export interface SkipNavigationProps {
  /**
   * ID of main content element to skip to
   */
  mainContentId?: string;

  /**
   * Additional skip links to provide
   */
  additionalLinks?: Array<{
    label: string;
    targetId: string;
  }>;

  /**
   * Callback when skip link is clicked
   */
  onSkip?: (targetId: string) => void;

  /**
   * CSS class name
   */
  className?: string;
}

/**
 * Skip Navigation Component
 *
 * Provides keyboard accessible skip links for jumping to main content
 * and other important page sections. Appears on focus of first element.
 *
 * WCAG 2.1 Level AAA compliance:
 * - Keyboard accessible (Tab to show)
 * - Proper semantic HTML (nav > ul > li > a)
 * - ARIA labels for clarity
 * - Focus visible indicator
 * - Screen reader announced
 */
export const SkipNavigation: React.FC<SkipNavigationProps> = ({
  mainContentId = 'main-content',
  additionalLinks = [],
  onSkip,
  className = '',
}) => {
  const navRef = React.useRef<HTMLNavElement>(null);
  const skipLinks = [
    { label: 'Skip to main content', targetId: mainContentId },
    ...additionalLinks,
  ];

  const handleSkipClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();

    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      // Make target focusable if needed
      if (!targetElement.hasAttribute('tabindex')) {
        targetElement.setAttribute('tabindex', '-1');
      }

      // Manage focus on the target
      manageFocusOnNavigation(targetId);

      // Call callback
      onSkip?.(targetId);

      // Optional: remove focus outline after click
      setTimeout(() => {
        if (document.activeElement === targetElement) {
          targetElement.blur();
        }
      }, 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLAnchorElement>) => {
    // Allow Enter and Space to activate
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      (e.target as HTMLAnchorElement).click();
    }
  };

  return (
    <nav
      ref={navRef}
      className={`skip-navigation ${className}`.trim()}
      aria-label={ARIA_LABELS.SKIP_LINKS}
    >
      <style jsx>{`
        .skip-navigation {
          /* Hidden until focused */
          position: absolute;
          top: -9999px;
          left: -9999px;
        }

        /* Show on first tab */
        .skip-navigation:focus-within {
          position: static;
          top: auto;
          left: auto;
          z-index: 10000;
        }

        .skip-navigation ul {
          list-style: none;
          margin: 0;
          padding: 0;
          background-color: #000;
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .skip-navigation li {
          margin: 0;
          padding: 0;
        }

        .skip-navigation a {
          display: block;
          padding: 12px 16px;
          color: #fff;
          text-decoration: none;
          background-color: #000;
          border: none;
          font-size: 14px;
          font-weight: 500;
          transition: background-color 0.2s ease;
          text-align: left;
        }

        .skip-navigation a:hover {
          background-color: #333;
        }

        .skip-navigation a:focus {
          outline: 3px solid #fff;
          outline-offset: -3px;
        }

        .skip-navigation a:visited {
          color: #fff;
        }

        /* Alternative visible style (uncomment if you want skip links always visible) */
        /* .skip-navigation {
          position: static;
          top: auto;
          left: auto;
          margin-bottom: 1rem;
        } */
      `}</style>

      <ul role="list">
        {skipLinks.map((link) => (
          <li key={link.targetId}>
            <a
              href={`#${link.targetId}`}
              onClick={(e) => handleSkipClick(e, link.targetId)}
              onKeyDown={handleKeyDown}
              className="skip-link"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

/**
 * Alternative component for when main content needs tabindex
 * Automatically manages tabindex on target element
 */
export const SkipNavigationWithAutoFocus: React.FC<SkipNavigationProps> = (props) => {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const mainElement = document.querySelector('main') || document.getElementById(props.mainContentId || 'main-content');

    if (mainElement && !mainElement.hasAttribute('tabindex')) {
      mainElement.setAttribute('tabindex', '-1');
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Show on Tab key press
      if (e.key === 'Tab') {
        setIsVisible(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [props.mainContentId]);

  return <SkipNavigation {...props} />;
};

/**
 * Export accessible skip navigation styles for global CSS
 */
export const skipNavigationStyles = `
/* Skip Navigation Styles */
nav.skip-navigation {
  position: absolute;
  top: -9999px;
  left: -9999px;
}

nav.skip-navigation:focus-within {
  position: static;
  top: auto;
  left: auto;
  z-index: 10000;
}

nav.skip-navigation ul {
  list-style: none;
  margin: 0;
  padding: 0;
  background-color: #000;
  display: flex;
  flex-direction: column;
}

nav.skip-navigation a {
  display: block;
  padding: 12px 16px;
  color: #fff;
  text-decoration: none;
  background-color: #000;
  border: none;
  font-size: 14px;
  font-weight: 500;
}

nav.skip-navigation a:hover {
  background-color: #333;
}

nav.skip-navigation a:focus {
  outline: 3px solid #fff;
  outline-offset: -3px;
}

nav.skip-navigation a:visited {
  color: #fff;
}

/* High contrast mode support */
@media (prefers-contrast: more) {
  nav.skip-navigation a {
    border: 2px solid #fff;
  }

  nav.skip-navigation a:focus {
    outline-width: 4px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  nav.skip-navigation a {
    transition: none;
  }
}
`;

/**
 * Usage example:
 *
 * // Simple usage
 * <SkipNavigation />
 *
 * // With custom main content ID
 * <SkipNavigation mainContentId="app-main" />
 *
 * // With additional skip links
 * <SkipNavigation
 *   mainContentId="main"
 *   additionalLinks={[
 *     { label: 'Skip to navigation', targetId: 'nav' },
 *     { label: 'Skip to footer', targetId: 'footer' },
 *   ]}
 *   onSkip={(targetId) => console.log(`Skipped to ${targetId}`)}
 * />
 *
 * Then in your app:
 * <SkipNavigation />
 * <main id="main-content">
 *   Your main content
 * </main>
 */
