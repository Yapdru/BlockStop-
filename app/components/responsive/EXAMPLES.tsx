/**
 * Responsive Design System - Example Components
 *
 * This file demonstrates how to use all the responsive design system features.
 * These examples are for reference and documentation purposes.
 */

import {
  ResponsiveGrid,
  GridItem,
  ResponsiveContainer,
  ResponsiveStack,
  MobileOnly,
  TabletOnly,
  DesktopOnly,
  ResponsiveAspectRatio,
  ResponsiveSidebarLayout,
} from "@/app/components/responsive";
import { useResponsive, useMediaQuery } from "@/app/hooks";

/**
 * Example 1: Using useResponsive Hook for Conditional Rendering
 */
export function Example1_UseResponsiveHook() {
  const { isMobile, isTablet, isDesktop, breakpoint, width } = useResponsive();

  return (
    <div className="p-fluid-lg">
      <h2>Current Breakpoint: {breakpoint}</h2>
      <p>Width: {width}px</p>

      {isMobile && <div>Mobile Layout</div>}
      {isTablet && <div>Tablet Layout</div>}
      {isDesktop && <div>Desktop Layout</div>}
    </div>
  );
}

/**
 * Example 2: Using useMediaQuery Hook
 */
export function Example2_UseMediaQueryHook() {
  const isDarkMode = useMediaQuery("dark");
  const isTouchDevice = useMediaQuery("touch");
  const isPortrait = useMediaQuery("portrait");

  return (
    <div
      className="p-fluid-lg"
      style={{
        backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
        color: isDarkMode ? "#ffffff" : "#000000",
      }}
    >
      <p>Dark Mode: {isDarkMode ? "Enabled" : "Disabled"}</p>
      <p>Touch Device: {isTouchDevice ? "Yes" : "No"}</p>
      <p>Portrait: {isPortrait ? "Yes" : "No"}</p>
    </div>
  );
}

/**
 * Example 3: ResponsiveGrid Component
 */
export function Example3_ResponsiveGrid() {
  const items = [
    { id: 1, title: "Card 1" },
    { id: 2, title: "Card 2" },
    { id: 3, title: "Card 3" },
    { id: 4, title: "Card 4" },
  ];

  return (
    <ResponsiveGrid
      columns={{ xs: 1, sm: 2, md: 3, lg: 4 }}
      gap="lg"
      margin="md"
    >
      {items.map((item) => (
        <GridItem key={item.id}>
          <div className="p-fluid-lg" style={{ backgroundColor: "#f3f4f6" }}>
            {item.title}
          </div>
        </GridItem>
      ))}
    </ResponsiveGrid>
  );
}

/**
 * Example 4: ResponsiveGrid with Spanning
 */
export function Example4_GridWithSpanning() {
  return (
    <ResponsiveGrid columns={{ xs: 1, sm: 2, md: 4, lg: 4 }}>
      {/* Featured item spans 2 columns on tablet and desktop */}
      <GridItem colSpan={{ xs: 1, sm: 2, md: 2, lg: 2 }}>
        <div
          className="p-fluid-xl"
          style={{
            backgroundColor: "#3b82f6",
            color: "white",
            borderRadius: "8px",
          }}
        >
          Featured Card (Spans 2 columns)
        </div>
      </GridItem>

      {/* Regular items */}
      <GridItem>
        <div
          className="p-fluid-lg"
          style={{ backgroundColor: "#f3f4f6", borderRadius: "8px" }}
        >
          Card 1
        </div>
      </GridItem>
      <GridItem>
        <div
          className="p-fluid-lg"
          style={{ backgroundColor: "#f3f4f6", borderRadius: "8px" }}
        >
          Card 2
        </div>
      </GridItem>
    </ResponsiveGrid>
  );
}

/**
 * Example 5: ResponsiveContainer
 */
export function Example5_ResponsiveContainer() {
  return (
    <ResponsiveContainer maxWidth="lg" padding="lg">
      <h2>Centered Content</h2>
      <p>This content is centered and has a maximum width on larger screens.</p>
    </ResponsiveContainer>
  );
}

/**
 * Example 6: ResponsiveStack - Auto Direction
 */
export function Example6_ResponsiveStack() {
  return (
    <ResponsiveStack direction="auto" gap="lg" alignItems="center">
      <div style={{ backgroundColor: "#f3f4f6", padding: "24px" }}>
        Item 1
      </div>
      <div style={{ backgroundColor: "#f3f4f6", padding: "24px" }}>
        Item 2
      </div>
      <div style={{ backgroundColor: "#f3f4f6", padding: "24px" }}>
        Item 3
      </div>
    </ResponsiveStack>
  );
}

/**
 * Example 7: Breakpoint-Specific Display
 */
export function Example7_BreakpointDisplay() {
  return (
    <div>
      <MobileOnly>
        <div className="p-fluid-lg" style={{ backgroundColor: "#dcfce7" }}>
          📱 Mobile Only
        </div>
      </MobileOnly>

      <TabletOnly>
        <div className="p-fluid-lg" style={{ backgroundColor: "#dbeafe" }}>
          📱 Tablet Only
        </div>
      </TabletOnly>

      <DesktopOnly>
        <div className="p-fluid-lg" style={{ backgroundColor: "#fae8ff" }}>
          🖥️ Desktop Only
        </div>
      </DesktopOnly>
    </div>
  );
}

/**
 * Example 8: Fluid Typography
 */
export function Example8_FluidTypography() {
  return (
    <div className="p-fluid-lg">
      <h1>Heading 1 - Fluid</h1>
      <p className="text-lg">Large paragraph text</p>
      <h2>Heading 2 - Fluid</h2>
      <p>Regular paragraph text with fluid sizing</p>
      <p className="text-sm">Small text</p>
    </div>
  );
}

/**
 * Example 9: Responsive Images
 */
export function Example9_ResponsiveImages() {
  return (
    <div>
      {/* Using picture element for art direction */}
      <picture>
        <source
          media="(min-width: 1024px)"
          srcSet="https://via.placeholder.com/800x400"
        />
        <source
          media="(min-width: 640px)"
          srcSet="https://via.placeholder.com/600x400"
        />
        <img
          src="https://via.placeholder.com/400x300"
          alt="Responsive image"
          style={{ width: "100%", height: "auto" }}
        />
      </picture>

      {/* Image with aspect ratio preservation */}
      <ResponsiveAspectRatio ratio="video">
        <img
          src="https://via.placeholder.com/1280x720"
          alt="Video thumbnail"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </ResponsiveAspectRatio>
    </div>
  );
}

/**
 * Example 10: Responsive Sidebar Layout
 */
export function Example10_SidebarLayout() {
  return (
    <ResponsiveSidebarLayout
      sidebarPosition="right"
      sidebarWidth="300px"
      gap="xl"
      sidebar={
        <aside
          style={{
            backgroundColor: "#f3f4f6",
            padding: "24px",
            borderRadius: "8px",
          }}
        >
          <h3>Sidebar</h3>
          <p>This sidebar appears beside content on desktop, below on mobile.</p>
        </aside>
      }
    >
      <main>
        <h2>Main Content</h2>
        <p>
          This is the main content area. On desktop, it displays beside the
          sidebar. On mobile and tablet, the sidebar appears below.
        </p>
      </main>
    </ResponsiveSidebarLayout>
  );
}

/**
 * Example 11: Touch-Friendly Targets
 */
export function Example11_TouchTargets() {
  return (
    <div className="p-fluid-lg">
      <h3>Touch-Friendly Buttons</h3>
      <div className="gap-fluid-lg" style={{ display: "flex", gap: "16px" }}>
        <button
          style={{
            minHeight: "44px",
            minWidth: "44px",
            padding: "12px 16px",
            borderRadius: "4px",
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Standard Touch
        </button>
        <button
          className="touch-target-large"
          style={{
            borderRadius: "4px",
            backgroundColor: "#10b981",
            color: "white",
            border: "none",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Large Touch
        </button>
      </div>
    </div>
  );
}

/**
 * Example 12: Fluid Spacing Utilities
 */
export function Example12_FluidSpacing() {
  return (
    <div>
      <div className="p-fluid-sm" style={{ backgroundColor: "#f3f4f6" }}>
        Small padding
      </div>

      <div className="m-fluid-lg" style={{ backgroundColor: "#fef2f2" }}>
        Responsive margin
      </div>

      <div
        className="gap-fluid-lg"
        style={{
          display: "flex",
          gap: "16px",
          backgroundColor: "#eff6ff",
          padding: "16px",
        }}
      >
        <div style={{ flex: 1, backgroundColor: "white", padding: "12px" }}>
          Item with fluid gap
        </div>
        <div style={{ flex: 1, backgroundColor: "white", padding: "12px" }}>
          Item with fluid gap
        </div>
      </div>
    </div>
  );
}

/**
 * Example 13: Custom Media Query Hook
 */
export function Example13_CustomMediaQuery() {
  const isWideScreen = useMediaQuery("(min-width: 1920px)");
  const isSmallScreen = useMediaQuery("(max-width: 375px)");

  return (
    <div className="p-fluid-lg">
      <p>Wide Screen (1920px+): {isWideScreen ? "Yes" : "No"}</p>
      <p>Small Screen (≤375px): {isSmallScreen ? "Yes" : "No"}</p>
    </div>
  );
}

/**
 * Example 14: Container Queries (Modern browsers)
 */
export function Example14_ContainerQueries() {
  return (
    <div
      className="container-responsive"
      style={{
        backgroundColor: "#f3f4f6",
        padding: "24px",
        borderRadius: "8px",
      }}
    >
      <div className="container-responsive-layout">
        <div>Item 1</div>
        <div>Item 2</div>
        <div>Item 3</div>
      </div>
    </div>
  );
}

/**
 * Example 15: Complete Dashboard-Like Layout
 */
export function Example15_CompleteDashboard() {
  const stats = [
    { label: "Total Users", value: "1,234" },
    { label: "Active Sessions", value: "567" },
    { label: "Revenue", value: "$89,012" },
    { label: "Growth", value: "+12.5%" },
  ];

  return (
    <ResponsiveContainer maxWidth="2xl" padding="lg">
      <h1 className="mb-8">Dashboard</h1>

      <ResponsiveGrid
        columns={{ xs: 1, sm: 2, md: 2, lg: 4 }}
        gap="lg"
        margin="none"
      >
        {stats.map((stat) => (
          <GridItem key={stat.label}>
            <div
              className="p-fluid-lg"
              style={{
                backgroundColor: "white",
                borderRadius: "8px",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
              }}
            >
              <p style={{ color: "#6b7280", marginBottom: "8px" }}>
                {stat.label}
              </p>
              <p
                style={{
                  fontSize: "24px",
                  fontWeight: 700,
                  color: "#1f2937",
                }}
              >
                {stat.value}
              </p>
            </div>
          </GridItem>
        ))}
      </ResponsiveGrid>

      <div style={{ marginTop: "32px" }}>
        <ResponsiveSidebarLayout
          sidebarPosition="right"
          sidebarWidth="280px"
          sidebar={
            <div
              style={{
                backgroundColor: "white",
                padding: "24px",
                borderRadius: "8px",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
              }}
            >
              <h3>Filters</h3>
              <p>Sidebar content</p>
            </div>
          }
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "24px",
              borderRadius: "8px",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h2>Main Content</h2>
            <p>Dashboard content goes here</p>
          </div>
        </ResponsiveSidebarLayout>
      </div>
    </ResponsiveContainer>
  );
}
