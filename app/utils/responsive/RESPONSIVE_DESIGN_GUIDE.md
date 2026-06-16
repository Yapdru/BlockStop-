# Responsive Design System Guide

## Overview

BlockStop features a comprehensive, mobile-first responsive design system that ensures optimal user experience across all device sizes. This guide covers all responsive utilities, components, and best practices.

## Breakpoints

The design system uses six standardized breakpoints:

| Breakpoint | Size | Device Type | Use Case |
|-----------|------|-------------|----------|
| **xs** | 320px | Small phones | iPhone SE, older Android phones |
| **sm** | 640px | Large phones, small tablets | iPhone 12+, iPad mini |
| **md** | 1024px | Tablets, small desktops | iPad Pro, small laptops |
| **lg** | 1280px | Desktops | Standard desktop displays |
| **xl** | 1536px | Large desktops | 27" monitors |
| **xxl** | 2560px | Ultra-wide displays | 4K monitors, large screens |

### Breakpoint Usage

```typescript
// In breakpoints.ts
import { BREAKPOINTS, MEDIA_QUERIES } from "@/app/utils/responsive/breakpoints";

// Access breakpoint values
const mobileWidth = BREAKPOINTS.xs;      // 320
const tabletWidth = BREAKPOINTS.sm;      // 640
const desktopWidth = BREAKPOINTS.md;     // 1024

// Use media queries in CSS
const query = MEDIA_QUERIES.md;  // "(min-width: 1024px)"
```

## Hooks

### useResponsive Hook

Detects the current breakpoint and provides convenient boolean flags for conditional rendering.

```typescript
import { useResponsive } from "@/app/hooks/useResponsive";

export function MyComponent() {
  const { 
    breakpoint,      // Current breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'
    isMobile,        // width < 640px
    isTablet,        // 640px <= width < 1024px
    isDesktop,       // width >= 1024px
    isLargeDesktop,  // width >= 1280px
    width,           // Actual viewport width
    height,          // Actual viewport height
    isTouchDevice,   // Is a touch device
    isPortrait,      // Portrait orientation
    isLandscape,     // Landscape orientation
  } = useResponsive();

  if (isMobile) {
    return <MobileLayout />;
  }

  if (isTablet) {
    return <TabletLayout />;
  }

  return <DesktopLayout />;
}
```

### useMediaQuery Hook

For custom media queries beyond breakpoints.

```typescript
import { 
  useMediaQuery,
  useIsDarkMode,
  useIsTouchDevice,
  usePreferReducedMotion,
  useIsPortrait,
} from "@/app/hooks/useMediaQuery";

export function MyComponent() {
  // Custom media query
  const isWide = useMediaQuery("(min-width: 1920px)");

  // Convenience hooks
  const isDark = useIsDarkMode();              // Dark mode enabled
  const isTouch = useIsTouchDevice();          // Touch device
  const reduceMotion = usePreferReducedMotion(); // Reduced motion preference
  const isPortrait = useIsPortrait();          // Portrait orientation

  return (
    <div className={isDark ? "dark" : "light"}>
      {isTouch && <TouchOptimizedUI />}
      {!isTouch && <PrecisePointingUI />}
    </div>
  );
}
```

## Responsive Components

### ResponsiveGrid Component

A 12-column grid system that automatically adapts to different screen sizes.

#### Basic Usage

```typescript
import { ResponsiveGrid, GridItem } from "@/app/components/responsive/ResponsiveGrid";

export function ProductGrid() {
  return (
    <ResponsiveGrid 
      columns={{ xs: 1, sm: 2, md: 3, lg: 4 }}
      gap="lg"
      margin="md"
    >
      {products.map((product) => (
        <GridItem key={product.id}>
          <ProductCard product={product} />
        </GridItem>
      ))}
    </ResponsiveGrid>
  );
}
```

#### Advanced Usage with Spanning

```typescript
export function DashboardGrid() {
  return (
    <ResponsiveGrid columns={{ xs: 1, sm: 2, md: 4, lg: 4 }}>
      {/* Full width on mobile, half on tablet, half on desktop */}
      <GridItem colSpan={{ xs: 1, sm: 2, md: 2, lg: 2 }}>
        <MainCard />
      </GridItem>

      {/* Normal grid items */}
      <GridItem>
        <StatCard />
      </GridItem>
      <GridItem>
        <StatCard />
      </GridItem>
      <GridItem>
        <StatCard />
      </GridItem>
    </ResponsiveGrid>
  );
}
```

## Responsive Utilities

### Fluid Typography

Responsive font sizes that scale smoothly across breakpoints using CSS `clamp()`.

```html
<!-- Headings automatically scale -->
<h1>Responsive Heading</h1>  <!-- 28px to 36px -->
<h2>Subheading</h2>          <!-- 24px to 32px -->
<h3>Section Title</h3>       <!-- 20px to 28px -->
<p>Body text</p>             <!-- 16px to 18px -->
```

### Fluid Spacing

Responsive padding and margins that adjust based on viewport size.

```html
<!-- Padding utilities -->
<div class="p-fluid-lg">
  Content with responsive padding
</div>

<!-- Margin utilities -->
<div class="m-fluid-xl">
  Content with responsive margin
</div>

<!-- Axis-specific spacing -->
<div class="px-fluid-lg py-fluid-md">
  Responsive horizontal and vertical padding
</div>

<!-- Gap utilities for flexbox/grid -->
<div class="flex gap-fluid-lg">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

### Responsive Display

Show/hide content based on breakpoint.

```html
<!-- Hide on mobile, show on larger screens -->
<div class="hidden-mobile">
  Desktop-only content
</div>

<!-- Show only on mobile -->
<div class="show-mobile">
  Mobile-only navigation
</div>

<!-- Show only on tablet -->
<div class="show-tablet">
  Tablet-optimized layout
</div>

<!-- Hide on desktop and up -->
<div class="hidden-desktop">
  Mobile and tablet content
</div>
```

### Responsive Images

Images that scale properly and maintain aspect ratio.

```html
<!-- Basic responsive image -->
<img src="image.jpg" alt="Description" />

<!-- Image with aspect ratio preservation -->
<div class="image-responsive aspect-video">
  <img src="video-thumbnail.jpg" alt="Video" />
</div>

<!-- Using picture element for art direction -->
<picture>
  <source media="(min-width: 1024px)" srcset="desktop-image.jpg" />
  <source media="(min-width: 640px)" srcset="tablet-image.jpg" />
  <img src="mobile-image.jpg" alt="Responsive image" />
</picture>
```

### Responsive Grids

Built-in responsive grid utilities using CSS Grid.

```html
<!-- Auto-fit grid - adapts column count automatically -->
<div class="grid-auto-fit">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>

<!-- Grid that changes layout per breakpoint -->
<div class="grid-responsive">
  <div>1 column on mobile</div>
  <div>2 columns on tablet</div>
  <div>3 columns on desktop</div>
</div>

<!-- Flexbox responsive layout -->
<div class="flex-responsive">
  <div>Stacked on mobile</div>
  <div>Side by side on desktop</div>
</div>
```

### Touch-Friendly Targets

Ensures interactive elements meet accessibility requirements.

```html
<!-- Minimum 44x44px touch target -->
<button>Click me</button>

<!-- Larger touch target for important actions -->
<button class="touch-target-large">Important Action</button>

<!-- Touch-friendly spacing between elements -->
<div class="flex gap-8 touch-spacing">
  <button>Action 1</button>
  <button>Action 2</button>
</div>
```

## CSS Custom Properties

Use CSS variables for consistent responsive sizing:

```css
:root {
  --spacing-xs: clamp(4px, 1vw, 8px);
  --spacing-sm: clamp(8px, 1.5vw, 12px);
  --spacing-md: clamp(12px, 2vw, 16px);
  --spacing-lg: clamp(16px, 3vw, 24px);
  --spacing-xl: clamp(24px, 4vw, 32px);
  --spacing-xxl: clamp(32px, 5vw, 48px);
}
```

## Container Queries

Modern responsive approach for component-level adaptations (supported in latest browsers).

```html
<div class="container-responsive">
  <div class="container-responsive-layout">
    <!-- Layout adapts based on container size, not viewport -->
  </div>
</div>
```

## Accessibility Features

### Motion Preferences

Respects user's motion preferences for reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  /* Animations automatically disabled for users who prefer reduced motion */
}
```

### High Contrast

Supports high contrast mode:

```css
@media (prefers-contrast: more) {
  /* Increased contrast for accessibility */
}
```

### Dark Mode

Adapts colors based on system preference:

```css
@media (prefers-color-scheme: dark) {
  body { background: #1f2937; }
}
```

## Print Media

Content automatically optimized for printing:

```html
<div class="no-print">
  This content won't print
</div>
```

## Safe Areas & Notches

Automatically handles safe areas for devices with notches:

```html
<!-- Content with safe area padding -->
<div class="safe-area-padding">
  Content that respects notches and safe areas
</div>
```

## Mobile-First Approach

All styles start with mobile defaults, then enhance for larger screens:

```typescript
// Mobile-first pattern
const [layout, setLayout] = useState("stacked"); // Mobile default

// Only change on larger screens
if (isDesktop) {
  setLayout("side-by-side");
}
```

## Best Practices

### 1. Use Hooks for Conditional Rendering

```typescript
// ✅ Good - Using hooks
const { isMobile } = useResponsive();
return isMobile ? <Mobile /> : <Desktop />;

// ❌ Avoid - Hard-coded pixel values
if (window.innerWidth < 640) {
  return <Mobile />;
}
```

### 2. Prefer Fluid Sizes

```typescript
// ✅ Good - Fluid sizing with clamp()
const fontSize = "clamp(16px, 4vw, 24px)";

// ❌ Avoid - Fixed sizes at breakpoints
const fontSize = width < 640 ? "16px" : "24px";
```

### 3. Use ResponsiveGrid for Layouts

```typescript
// ✅ Good - Using ResponsiveGrid component
<ResponsiveGrid columns={{ xs: 1, md: 2, lg: 3 }}>
  {items.map((item) => <GridItem key={item.id}>{item}</GridItem>)}
</ResponsiveGrid>

// ❌ Avoid - Manual media query styling
<div style={{ gridTemplateColumns: width > 1024 ? "repeat(3, 1fr)" : "1fr" }}>
```

### 4. Optimize Images

```typescript
// ✅ Good - Responsive images with srcset
<img
  src="small.jpg"
  srcSet="small.jpg 640w, medium.jpg 1024w, large.jpg 1920w"
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  alt="Description"
/>

// ❌ Avoid - Single large image
<img src="large.jpg" alt="Description" />
```

### 5. Touch-Friendly Interactive Elements

```typescript
// ✅ Good - Minimum 44x44px targets
<button style={{ minHeight: "44px", minWidth: "44px", padding: "12px 16px" }}>
  Touch-friendly button
</button>

// ❌ Avoid - Small buttons
<button style={{ padding: "4px 8px" }}>
  Small button
</button>
```

## Testing Responsive Design

### Browser DevTools

1. Open Chrome DevTools (F12)
2. Click the device toggle (Ctrl+Shift+M)
3. Test different device sizes and orientations

### Viewport Sizes to Test

- **Mobile**: 320px, 375px, 425px (iPhone SE, iPhone 12, large phones)
- **Tablet**: 640px, 768px, 1024px (iPad, iPad Pro)
- **Desktop**: 1280px, 1920px, 2560px (Various desktop sizes)

### Touch Testing

On Windows/Mac: Use Chrome DevTools touch emulation
On actual device: Test on real phones and tablets

## Performance Considerations

1. **Media Queries**: Use `min-width` for mobile-first approach (better performance)
2. **Images**: Serve appropriately sized images using srcset
3. **CSS**: Leverage hardware acceleration with `transform` instead of `left`/`top`
4. **JavaScript**: Debounce resize events to avoid performance issues

## Browser Support

| Feature | Support |
|---------|---------|
| Media Queries | All modern browsers |
| CSS Grid | All modern browsers |
| Flexbox | All modern browsers |
| Container Queries | Chrome 105+, Safari 16+ |
| CSS `clamp()` | All modern browsers |
| Safe Area | iOS 11.2+, Chrome 69+ |

## Migration Guide

### From Fixed Layouts to Responsive

1. Change from pixels to percentages or `clamp()`
2. Replace hard-coded breakpoints with constants
3. Use ResponsiveGrid instead of custom flex/grid
4. Test on multiple device sizes

## Troubleshooting

### Elements Not Responsive

- Check if viewport meta tag is present in `<head>`
- Ensure `max-width: 100%` on images
- Verify media queries are using `min-width` (mobile-first)

### Touch Issues

- Ensure touch targets are at least 44x44px
- Check `pointer` media query support
- Add `touch-action: manipulation` for better touch experience

### Performance Issues

- Debounce resize event listeners
- Use CSS media queries instead of JavaScript when possible
- Optimize images for different breakpoints

## Related Files

- **Breakpoints**: `/app/utils/responsive/breakpoints.ts`
- **Hooks**: `/app/hooks/useResponsive.ts`, `/app/hooks/useMediaQuery.ts`
- **Styles**: `/app/styles/responsive-utilities.css`
- **Components**: `/app/components/responsive/ResponsiveGrid.tsx`

## Additional Resources

- [MDN: Responsive Web Design](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design)
- [Web.dev: Responsive Design](https://web.dev/responsive-web-design-basics/)
- [CSS Tricks: A Complete Guide to Grid](https://css-tricks.com/snippets/css/complete-guide-grid/)
- [W3C: Media Queries](https://www.w3.org/TR/mediaqueries-5/)
