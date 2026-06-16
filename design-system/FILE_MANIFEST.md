# BlockStop Design System - File Manifest

Complete listing of all files in the design system foundation.

## Directory Structure

```
design-system/
├── tokens/                          # Design tokens (JSON files)
│   ├── colors.json                  # Color palette (primary, secondary, success, warning, error, neutral)
│   ├── typography.json              # Typography scales (fonts, sizes, weights, line heights)
│   ├── spacing.json                 # Spacing scale (12pt base unit: 0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96)
│   ├── shadows.json                 # Shadow elevation system (sm, md, lg, xl, 2xl)
│   ├── animations.json              # Animation durations, easing, and keyframes
│   ├── breakpoints.json             # Responsive breakpoints (xs: 320, sm: 640, md: 1024, lg: 1280, xl: 1536)
│   ├── border-radius.json           # Border radius tokens (sm, md, lg, full)
│   ├── z-index.json                 # Z-index layering system
│   └── opacity.json                 # Opacity/transparency levels
│
├── components/                      # React components (TSX files)
│   ├── Button.tsx                   # Primary, secondary, ghost, danger variants with loading state
│   ├── Input.tsx                    # Text inputs with validation states (success, error, warning)
│   ├── Card.tsx                     # Container with CardHeader, CardBody, CardFooter sub-components
│   ├── Alert.tsx                    # Info, success, warning, error with icons
│   ├── Modal.tsx                    # Dialog/drawer/modal with animations and ModalFooter
│   ├── Badge.tsx                    # Status/category labels with optional remove button
│   ├── Checkbox.tsx                 # Single checkbox with indeterminate state support
│   ├── RadioGroup.tsx               # Radio button group component
│   ├── Select.tsx                   # Dropdown select component with search support
│   ├── Textarea.tsx                 # Multi-line input with character counter
│   ├── Tooltip.tsx                  # Positioned tooltips (top, bottom, left, right)
│   ├── Skeleton.tsx                 # Loading placeholder (text, circle, rectangle)
│   ├── Spinner.tsx                  # Animated loading indicator (sm, md, lg, xl)
│   └── Progress.tsx                 # LinearProgress and CircularProgress components
│
├── utils/                           # Utility functions
│   └── cn.ts                        # Classname combiner utility
│
├── styles/                          # Global styles
│   └── globals.css                  # Tailwind directives and custom animations
│
├── .storybook/                      # Storybook configuration
│   ├── main.ts                      # Storybook main configuration
│   └── preview.ts                   # Storybook preview configuration
│
├── index.ts                         # Main export file (all components and utilities)
├── tailwind.config.ts               # Tailwind CSS configuration extending with design tokens
├── tsconfig.json                    # TypeScript configuration
├── package.json                     # Package metadata and dependencies
├── postcss.config.js                # PostCSS configuration
├── README.md                        # Component library overview and usage guide
├── CONTRIBUTING.md                  # Contributing guidelines
└── FILE_MANIFEST.md                 # This file
```

## Component Summary

### Form Components (6)
1. **Button** - Versatile button with 4 variants (primary, secondary, ghost, danger), 3 sizes (sm, md, lg), and loading state
2. **Input** - Text input with validation states, label, helper text, error messages
3. **Textarea** - Multi-line input with character counter and resize control
4. **Select** - Dropdown select with placeholder, error states, helper text
5. **Checkbox** - Single or indeterminate checkboxes with label
6. **RadioGroup** - Radio button group with multiple options

### Layout Components (2)
1. **Card** - Container with elevated/flat/outline variants, composable with CardHeader/CardBody/CardFooter
2. **Modal** - Dialog/drawer/modal with animations, close button, keyboard support

### Feedback Components (4)
1. **Alert** - Info/success/warning/error notifications with icons and optional close
2. **Badge** - Status labels with optional remove button
3. **Spinner** - Animated loading indicator (4 sizes, 3 colors)
4. **Skeleton** - Loading placeholders (text, circle, rectangle)

### Utility Components (2)
1. **Tooltip** - Positioned help text (top, bottom, left, right)
2. **Progress** - LinearProgress and CircularProgress with percentage display

## Design Tokens Summary

### Colors
- **Primary (Blue)**: 50-950 shades
- **Secondary (Purple)**: 50-950 shades
- **Success (Green)**: 50-950 shades
- **Warning (Yellow)**: 50-950 shades
- **Error (Red)**: 50-950 shades
- **Neutral (Gray)**: 50-950 shades

### Typography
- **Fonts**: Geist (sans), JetBrains Mono (mono)
- **Sizes**: xs (12px) → 4xl (36px)
- **Weights**: light, normal, medium, semibold, bold, extrabold
- **Line Heights**: Paired with each size

### Spacing Scale (12pt base)
0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96px

### Shadows (Elevation System)
- sm: 1px shadow
- md: 4px shadow
- lg: 10px shadow
- xl: 20px shadow
- 2xl: 25px shadow

### Animations
- Durations: fast (150ms), base (200ms), slow (300ms), slower (500ms)
- Easing: easeIn, easeOut, easeInOut, linear
- Keyframes: fadeIn, fadeOut, slideIn, slideOut

### Responsive Breakpoints
- xs: 320px (mobile)
- sm: 640px (tablet)
- md: 1024px (small desktop)
- lg: 1280px (desktop)
- xl: 1536px (large desktop)

### Border Radius
- sm: 4px
- md: 8px
- lg: 12px
- full: 9999px

### Z-Index Layering
- base: 0
- dropdown: 1000
- sticky: 1020
- fixed: 1030
- modal: 1040
- popover: 1050
- tooltip: 1080
- notification: 1090

## Key Features

### Accessibility
- Semantic HTML elements
- ARIA labels and roles
- Keyboard navigation support
- Focus management
- Screen reader compatible
- WCAG 2.1 AA color contrast

### React/TypeScript
- Full TypeScript support with comprehensive interfaces
- React.forwardRef for all components
- Proper prop spreading and composition
- Display name set for debugging

### Documentation
- JSDoc comments for all components
- @example sections showing usage
- Comprehensive README with examples
- Contributing guidelines
- Component API documentation

### Tailwind CSS
- Pre-configured tailwind.config.ts
- Design tokens integrated as theme extensions
- PostCSS configuration included
- Global styles with custom animations

### Storybook
- Configured for component documentation
- Accessibility addon enabled
- Stories template ready for components
- Preview configuration for styling

## Getting Started

1. **Install dependencies**
   ```bash
   cd /home/user/BlockStop-/design-system
   npm install
   ```

2. **View components in Storybook**
   ```bash
   npm run storybook
   ```

3. **Build the library**
   ```bash
   npm run build
   ```

4. **Export and use components**
   ```tsx
   import { Button, Input, Card } from '@blockstop/design-system';
   ```

## File Count Summary

- **Token Files**: 9 JSON files (colors, typography, spacing, shadows, animations, breakpoints, border-radius, z-index, opacity)
- **Component Files**: 14 TSX files (Button, Input, Card, Alert, Modal, Badge, Checkbox, RadioGroup, Select, Textarea, Tooltip, Skeleton, Spinner, Progress)
- **Configuration Files**: 5 files (tsconfig.json, tailwind.config.ts, package.json, postcss.config.js, .storybook/main.ts, .storybook/preview.ts)
- **Documentation Files**: 3 files (README.md, CONTRIBUTING.md, FILE_MANIFEST.md)
- **Utility Files**: 1 file (cn.ts)
- **Style Files**: 1 file (globals.css)
- **Export Files**: 1 file (index.ts)

**Total: 34 files**

## Design System Features

- Production-grade component library
- Comprehensive design tokens
- Accessibility-first approach
- TypeScript for type safety
- Tailwind CSS for styling
- Storybook for documentation
- Contributing guidelines
- Responsive design support
- Dark mode ready
- Animation tokens
- Elevation system
- Comprehensive color palette
