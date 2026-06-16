# BlockStop Design System

A comprehensive, production-grade design system and component library built with React, TypeScript, and Tailwind CSS.

## Features

- **14 Production-Ready Components** - Button, Input, Card, Alert, Modal, Badge, Checkbox, RadioGroup, Select, Textarea, Tooltip, Skeleton, Spinner, and Progress components
- **Design Tokens** - Centralized, consistent design tokens for colors, typography, spacing, shadows, animations, and more
- **Accessibility First** - All components built with ARIA labels, semantic HTML, and keyboard navigation support
- **TypeScript Support** - Full TypeScript support with comprehensive prop interfaces
- **Tailwind CSS Integration** - Pre-configured Tailwind setup with design tokens
- **Storybook Integration** - Component documentation and testing with Storybook

## Installation

```bash
npm install @blockstop/design-system
# or
yarn add @blockstop/design-system
# or
pnpm add @blockstop/design-system
```

## Quick Start

```tsx
import { Button, Input, Card } from '@blockstop/design-system';

export function App() {
  return (
    <Card variant="elevated" padding="lg">
      <h1>Welcome to BlockStop</h1>
      <Input type="email" label="Email" placeholder="you@example.com" />
      <Button variant="primary">Get Started</Button>
    </Card>
  );
}
```

## Components

### Form Components

#### Button
A versatile button component with multiple variants and sizes.

```tsx
<Button variant="primary" size="md">Click me</Button>
<Button variant="danger" disabled>Delete</Button>
<Button isLoading loadingText="Saving...">Save</Button>
```

**Variants**: `primary`, `secondary`, `ghost`, `danger`
**Sizes**: `sm`, `md`, `lg`

#### Input
A flexible input component with validation states and helper text.

```tsx
<Input type="email" label="Email" placeholder="you@example.com" />
<Input type="password" validationState="error" errorMessage="Password too short" />
<Input isRequired fullWidth />
```

**Types**: `text`, `email`, `password`, `number`, `tel`, `url`
**Validation States**: `default`, `success`, `error`, `warning`

#### Textarea
A multi-line text input with optional character counter.

```tsx
<Textarea label="Message" placeholder="Enter your message..." showCounter maxLength={500} />
```

#### Select
A dropdown select component with search support.

```tsx
<Select
  label="Choose an option"
  options={[
    { value: 'opt1', label: 'Option 1' },
    { value: 'opt2', label: 'Option 2' },
  ]}
  placeholder="Select an option"
/>
```

#### Checkbox
An accessible checkbox component with indeterminate state support.

```tsx
<Checkbox label="I agree to the terms" />
<Checkbox isIndeterminate label="Select all" />
```

#### RadioGroup
A group of radio buttons for single selection.

```tsx
<RadioGroup
  name="options"
  options={[
    { value: 'opt1', label: 'Option 1' },
    { value: 'opt2', label: 'Option 2' },
  ]}
  value={selected}
  onChange={setSelected}
/>
```

### Layout Components

#### Card
A container component with multiple variants.

```tsx
<Card variant="elevated" padding="lg">
  <CardHeader>Title</CardHeader>
  <CardBody>Content</CardBody>
  <CardFooter>Footer</CardFooter>
</Card>
```

**Variants**: `elevated`, `flat`, `outline`
**Padding**: `sm`, `md`, `lg`

#### Modal
A flexible modal/dialog component with animations.

```tsx
const [isOpen, setIsOpen] = useState(false);
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
>
  <p>Are you sure?</p>
  <ModalFooter>
    <Button onClick={() => setIsOpen(false)}>Cancel</Button>
    <Button variant="danger">Delete</Button>
  </ModalFooter>
</Modal>
```

### Feedback Components

#### Alert
A notification component for displaying messages with severity levels.

```tsx
<Alert severity="success" title="Success" isCloseable>
  Your changes have been saved.
</Alert>
```

**Severities**: `info`, `success`, `warning`, `error`

#### Badge
A small label component for status and categories.

```tsx
<Badge variant="success">Active</Badge>
<Badge variant="error" isRemovable onRemove={handleRemove}>Archived</Badge>
```

**Variants**: `default`, `primary`, `secondary`, `success`, `warning`, `error`

#### Spinner
An animated loading indicator.

```tsx
<Spinner size="md" />
<Spinner size="lg" color="primary" label="Loading data..." />
```

**Sizes**: `sm`, `md`, `lg`, `xl`
**Colors**: `primary`, `secondary`, `white`

#### Skeleton
A loading placeholder component.

```tsx
<Skeleton variant="text" lines={3} />
<Skeleton variant="circle" width={40} height={40} />
<Skeleton variant="rectangle" width="100%" height={200} />
```

### Utility Components

#### Tooltip
A positioned tooltip for helpful information.

```tsx
<Tooltip content="Click to save" position="top">
  <button>Save</button>
</Tooltip>
```

**Positions**: `top`, `bottom`, `left`, `right`

#### Progress
Linear and circular progress indicators.

```tsx
<LinearProgress value={65} variant="primary" showLabel />
<CircularProgress value={75} size={100} showLabel />
```

## Design Tokens

All design tokens are available in the `tokens/` directory:

- **colors.json** - Primary, secondary, success, warning, error, and neutral color palettes
- **typography.json** - Font families (Geist, JetBrains Mono), sizes, weights, line heights
- **spacing.json** - 12pt scale spacing system (0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96)
- **shadows.json** - Elevation system (sm, md, lg, xl, 2xl)
- **animations.json** - Durations, easing functions, and keyframes
- **breakpoints.json** - Responsive breakpoints (xs: 320, sm: 640, md: 1024, lg: 1280, xl: 1536)
- **border-radius.json** - Border radius tokens
- **z-index.json** - Layering system
- **opacity.json** - Transparency levels

## Tailwind CSS Configuration

The design system includes a pre-configured `tailwind.config.ts` that extends Tailwind with all design tokens:

```ts
import config from '@blockstop/design-system/tailwind.config';

export default config;
```

## Accessibility

All components are built with accessibility as a first-class concern:

- **Semantic HTML** - Uses appropriate HTML elements
- **ARIA Labels** - Includes proper ARIA attributes
- **Keyboard Navigation** - Full keyboard support
- **Focus Management** - Proper focus indicators
- **Color Contrast** - Meets WCAG AA standards
- **Screen Reader Support** - Tested with screen readers

## Storybook

View component stories and documentation:

```bash
npm run storybook
```

Stories are located in `components/**/*.stories.tsx`

## Development

### Project Structure

```
design-system/
├── tokens/              # Design tokens (colors, spacing, etc.)
├── components/          # React components
├── utils/              # Utility functions
├── .storybook/         # Storybook configuration
├── tailwind.config.ts  # Tailwind configuration
├── index.ts            # Main export file
└── README.md          # This file
```

### Adding a New Component

1. Create component file in `components/`
2. Export from `index.ts`
3. Add TypeScript types
4. Include JSDoc documentation
5. Ensure ARIA labels and semantic HTML
6. Create Storybook stories for documentation

## Typography

The design system uses two font families:

- **Geist** - Primary sans-serif font for UI
- **JetBrains Mono** - Monospace font for code

Font sizes range from `xs` (12px) to `4xl` (36px) with corresponding line heights.

## Color Palette

All colors are available in 10 shades (50-950):

- **Primary**: Blue
- **Secondary**: Purple
- **Success**: Green
- **Warning**: Yellow
- **Error**: Red
- **Neutral**: Gray

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## License

Proprietary - BlockStop Inc.

## Contributing

Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.
