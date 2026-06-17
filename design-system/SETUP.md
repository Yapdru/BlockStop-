# BlockStop Design System - Setup Guide

## Installation & Initial Setup

### 1. Install Dependencies

```bash
cd design-system
npm install
```

### 2. Project Structure

The design system is organized into logical directories:

```
design-system/
├── tokens/           # Design tokens (JSON configuration)
├── components/       # React components (TSX)
├── utils/           # Utility functions
├── styles/          # Global styles
├── .storybook/      # Storybook configuration
└── Configuration files (tailwind, typescript, package.json)
```

### 3. Available Scripts

```bash
# View components in Storybook (development)
npm run storybook

# Build the design system library
npm run build

# Run tests
npm run test

# Lint code
npm run lint

# Type check
npm run type-check
```

## Using the Design System

### In Your Project

1. **Import components**
```tsx
import { Button, Input, Card, Alert } from '@blockstop/design-system';
```

2. **Import utilities**
```tsx
import { cn } from '@blockstop/design-system';
```

3. **Configure Tailwind**
```ts
// tailwind.config.ts
import baseConfig from '@blockstop/design-system/tailwind.config';

export default {
  ...baseConfig,
  // Your project-specific overrides
};
```

## Component Categories

### Form Components
- **Button** - CTA button with variants
- **Input** - Text input field
- **Textarea** - Multi-line input
- **Select** - Dropdown selector
- **Checkbox** - Single choice toggle
- **RadioGroup** - Multiple option selector

### Layout Components
- **Card** - Container with header/body/footer
- **Modal** - Dialog/drawer overlay

### Feedback Components
- **Alert** - Notification message
- **Badge** - Status label
- **Spinner** - Loading indicator
- **Skeleton** - Loading placeholder

### Utility Components
- **Tooltip** - Help text popup
- **Progress** - Progress indicators (linear/circular)

## Design Tokens Overview

All tokens are JSON files in `tokens/` directory:

### Colors
- Primary (Blue), Secondary (Purple), Success, Warning, Error, Neutral
- Each with 11 shades (50-950)

### Typography
- Fonts: Geist (sans), JetBrains Mono (mono)
- Sizes: xs to 4xl
- Weights: light to extrabold

### Spacing
- 12pt base scale: 0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96px

### Shadows
- 5 elevation levels: sm, md, lg, xl, 2xl

### Responsive Breakpoints
- xs (320px), sm (640px), md (1024px), lg (1280px), xl (1536px)

### Animations
- Durations: fast, base, slow, slower
- Easing: easeIn, easeOut, easeInOut, linear

## Accessibility Features

All components include:
- Semantic HTML
- ARIA labels and roles
- Keyboard navigation
- Focus management
- Color contrast compliance (WCAG 2.1 AA)
- Screen reader support

## Customization

### Extending Components

Components use TypeScript interfaces and accept all standard HTML attributes:

```tsx
import { Button } from '@blockstop/design-system';

<Button 
  variant="primary" 
  size="lg"
  className="custom-class"
  onClick={handleClick}
>
  Click me
</Button>
```

### Theming

Modify `tailwind.config.ts` to customize colors, spacing, and other tokens:

```ts
export default {
  theme: {
    extend: {
      colors: {
        primary: { /* your colors */ }
      }
    }
  }
}
```

## Component Documentation

View detailed documentation for each component in `README.md`:

- Full component APIs
- Prop descriptions
- Usage examples
- Variants and states

## Contributing

Before adding new components:

1. Review `CONTRIBUTING.md`
2. Follow component structure and naming conventions
3. Add TypeScript types and JSDoc comments
4. Create Storybook stories
5. Ensure accessibility features
6. Test on mobile and desktop

## Troubleshooting

### TypeScript Errors
Run type checker:
```bash
npm run type-check
```

### Styling Issues
- Ensure Tailwind CSS is configured
- Check that design tokens are imported
- Verify PostCSS configuration

### Storybook Issues
Clear cache and rebuild:
```bash
rm -rf node_modules/.cache
npm run storybook
```

## Next Steps

1. **Explore Components** - Run Storybook and interact with components
2. **Integrate** - Add to your project and use components
3. **Customize** - Extend or modify tokens and styles as needed
4. **Contribute** - Add new components following guidelines

## Support

For issues or questions:
1. Check README.md for component documentation
2. Review CONTRIBUTING.md for standards
3. Check existing components for examples
4. Refer to design tokens for available values

## File Manifest

Complete list of 35 files:
- 9 token JSON files
- 14 component TSX files
- 6 configuration files
- 3 documentation files
- 2 utility files
- 1 global style file
- 1 export file

See `FILE_MANIFEST.md` for detailed listing.
