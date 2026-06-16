"use client";

import React, { ReactNode } from "react";
import { useResponsive } from "@/app/hooks/useResponsive";

/**
 * Responsive container component that constrains width and centers content
 */
export interface ResponsiveContainerProps {
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  centerContent?: boolean;
  className?: string;
}

const maxWidthMap = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
  full: "100%",
};

const paddingMap = {
  none: "0",
  sm: "16px",
  md: "24px",
  lg: "32px",
  xl: "48px",
};

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  maxWidth = "lg",
  padding = "md",
  centerContent = true,
  className = "",
}) => {
  return (
    <div
      className={className}
      style={{
        width: "100%",
        maxWidth: maxWidthMap[maxWidth],
        margin: centerContent ? "0 auto" : "0",
        padding: `clamp(${paddingMap.sm}, 4vw, ${paddingMap[padding]})`,
        boxSizing: "border-box",
      }}
    >
      {children}
    </div>
  );
};

ResponsiveContainer.displayName = "ResponsiveContainer";

/**
 * Responsive stack component - flexbox container that switches direction based on breakpoint
 */
export interface ResponsiveStackProps {
  children: ReactNode;
  direction?: "vertical" | "horizontal" | "auto";
  gap?: "xs" | "sm" | "md" | "lg" | "xl" | "xxl";
  alignItems?: "start" | "center" | "end" | "stretch";
  justifyContent?: "start" | "center" | "end" | "space-between" | "space-around";
  wrap?: boolean;
  className?: string;
}

const gapMap = {
  xs: "clamp(4px, 1vw, 8px)",
  sm: "clamp(8px, 1.5vw, 12px)",
  md: "clamp(12px, 2vw, 16px)",
  lg: "clamp(16px, 3vw, 24px)",
  xl: "clamp(24px, 4vw, 32px)",
  xxl: "clamp(32px, 5vw, 48px)",
};

export const ResponsiveStack: React.FC<ResponsiveStackProps> = ({
  children,
  direction = "auto",
  gap = "md",
  alignItems = "start",
  justifyContent = "start",
  wrap = false,
  className = "",
}) => {
  const { isMobile } = useResponsive();

  // Auto mode: vertical on mobile, horizontal on desktop
  const resolvedDirection =
    direction === "auto" ? (isMobile ? "vertical" : "horizontal") : direction;

  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: resolvedDirection === "vertical" ? "column" : "row",
        gap: gapMap[gap],
        alignItems,
        justifyContent,
        flexWrap: wrap ? "wrap" : "nowrap",
      }}
    >
      {children}
    </div>
  );
};

ResponsiveStack.displayName = "ResponsiveStack";

/**
 * Only render children on specific breakpoints
 */
export interface ShowOnBreakpointProps {
  children: ReactNode;
  breakpoints?: ("xs" | "sm" | "md" | "lg" | "xl" | "xxl")[];
  fallback?: ReactNode;
}

export const ShowOnBreakpoint: React.FC<ShowOnBreakpointProps> = ({
  children,
  breakpoints = ["xs", "sm", "md", "lg", "xl", "xxl"],
  fallback = null,
}) => {
  const { breakpoint } = useResponsive();

  if (!breakpoint || !breakpoints.includes(breakpoint)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

ShowOnBreakpoint.displayName = "ShowOnBreakpoint";

/**
 * Only render on mobile devices
 */
export const MobileOnly: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isMobile } = useResponsive();
  return isMobile ? <>{children}</> : null;
};

MobileOnly.displayName = "MobileOnly";

/**
 * Only render on tablet devices
 */
export const TabletOnly: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isTablet } = useResponsive();
  return isTablet ? <>{children}</> : null;
};

TabletOnly.displayName = "TabletOnly";

/**
 * Only render on desktop and up
 */
export const DesktopOnly: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isDesktop } = useResponsive();
  return isDesktop ? <>{children}</> : null;
};

DesktopOnly.displayName = "DesktopOnly";

/**
 * Responsive aspect ratio container
 */
export interface ResponsiveAspectRatioProps {
  children: ReactNode;
  ratio?: "square" | "video" | "cinematic" | number;
  className?: string;
}

const aspectRatioMap = {
  square: 1,
  video: 16 / 9,
  cinematic: 2 / 1,
};

export const ResponsiveAspectRatio: React.FC<ResponsiveAspectRatioProps> = ({
  children,
  ratio = "video",
  className = "",
}) => {
  const resolvedRatio =
    typeof ratio === "number" ? ratio : aspectRatioMap[ratio];
  const paddingBottom = ((1 / resolvedRatio) * 100).toFixed(2);

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: "100%",
        paddingBottom: `${paddingBottom}%`,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
      >
        {children}
      </div>
    </div>
  );
};

ResponsiveAspectRatio.displayName = "ResponsiveAspectRatio";

/**
 * Responsive sidebar layout - sidebar on desktop, stacked on mobile
 */
export interface ResponsiveSidebarLayoutProps {
  children: ReactNode;
  sidebar: ReactNode;
  sidebarWidth?: string;
  sidebarPosition?: "left" | "right";
  gap?: "md" | "lg" | "xl";
}

export const ResponsiveSidebarLayout: React.FC<
  ResponsiveSidebarLayoutProps
> = ({
  children,
  sidebar,
  sidebarWidth = "300px",
  sidebarPosition = "right",
  gap = "lg",
}) => {
  const { isDesktop } = useResponsive();
  const gapValue = gapMap[gap as keyof typeof gapMap];

  if (!isDesktop) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: gapValue }}>
        <div>{children}</div>
        <aside style={{ width: "100%" }}>{sidebar}</aside>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          sidebarPosition === "left"
            ? `${sidebarWidth} 1fr`
            : `1fr ${sidebarWidth}`,
        gap: gapValue,
        width: "100%",
      }}
    >
      {sidebarPosition === "left" && <aside>{sidebar}</aside>}
      <main>{children}</main>
      {sidebarPosition === "right" && <aside>{sidebar}</aside>}
    </div>
  );
};

ResponsiveSidebarLayout.displayName = "ResponsiveSidebarLayout";

/**
 * Responsive modal/dialog - full screen on mobile, centered on desktop
 */
export interface ResponsiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
}

export const ResponsiveModal: React.FC<ResponsiveModalProps> = ({
  isOpen,
  onClose,
  children,
  maxWidth = "600px",
}) => {
  const { isMobile } = useResponsive();

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: isMobile ? "0" : "8px",
          maxWidth: isMobile ? "100%" : maxWidth,
          maxHeight: "90vh",
          overflow: "auto",
          width: "100%",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

ResponsiveModal.displayName = "ResponsiveModal";

/**
 * Responsive navigation that collapses to hamburger on mobile
 */
export interface ResponsiveNavProps {
  children: ReactNode;
  mobileMenuButton?: ReactNode;
}

export const ResponsiveNav: React.FC<ResponsiveNavProps> = ({
  children,
  mobileMenuButton,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { isMobile } = useResponsive();

  if (isMobile) {
    return (
      <>
        {mobileMenuButton && (
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              minHeight: "48px",
              minWidth: "48px",
              padding: "8px",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            {mobileMenuButton}
          </button>
        )}
        {mobileMenuOpen && (
          <nav
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              backgroundColor: "white",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              zIndex: 999,
              padding: "16px",
            }}
          >
            {children}
          </nav>
        )}
      </>
    );
  }

  return <nav>{children}</nav>;
};

ResponsiveNav.displayName = "ResponsiveNav";

export default {
  ResponsiveContainer,
  ResponsiveStack,
  ShowOnBreakpoint,
  MobileOnly,
  TabletOnly,
  DesktopOnly,
  ResponsiveAspectRatio,
  ResponsiveSidebarLayout,
  ResponsiveModal,
  ResponsiveNav,
};
