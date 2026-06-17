# Responsive Design System - Quick Reference

## 🎯 Common Imports

```typescript
// Hooks
import { useResponsive } from "@/app/hooks";
import { useMediaQuery, useIsMobile, useIsDarkMode } from "@/app/hooks";

// Components
import { 
  ResponsiveGrid, GridItem,
  ResponsiveContainer,
  ResponsiveStack,
  MobileOnly, TabletOnly, DesktopOnly,
  ResponsiveAspectRatio,
  ResponsiveSidebarLayout
} from "@/app/components/responsive";

// Utilities & Types
import { BREAKPOINTS, MEDIA_QUERIES, TOUCH_TARGETS } from "@/app/utils/responsive";
```

## 🔌 Hooks Quick Start

### useResponsive
```typescript
const { isMobile, isTablet, isDesktop, breakpoint, width, isTouchDevice } = useResponsive();

if (isMobile) return <MobileView />;
if (isDesktop) return <DesktopView />;
```

### useMediaQuery
```typescript
const isDark = useMediaQuery("dark");
const isTouch = useMediaQuery("touch");
const isLandscape = useMediaQuery("landscape");
```

### Convenience Hooks
```typescript
useIsMobile()           // width < 640px
useIsTablet()           // 640px <= width < 1024px
useIsDesktop()          // width >= 1024px
useIsTouchDevice()      // Touch capable
useIsPortrait()         // Portrait orientation
useIsLandscape()        // Landscape orientation
useIsDarkMode()         // Dark mode enabled
usePreferReducedMotion()// Reduce motion preference
```

## 🎨 Components Quick Start

### ResponsiveGrid
```typescript
<ResponsiveGrid 
  columns={{ xs: 1, sm: 2, md: 3, lg: 4 }}
  gap="lg"
  margin="md"
>
  {items.map(item => (
    <GridItem key={item.id}>{item.content}</GridItem>
  ))}
</ResponsiveGrid>
```

### ResponsiveContainer
```typescript
<ResponsiveContainer maxWidth="lg" padding="lg">
  Content centered with max-width
</ResponsiveContainer>
```

### ResponsiveStack
```typescript
<ResponsiveStack direction="auto" gap="lg" alignItems="center">
  <div>Stacks on mobile, side-by-side on desktop</div>
  <div>Auto direction based on screen size</div>
</ResponsiveStack>
```

### Conditional Rendering
```typescript
<MobileOnly>Mobile content only</MobileOnly>
<TabletOnly>Tablet content only</TabletOnly>
<DesktopOnly>Desktop content only</DesktopOnly>
```

### ResponsiveSidebarLayout
```typescript
<ResponsiveSidebarLayout
  sidebarPosition="right"
  sidebarWidth="300px"
  sidebar={<Sidebar />}
>
  <MainContent />
  {/* Sidebar stacks below on mobile */}
</ResponsiveSidebarLayout>
```

### ResponsiveAspectRatio
```typescript
<ResponsiveAspectRatio ratio="video">
  <img src="..." alt="..." />
</ResponsiveAspectRatio>

{/* Ratios: "square", "video" (16:9), "cinematic" (2:1), or number */}
```

## 🎨 CSS Utilities Quick Start

### Fluid Typography
```html
<h1>Auto-scales 28px→36px</h1>
<h2>Auto-scales 24px→32px</h2>
<p class="text-lg">Auto-scales 18px→20px</p>
<p class="text-sm">Auto-scales 14px→16px</p>
```

### Fluid Spacing
```html
<!-- Padding -->
<div class="p-fluid-lg">Responsive padding</div>
<div class="px-fluid-lg">Horizontal padding</div>
<div class="py-fluid-md">Vertical padding</div>

<!-- Margin -->
<div class="m-fluid-lg">Responsive margin</div>
<div class="mx-fluid-lg">Horizontal margin</div>

<!-- Gap -->
<div style="display: flex" class="gap-fluid-lg">Flex gap</div>
```

### Responsive Display
```html
<div class="hidden-mobile">Hide on mobile</div>
<div class="hidden-tablet">Hide on tablet</div>
<div class="hidden-desktop">Hide on desktop</div>

<div class="show-mobile">Show only on mobile</div>
<div class="show-tablet">Show only on tablet</div>
<div class="show-desktop">Show only on desktop</div>
```

### Responsive Grids
```html
<!-- Auto-fit grid -->
<div class="grid-auto-fit">
  <div>Flexible columns</div>
  <div>Auto-adjusting</div>
</div>

<!-- Responsive grid -->
<div class="grid-responsive">
  <div>1 col mobile, 2 tablet, 3 desktop</div>
</div>

<!-- Flex responsive -->
<div class="flex-responsive">
  <div>Stacked mobile, side-by-side desktop</div>
</div>
```

### Responsive Images
```html
<!-- Auto-responsive -->
<img src="image.jpg" alt="desc" />

<!-- Aspect ratio preserved -->
<div class="image-responsive aspect-video">
  <img src="image.jpg" alt="desc" />
</div>

<!-- Picture element -->
<picture>
  <source media="(min-width: 1024px)" srcset="desktop.jpg" />
  <source media="(min-width: 640px)" srcset="tablet.jpg" />
  <img src="mobile.jpg" alt="desc" />
</picture>
```

### Touch-Friendly
```html
<button>Auto 44x44px minimum</button>
<button class="touch-target-large">Larger 56x56px</button>
```

## 📱 Breakpoint Reference

| Name | Width | Use Case |
|------|-------|----------|
| `xs` | 320px | Small phones |
| `sm` | 640px | Large phones |
| `md` | 1024px | Tablets |
| `lg` | 1280px | Desktops |
| `xl` | 1536px | Large desktops |
| `xxl` | 2560px | 4K displays |

## 🎬 Common Patterns

### Dashboard Layout
```typescript
<ResponsiveContainer maxWidth="2xl" padding="lg">
  <h1>Dashboard</h1>
  
  {/* Stats grid */}
  <ResponsiveGrid columns={{ xs: 1, sm: 2, md: 4 }} gap="lg">
    {stats.map(stat => <GridItem key={stat.id}>{stat}</GridItem>)}
  </ResponsiveGrid>

  {/* Content with sidebar */}
  <ResponsiveSidebarLayout sidebar={<Filters />}>
    <MainContent />
  </ResponsiveSidebarLayout>
</ResponsiveContainer>
```

### Product Gallery
```typescript
<ResponsiveGrid
  columns={{ xs: 1, sm: 2, md: 3, lg: 4 }}
  gap="lg"
>
  {products.map(product => (
    <GridItem key={product.id}>
      <ResponsiveAspectRatio ratio="video">
        <img src={product.image} alt={product.name} />
      </ResponsiveAspectRatio>
    </GridItem>
  ))}
</ResponsiveGrid>
```

### Hero Section
```typescript
<div className="py-fluid-xl">
  <ResponsiveContainer>
    <h1>Large Heading</h1>
    <p className="text-lg">Description</p>
    <ResponsiveStack gap="lg" alignItems="center">
      <button>Primary Action</button>
      <button>Secondary Action</button>
    </ResponsiveStack>
  </ResponsiveContainer>
</div>
```

### Navigation
```typescript
export function Header() {
  const { isMobile } = useResponsive();

  return (
    <header className="px-fluid-lg py-fluid-md">
      {isMobile ? <MobileNav /> : <DesktopNav />}
    </header>
  );
}
```

## 🔧 Configuration

### Custom Breakpoint Values
Edit `/app/utils/responsive/breakpoints.ts`:
```typescript
export const BREAKPOINTS = {
  xs: 320,
  sm: 640,
  // ... customize values
};
```

### Custom Touch Target Size
```typescript
export const TOUCH_TARGETS = {
  minimum: 44,      // WCAG AA
  recommended: 48,  // WCAG AAA
  large: 56,
};
```

## 🚨 Common Gotchas

❌ **Don't**: Hard-code pixel breakpoints
```typescript
if (window.innerWidth < 640) { } // NO
```

✅ **Do**: Use hooks
```typescript
const { isMobile } = useResponsive(); // YES
```

---

❌ **Don't**: Fixed sizes everywhere
```typescript
<div style={{ width: "1000px" }}>Breaks on mobile</div>
```

✅ **Do**: Use responsive utilities
```typescript
<div className="p-fluid-lg">Scales responsively</div>
```

---

❌ **Don't**: Multiple breakpoint-specific components
```typescript
<MobileProductCard />
<TabletProductCard />
<DesktopProductCard />
```

✅ **Do**: One responsive component
```typescript
<ProductCard /> {/* Handles all sizes */}
```

## 📊 CSS Variables Available

```css
--vw, --vh, --vmin, --vmax    /* Viewport units */
--spacing-xs, --spacing-sm, --spacing-md, --spacing-lg,
--spacing-xl, --spacing-xxl   /* Spacing scale */
--font-scale-mobile, --font-scale-tablet, --font-scale-desktop
```

## ♿ Accessibility

All components and utilities include:
- ✅ 44x44px minimum touch targets (WCAG AAA)
- ✅ Motion preference respecting (`prefers-reduced-motion`)
- ✅ Dark mode support (`prefers-color-scheme`)
- ✅ High contrast support (`prefers-contrast`)
- ✅ Print media optimization
- ✅ Keyboard navigation support
- ✅ Safe area/notch support (iOS, Android)

## 📚 Full Documentation

- **Complete Guide**: `/app/utils/responsive/RESPONSIVE_DESIGN_GUIDE.md`
- **API Reference**: Inline TypeScript docs in source files
- **Examples**: `/app/components/responsive/EXAMPLES.tsx`
- **System Overview**: `/RESPONSIVE_DESIGN_SYSTEM.md`

## 🎯 Next Steps

1. Import hooks/components you need
2. Use `useResponsive()` for breakpoint detection
3. Use `ResponsiveGrid` for layouts
4. Apply `.p-fluid-*` and `.gap-fluid-*` classes
5. Test on multiple breakpoints
6. Check `/app/components/responsive/EXAMPLES.tsx` for patterns

---

**Last Updated**: 2026-06-16
**System Version**: 1.0
