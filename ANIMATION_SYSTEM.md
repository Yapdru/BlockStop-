# BlockStop Animation & Microinteraction System

Complete animation and microinteraction system for BlockStop, built with Framer Motion and CSS keyframes for smooth 60fps performance.

## Overview

This comprehensive animation system provides:
- **12+ Animation Components** for various UI patterns
- **Motion Utilities** for consistent animation behavior
- **CSS Keyframes** for lightweight animations
- **Custom Hooks** for animation state management
- **Smooth Performance** optimized for 60fps

---

## Architecture

### File Structure

```
app/
├── components/animations/
│   ├── PageTransition.tsx       # Page-level transitions
│   ├── FadeIn.tsx               # Fade animations
│   ├── SlideIn.tsx              # Slide animations
│   ├── BounceIn.tsx             # Bounce animations
│   ├── SkeletonLoader.tsx       # Loading skeletons
│   ├── LoadingSpinner.tsx       # Spinner loaders
│   ├── SuccessAnimation.tsx     # Success states
│   ├── ErrorShake.tsx           # Error states
│   └── index.ts                 # Barrel export
├── hooks/
│   ├── useAnimationState.ts     # Animation state hooks
│   └── index.ts                 # Barrel export
├── utils/
│   ├── motion.ts                # Motion configurations
│   ├── transitions.ts           # Transition definitions
│   ├── index.ts                 # Barrel export
│   └── ...
└── styles/
    └── keyframes.css            # CSS keyframe animations
```

---

## Core Components

### 1. Page Transitions

Handle page-level entrance and exit animations.

**Usage:**
```tsx
import { PageTransition } from '@/app/components/animations';

export default function Page() {
  return (
    <PageTransition>
      <div>Your page content</div>
    </PageTransition>
  );
}
```

**Variants:**
- `PageTransition` - Simple fade and slide
- `PageTransitionWrapper` - With AnimatePresence support
- `LayoutTransition` - Shared layout animations

---

### 2. Fade Animations

Basic opacity transitions for content reveal.

**Components:**
- `FadeIn` - Simple fade in
- `FadeInUp` - Fade in from bottom
- `FadeInDown` - Fade in from top
- `FadeInLeft` - Fade in from left
- `FadeInRight` - Fade in from right
- `StaggerContainer` - Container for staggered children
- `StaggerItem` - Child item in stagger container

**Usage:**
```tsx
import { FadeIn, FadeInUp, StaggerContainer, StaggerItem } from '@/app/components/animations';

// Simple fade
<FadeIn delay={0.2} duration={0.5}>
  <h1>Welcome</h1>
</FadeIn>

// Staggered list
<StaggerContainer>
  {items.map((item) => (
    <StaggerItem key={item.id}>
      <Card>{item.title}</Card>
    </StaggerItem>
  ))}
</StaggerContainer>
```

**Props:**
- `delay?: number` - Animation delay in seconds
- `duration?: number` - Animation duration in seconds
- `once?: boolean` - Animate only once when in view
- `distance?: number` - Distance to slide from
- `onAnimationComplete?: () => void` - Callback on completion

---

### 3. Slide Animations

Directional slide transitions.

**Components:**
- `SlideIn` - Configurable direction
- `SlideInLeft` - Slide from left
- `SlideInRight` - Slide from right
- `SlideInTop` - Slide from top
- `SlideInBottom` - Slide from bottom
- `SlideFade` - Combined slide and fade

**Usage:**
```tsx
import { SlideIn, SlideInBottom } from '@/app/components/animations';

// Flexible direction
<SlideIn direction="left" distance={50}>
  <Sidebar />
</SlideIn>

// Specific direction
<SlideInBottom>
  <Toast message="Saved successfully" />
</SlideInBottom>
```

---

### 4. Bounce Animations

Spring physics-based animations for attention-grabbing.

**Components:**
- `BounceIn` - Scale and bounce entrance
- `BounceInUp` - Bounce from bottom
- `BounceInDown` - Bounce from top
- `BounceInLeft` - Bounce from left
- `BounceInRight` - Bounce from right
- `JiggleAnimation` - Continuous jiggle effect
- `PulseScale` - Continuous pulse effect

**Usage:**
```tsx
import { BounceIn, PulseScale } from '@/app/components/animations';

// Bounce entrance
<BounceIn intensity="heavy" delay={0.3}>
  <button className="btn-primary">Click Me!</button>
</BounceIn>

// Attention effect
<PulseScale intensity={0.1}>
  <Badge>New Feature</Badge>
</PulseScale>
```

**Intensity Levels:**
- `light` - Gentle spring motion
- `medium` - Default spring
- `heavy` - Bouncy spring physics

---

### 5. Loading Skeletons

Shimmer animations for content placeholders.

**Components:**
- `SkeletonLoader` - Basic skeleton with shimmer
- `SkeletonBox` - Rectangular placeholder
- `SkeletonAvatar` - Circular avatar placeholder
- `SkeletonText` - Multi-line text placeholder
- `SkeletonCard` - Complete card skeleton
- `SkeletonTable` - Table skeleton

**Usage:**
```tsx
import { SkeletonCard, SkeletonText } from '@/app/components/animations';

// Card skeleton
<SkeletonCard hasImage={true} />

// Text placeholder
<SkeletonText lines={3} width="100%" />
```

**Props:**
- `width?: string | number` - Width of skeleton
- `height?: string | number` - Height of skeleton
- `count?: number` - Number of skeletons to render
- `borderRadius?: string | number` - Border radius

---

### 6. Loading Spinners

Animated loading indicators.

**Components:**
- `LoadingSpinner` - Main spinner with variants
- `LoadingBar` - Progress bar animation
- `LoadingOverlay` - Full-screen or container overlay
- `SkeletonSpinner` - Pulsing dots spinner
- `DotsLoader` - Bouncing dots animation

**Usage:**
```tsx
import { LoadingSpinner, LoadingOverlay, DotsLoader } from '@/app/components/animations';

// Default spinner
<LoadingSpinner size="md" variant="default" color="blue" />

// Custom variant
<LoadingSpinner variant="dots" size="lg" />

// Overlay during loading
<LoadingOverlay 
  isLoading={isLoading} 
  message="Loading..." 
  fullScreen={false}
/>

// Bouncing dots
<DotsLoader color="purple" />
```

**Variants:**
- `default` - Standard ring spinner
- `dots` - Three pulsing dots
- `ring` - Rotating ring
- `dual-ring` - Two-color ring
- `pulse` - Pulsing circle

**Sizes:**
- `sm` - Small (24px)
- `md` - Medium (32px)
- `lg` - Large (48px)
- `xl` - Extra large (64px)

---

### 7. Success Animations

Positive feedback animations.

**Components:**
- `SuccessAnimation` - Full success message with icon
- `SuccessCheckmark` - Animated checkmark SVG
- `SuccessBadge` - Small success badge
- `SuccessTick` - Inline checkmark
- `SuccessToast` - Toast notification

**Usage:**
```tsx
import { SuccessAnimation, SuccessToast } from '@/app/components/animations';

// Full success modal
<SuccessAnimation
  isVisible={success}
  title="Saved!"
  message="Changes saved successfully."
  onComplete={() => navigate('/')}
  autoClose={true}
  autoCloseDuration={3000}
/>

// Toast notification
<SuccessToast
  message="Profile updated successfully!"
  isVisible={showSuccess}
  onDismiss={() => setShowSuccess(false)}
/>
```

---

### 8. Error Animations

Error feedback with shake and visual indicators.

**Components:**
- `ErrorShake` - Error alert with shake effect
- `ShakeInput` - Input field with validation shake
- `ErrorPulse` - Pulsing error indicator
- `ValidationError` - Animated validation message
- `ErrorBoundary` - Error display with retry

**Usage:**
```tsx
import { ErrorShake, ShakeInput, ErrorBoundary } from '@/app/components/animations';

// Error alert
<ErrorShake
  isVisible={hasError}
  title="Error"
  message="Failed to save changes."
  severity="error"
/>

// Input with validation
<ShakeInput
  hasError={emailError}
  errorMessage="Invalid email address"
  label="Email"
  placeholder="Enter email"
/>

// Error boundary
<ErrorBoundary
  error={errorMessage}
  onRetry={handleRetry}
  title="Something went wrong"
/>
```

**Severity Levels:**
- `error` - Red error alert
- `warning` - Yellow warning alert
- `info` - Blue info alert

---

## Motion Utilities

### Configuration Objects

**Duration Constants:**
```tsx
import { duration } from '@/app/utils/motion';

duration.instant    // 0.1s
duration.fast       // 0.2s
duration.normal     // 0.3s
duration.slow       // 0.5s
duration.slower     // 0.7s
duration.slowest    // 1s
```

**Delay Constants:**
```tsx
import { delay } from '@/app/utils/motion';

delay.none          // 0s
delay.xs            // 0.05s
delay.sm            // 0.1s
delay.md            // 0.15s
delay.lg            // 0.2s
delay.xl            // 0.3s
```

**Spring Configurations:**
```tsx
import { springConfig } from '@/app/utils/motion';

springConfig.default    // Balanced spring
springConfig.gentle     // Smooth, slow spring
springConfig.bouncy     // Bouncy spring physics
springConfig.stiff      // Tight, fast spring
```

**Easing Functions:**
```tsx
import { easing } from '@/app/utils/motion';

easing.easeInOut
easing.easeOut
easing.easeIn
easing.easeInQuad
easing.easeOutQuad
easing.easeInOutQuad
```

### Animation Variants

Pre-built animation variants for Framer Motion:

```tsx
import {
  fadeVariants,
  slideInLeftVariants,
  bounceInVariants,
  staggerContainerVariants,
} from '@/app/utils/motion';

<motion.div
  initial="hidden"
  animate="visible"
  variants={fadeVariants}
>
  Content
</motion.div>
```

### Utility Functions

```tsx
import {
  getStaggerDelay,
  combineVariants,
  hoverScale,
  tapScale,
} from '@/app/utils/motion';

// Get delay for staggered items
const delay = getStaggerDelay(index, 0.1);

// Combine multiple variant objects
const customVariants = combineVariants(fadeVariants, slideInLeftVariants);

// Hover and tap animations
<motion.button
  whileHover={hoverScale(1.1)}
  whileTap={tapScale(0.95)}
>
  Click me
</motion.button>
```

---

## Transition Factory Functions

Pre-built transition configurations:

```tsx
import {
  modalTransition,
  dropdownTransition,
  toastTransition,
  createSlideTransition,
  createListTransition,
  createBounceTransition,
} from '@/app/utils/transitions';

// Modal with scale and fade
<motion.div variants={modalTransition}>

// Dropdown menu
<motion.div variants={dropdownTransition}>

// Custom slide direction
const transition = createSlideTransition('top', 50);

// List with stagger
const listTransition = createListTransition(items.length);
```

---

## Animation Hooks

Custom hooks for animation state management.

### useAnimationState

Manage animation lifecycle:

```tsx
import { useAnimationState } from '@/app/hooks';

const { isAnimating, isPending, isComplete, error } = useAnimationState();
const { startAnimation, completeAnimation, resetAnimation, setError } = useAnimationState();

// Usage
useEffect(() => {
  startAnimation();
  // ... animation logic
  completeAnimation();
}, [startAnimation, completeAnimation]);
```

### useDelayedAnimation

Delay animation start:

```tsx
import { useDelayedAnimation } from '@/app/hooks';

const { shouldAnimate } = useDelayedAnimation(300); // 300ms delay
```

### useInViewAnimation

Trigger animation when element comes into view:

```tsx
import { useInViewAnimation } from '@/app/hooks';

const { ref, isInView } = useInViewAnimation();

return (
  <div ref={ref}>
    {isInView && <SomeAnimation />}
  </div>
);
```

### useHoverAnimation

Manage hover state:

```tsx
import { useHoverAnimation } from '@/app/hooks';

const { isHovered, hoverProps } = useHoverAnimation();

<div {...hoverProps}>
  {isHovered && <HoverEffect />}
</div>
```

### useLoadingAnimation

Manage loading state with auto-reset:

```tsx
import { useLoadingAnimation } from '@/app/hooks';

const { isLoading, setLoading, stopLoading } = useLoadingAnimation(3000);

setLoading(true); // Auto stops after 3000ms
```

### useSuccessAnimation

Manage success state:

```tsx
import { useSuccessAnimation } from '@/app/hooks';

const { isSuccess, showSuccess, hideSuccess } = useSuccessAnimation(3000);

showSuccess(); // Auto dismisses after 3000ms
```

### useErrorAnimation

Manage error state:

```tsx
import { useErrorAnimation } from '@/app/hooks';

const { hasError, errorMessage, showError, hideError } = useErrorAnimation(4000);

showError('Something went wrong!');
```

### useStaggerAnimation

Manage staggered list animations:

```tsx
import { useStaggerAnimation } from '@/app/hooks';

const { isVisible, getItemDelay, triggerAnimation } = useStaggerAnimation(items.length);

{items.map((item, i) => (
  <motion.div
    delay={getItemDelay(i)}
    key={item.id}
  >
    {item.name}
  </motion.div>
))}
```

---

## CSS Keyframes

Lightweight CSS animations available as utility classes.

**Available Animations:**
```css
.animate-fadeIn              /* Fade in */
.animate-slideInLeft         /* Slide in from left */
.animate-slideInRight        /* Slide in from right */
.animate-slideInDown         /* Slide in from top */
.animate-slideInUp           /* Slide in from bottom */
.animate-bounceIn            /* Bounce entrance */
.animate-bounceOut           /* Bounce exit */
.animate-scaleIn             /* Scale entrance */
.animate-scaleOut            /* Scale exit */
.animate-spin-slow           /* Slow spin */
.animate-spin-medium         /* Medium speed spin */
.animate-spin-fast           /* Fast spin */
.animate-shake               /* Shake effect */
.animate-shake-small         /* Small shake */
.animate-pulse               /* Pulsing effect */
.animate-shimmer             /* Shimmer loading effect */
.animate-heartbeat           /* Heartbeat animation */
.animate-flashing            /* Flashing effect */
.animate-glow                /* Glowing effect */
```

**Delay Classes:**
```css
.animate-delay-100           /* 0.1s delay */
.animate-delay-200           /* 0.2s delay */
.animate-delay-300           /* 0.3s delay */
.animate-delay-500           /* 0.5s delay */
.animate-delay-700           /* 0.7s delay */
.animate-delay-1000          /* 1s delay */
```

**Duration Classes:**
```css
.animate-duration-200        /* 0.2s duration */
.animate-duration-300        /* 0.3s duration */
.animate-duration-500        /* 0.5s duration */
.animate-duration-700        /* 0.7s duration */
.animate-duration-1000       /* 1s duration */
```

**GPU Acceleration:**
```css
.will-animate                /* Enable GPU acceleration */
.gpu-accelerate              /* Force GPU acceleration */
```

---

## Usage Examples

### Form Submission Flow

```tsx
import { useAnimationState } from '@/app/hooks';
import { SuccessAnimation, ErrorShake } from '@/app/components/animations';

export function MyForm() {
  const { isAnimating, completeAnimation, setError } = useAnimationState();
  const [success, setSuccess] = useState(false);
  const [error, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    startAnimation();

    try {
      const res = await submitForm();
      setSuccess(true);
      completeAnimation();
    } catch (err) {
      setErrorMsg(err.message);
      setError(err.message);
    }
  };

  return (
    <>
      <SuccessAnimation
        isVisible={success}
        title="Success!"
        onComplete={() => navigate('/')}
      />

      <ErrorShake
        isVisible={!!error}
        message={error}
      />

      <form onSubmit={handleSubmit}>
        {/* Form fields */}
      </form>
    </>
  );
}
```

### Loading State with Skeleton

```tsx
import { SkeletonCard, FadeIn } from '@/app/components/animations';

export function DataDisplay({ isLoading, data }) {
  return (
    <div className="space-y-4">
      {isLoading ? (
        <>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </>
      ) : (
        <FadeIn>
          {data.map((item) => (
            <Card key={item.id}>{item.title}</Card>
          ))}
        </FadeIn>
      )}
    </div>
  );
}
```

### Staggered List with Animations

```tsx
import {
  StaggerContainer,
  StaggerItem,
  FadeInUp,
} from '@/app/components/animations';

export function ItemList({ items }) {
  return (
    <StaggerContainer staggerDelay={0.1}>
      {items.map((item) => (
        <StaggerItem key={item.id}>
          <div className="p-4 border rounded-lg">
            {item.name}
          </div>
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}
```

---

## Performance Optimization

### Best Practices

1. **Use CSS for simple animations** - Keyframes are lighter than JS
2. **Enable GPU acceleration** - Add `will-animate` class for complex animations
3. **Batch animations** - Group animation start times
4. **Use `once` prop** - Prevent re-animation on scroll
5. **Lazy load animations** - Load animations only when needed

### Example: Optimized List

```tsx
<div className="will-animate gpu-accelerate">
  <StaggerContainer staggerDelay={0.05}>
    {items.map((item, i) => (
      <StaggerItem key={item.id}>
        <motion.div
          className="gpu-accelerate"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          {item.content}
        </motion.div>
      </StaggerItem>
    ))}
  </StaggerContainer>
</div>
```

---

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (iOS 13+)
- Mobile browsers: Full support (GPU accelerated)

---

## Troubleshooting

### Animations not playing
- Check `motion.ts` is imported correctly
- Verify Framer Motion version in `package.json`
- Check browser DevTools for JS errors

### Performance issues
- Reduce stagger delays
- Use CSS animations for simple effects
- Add `will-animate` class
- Profile with Chrome DevTools

### Z-index stacking issues
- Add `relative` class to animate container
- Use `z-index` utilities for overlays
- Check modal/overlay positioning

---

## Dependencies

- **Framer Motion**: ^10.16.0 (already installed)
- **React**: ^18.2.0
- **Tailwind CSS**: ^3.3.0 (for utility classes)

---

## Future Enhancements

- [ ] Gesture-based animations (swipe, pinch)
- [ ] Page transition library integration
- [ ] Animation presets marketplace
- [ ] Animation performance analyzer
- [ ] Accessibility motion preferences
- [ ] Dark mode animation themes

---

## Support

For issues or questions about the animation system:
1. Check the component examples above
2. Review motion.ts and transitions.ts for available configurations
3. Test with Framer Motion documentation
4. Enable GPU acceleration for performance issues

---

## File References

- **Animation Components**: `/app/components/animations/`
- **Motion Utilities**: `/app/utils/motion.ts`
- **Transition Definitions**: `/app/utils/transitions.ts`
- **CSS Keyframes**: `/app/styles/keyframes.css`
- **Animation Hooks**: `/app/hooks/useAnimationState.ts`
