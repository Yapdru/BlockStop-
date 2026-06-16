# BlockStop UX/UI Redesign - Developer Quick Start Guide

**Phase 11 Implementation**  
**Generated:** 2026-06-16

---

## 📌 Quick Reference

### Essential Commands

```bash
# Development
npm run dev              # Start Next.js dev server
npm run dev:mobile      # Start React Native dev server
npm run storybook       # Start Storybook on port 6006

# Testing
npm run test            # Run unit/component tests
npm run test:watch      # Run tests in watch mode
npm run test:e2e        # Run E2E tests with Cypress
npm run test:a11y       # Run accessibility tests
npm run test:coverage   # Generate coverage report

# Building
npm run build           # Build for production
npm run build:mobile    # Build React Native
npm run build:desktop   # Build Electron app
npm run build:extension # Build browser extension

# Linting & Formatting
npm run lint            # Run ESLint
npm run format          # Run Prettier
npm run type-check      # Check TypeScript

# Performance
npm run analyze:bundle  # Analyze bundle size
npm run audit:perf      # Run performance audit
```

---

## 🎨 Component Library Basics

### Importing Components

```typescript
// From design system
import { Button, Input, Card, Modal } from '@/design-system'

// Individual imports for better tree-shaking
import Button from '@/design-system/components/Button'
import Input from '@/design-system/components/Input'
```

### Using Design Tokens

```typescript
// Import design tokens
import colors from '@/design-system/tokens/colors.json'
import spacing from '@/design-system/tokens/spacing.json'
import typography from '@/design-system/tokens/typography.json'

// Use in components
const styles = {
  color: colors.primary[500],
  padding: spacing[4],
  fontSize: typography.sizes.base
}
```

### Component Examples

```typescript
// Button
<Button variant="primary" size="md" onClick={handleClick}>
  Click Me
</Button>

// Input with validation
<Input
  type="email"
  label="Email"
  placeholder="user@example.com"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={emailError}
  helperText="Enter a valid email"
/>

// Card
<Card variant="elevated" className="p-4">
  <Card.Header>
    <h2>Card Title</h2>
  </Card.Header>
  <Card.Body>
    Card content here
  </Card.Body>
</Card>

// Modal
<Modal isOpen={isOpen} onClose={onClose}>
  <Modal.Header>Modal Title</Modal.Header>
  <Modal.Body>Modal content</Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={onClose}>Cancel</Button>
    <Button variant="primary" onClick={handleSubmit}>Confirm</Button>
  </Modal.Footer>
</Modal>
```

---

## 🌈 Dark Mode Implementation

### Theme Provider Setup

```typescript
// In app/layout.tsx
import { ThemeProvider } from '@/app/providers/ThemeProvider'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### Using Theme in Components

```typescript
import { useTheme } from '@/app/hooks/useTheme'

export function MyComponent() {
  const { theme, toggleTheme, isDark } = useTheme()

  return (
    <div className={isDark ? 'dark' : 'light'}>
      <button onClick={toggleTheme}>
        Switch to {isDark ? 'light' : 'dark'} mode
      </button>
    </div>
  )
}
```

### Tailwind Dark Mode

```typescript
// Tailwind automatically handles dark mode
// Use dark: prefix for dark mode styles
<div className="bg-white dark:bg-gray-900 text-black dark:text-white">
  Content adapts to theme
</div>
```

---

## 📱 Responsive Design

### Using Responsive Hooks

```typescript
import { useResponsive } from '@/app/hooks/useResponsive'

export function ResponsiveComponent() {
  const { isMobile, isTablet, isDesktop, breakpoint } = useResponsive()

  return (
    <>
      {isMobile && <MobileLayout />}
      {isTablet && <TabletLayout />}
      {isDesktop && <DesktopLayout />}
    </>
  )
}
```

### Tailwind Responsive Classes

```typescript
// Mobile-first approach
<div className="
  w-full md:w-1/2 lg:w-1/3 xl:w-1/4
  p-4 md:p-6 lg:p-8
  text-sm md:text-base lg:text-lg
  flex-col md:flex-row
">
  Responsive content
</div>
```

### Breakpoints

```typescript
// From design tokens
const breakpoints = {
  xs: 320,   // Mobile
  sm: 640,   // Tablet
  md: 1024,  // Desktop
  lg: 1280,  // Large
  xl: 1536,  // Extra large
  '2xl': 2560 // Ultra-wide
}
```

---

## ✨ Animations

### Using Animation Components

```typescript
import { FadeIn, SlideIn, BounceIn } from '@/app/components/animations'

// Fade in effect
<FadeIn duration={300}>
  <div>Content fades in</div>
</FadeIn>

// Slide in from left
<SlideIn direction="left" delay={200}>
  <div>Content slides in</div>
</SlideIn>

// Bounce effect
<BounceIn>
  <div>Content bounces in</div>
</BounceIn>
```

### Using Framer Motion

```typescript
import { motion } from 'framer-motion'

// Page transition
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.3 }}
>
  Page content
</motion.div>

// Stagger effect for lists
<motion.ul>
  {items.map((item, i) => (
    <motion.li
      key={i}
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: i * 0.1 }}
    >
      {item}
    </motion.li>
  ))}
</motion.ul>
```

---

## ♿ Accessibility

### ARIA Attributes

```typescript
// Buttons
<button aria-label="Close modal" onClick={onClose}>×</button>

// Form labels
<label htmlFor="email">Email Address</label>
<input id="email" type="email" aria-describedby="email-help" />
<span id="email-help">We'll never share your email.</span>

// Live regions
<div aria-live="polite" aria-atomic="true">
  {successMessage}
</div>

// Form validation
<input
  aria-invalid={hasError}
  aria-describedby={hasError ? 'error-message' : undefined}
/>
{hasError && <span id="error-message">{errorText}</span>}
```

### Keyboard Navigation

```typescript
// Use semantic HTML
<nav>
  <ul>
    <li><a href="/about">About</a></li>
    <li><a href="/contact">Contact</a></li>
  </ul>
</nav>

// Skip navigation link
<a href="#main-content" className="sr-only">
  Skip to main content
</a>
<main id="main-content">
  {children}
</main>
```

### Screen Reader Text

```typescript
import { srOnly } from '@/app/utils/a11y/screen-reader-utils'

<button>
  Download Report
  <span className={srOnly()}>
    (Opens in new window)
  </span>
</button>
```

---

## 📊 Data Visualization

### Using Charts

```typescript
import { LineChart, BarChart, PieChart } from '@/app/components/charts'

// Line chart
<LineChart
  data={data}
  xAxisKey="date"
  dataKeys={[
    { key: 'threats', stroke: '#ef4444' },
    { key: 'clean', stroke: '#10b981' }
  ]}
  title="Threat Trends"
/>

// Bar chart
<BarChart
  data={data}
  xAxisKey="category"
  dataKeys={['value1', 'value2']}
  isStacked={false}
/>

// Pie chart
<PieChart
  data={data}
  dataKey="value"
  nameKey="name"
  colors={['#3b82f6', '#ef4444', '#f59e0b']}
/>
```

### Exporting Data

```typescript
// DataTable component with export
<DataTable
  data={data}
  columns={columns}
  onExport={(format) => {
    // format: 'csv' | 'json' | 'pdf'
    exportData(data, format)
  }}
/>
```

---

## 🧪 Testing

### Component Tests

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('Button', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('should handle click events', async () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    await userEvent.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalled()
  })
})
```

### Accessibility Testing

```typescript
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

it('should not have accessibility violations', async () => {
  const { container } = render(<MyComponent />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

### E2E Testing with Cypress

```typescript
describe('Login Flow', () => {
  it('should log in user', () => {
    cy.visit('/login')
    cy.get('input[type=email]').type('user@example.com')
    cy.get('input[type=password]').type('password123')
    cy.get('button[type=submit]').click()
    cy.url().should('include', '/dashboard')
  })
})
```

---

## 📚 Storybook

### Creating Stories

```typescript
// components/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './Button'

const meta = {
  component: Button,
  tags: ['autodocs'],
  args: {
    children: 'Button',
    onClick: () => {}
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'danger']
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg']
    }
  }
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    variant: 'primary'
  }
}

export const Secondary: Story = {
  args: {
    variant: 'secondary'
  }
}

export const Large: Story = {
  args: {
    size: 'lg'
  }
}
```

### Viewing Stories

```bash
npm run storybook
# Open http://localhost:6006
```

---

## 📁 File Organization

### Page/Feature Structure

```
app/(features)/
└── feature-name/
    ├── page.tsx           # Main page component
    ├── layout.tsx         # Layout wrapper
    ├── components/        # Feature-specific components
    │   └── FeatureCard.tsx
    ├── hooks/             # Feature-specific hooks
    │   └── useFeature.ts
    ├── utils/             # Feature-specific utilities
    │   └── helpers.ts
    └── types.ts           # Feature-specific types
```

### Component Structure

```
design-system/components/
└── Button.tsx
    ├── Button component code
    ├── Props interface
    ├── Default export
    └── TypeScript types

Example structure:
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  icon?: React.ReactNode
}

export default function Button(props: ButtonProps) {
  // Implementation
}
```

---

## 🔄 Git Workflow

### Branch Naming

```bash
feature/component-name      # New component
fix/bug-description         # Bug fix
refactor/improvement        # Refactoring
docs/documentation-update   # Documentation
test/test-coverage          # Test additions
```

### Commit Message Format

```
type(scope): subject

Body with detailed explanation

Closes #123
```

### Examples

```bash
git commit -m "feat(button): add loading state

- Add isLoading prop to Button component
- Display spinner when loading
- Disable button interactions during loading

Closes #456"

git commit -m "fix(modal): fix focus trap not working

- Fix focus trap initialization
- Add proper cleanup
- Test with keyboard navigation"
```

---

## ⚙️ Configuration Files

### Important Config Files

- **`tailwind.config.ts`** - Tailwind CSS configuration with design tokens
- **`tsconfig.json`** - TypeScript configuration
- **`next.config.js`** - Next.js configuration
- **`jest.config.js`** - Jest testing configuration
- **`cypress.config.ts`** - Cypress E2E configuration
- **`.eslintrc.json`** - ESLint rules
- **`.prettierrc`** - Prettier formatting rules

### Environment Variables

Create `.env.local`:

```bash
# API
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Database
DATABASE_URL=postgresql://...

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Third-party services
STRIPE_KEY=sk_...
SENDGRID_API_KEY=SG...
```

---

## 🚀 Performance Best Practices

### Image Optimization

```typescript
import Image from 'next/image'

// Use Next.js Image component
<Image
  src="/image.jpg"
  alt="Description"
  width={400}
  height={300}
  placeholder="blur"
  loading="lazy"
/>
```

### Code Splitting

```typescript
// Dynamic imports
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(
  () => import('@/components/HeavyComponent'),
  { loading: () => <div>Loading...</div> }
)
```

### Memoization

```typescript
import { memo, useMemo, useCallback } from 'react'

// Memoize component
const Button = memo(function Button(props) {
  return <button {...props} />
})

// Memoize values
const computedValue = useMemo(() => {
  return expensiveComputation()
}, [dependencies])

// Memoize callbacks
const handleClick = useCallback(() => {
  doSomething()
}, [dependencies])
```

---

## 🛠️ Troubleshooting

### Common Issues

**Issue: Dark mode not applying**
- Ensure ThemeProvider wraps your app
- Check `tailwind.config.ts` has dark mode enabled
- Verify CSS variables are defined

**Issue: Components not importing correctly**
- Check `design-system/index.ts` exports
- Verify TypeScript paths in `tsconfig.json`
- Clear Next.js cache: `rm -rf .next`

**Issue: Tests failing**
- Check test setup in `tests/setup.ts`
- Verify jest configuration matches
- Run `npm install` to ensure dependencies

**Issue: Performance slow**
- Run `npm run analyze:bundle`
- Check for missing lazy loading
- Verify images are optimized
- Review Web Vitals in browser DevTools

---

## 📖 Resources

### Documentation Files
- `PHASE_11_UX_UI_REDESIGN_SUMMARY.md` - Complete project overview
- `UX_UI_REDESIGN_INDEX.md` - File navigation guide
- `docs/COMPONENT_GUIDE.md` - Component usage examples
- `docs/DESIGN_SYSTEM.md` - Design system tokens
- `docs/CONTRIBUTING.md` - Contributing guidelines

### External Resources
- [React Documentation](https://react.dev)
- [Next.js Documentation](https://nextjs.org)
- [Tailwind CSS](https://tailwindcss.com)
- [Storybook](https://storybook.js.org)
- [Framer Motion](https://www.framer.com/motion)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref)

---

## 💡 Tips & Tricks

### VSCode Extensions (Recommended)
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Vue Plugin
- Storybook

### Keyboard Shortcuts
- `Ctrl/Cmd + Shift + P` - Command palette
- `Ctrl/Cmd + /` - Toggle comment
- `Alt + Shift + F` - Format document
- `Ctrl/Cmd + K Ctrl/Cmd + X` - Trim whitespace

### Debugging
```typescript
// Use console for debugging
console.log('Debug:', value)

// Use React DevTools extension
// Use Next.js DevTools

// Use Storybook for component isolation
npm run storybook
```

---

## 🎓 Learning Path

1. **Start Here:** Review `PHASE_11_UX_UI_REDESIGN_SUMMARY.md`
2. **Component Library:** Explore `design-system/components/`
3. **Design Tokens:** Check `design-system/tokens/`
4. **Web Pages:** Review `app/(features)/` pages
5. **Storybook:** Run `npm run storybook`
6. **Tests:** Review test files in `tests/`
7. **Mobile:** Explore React Native in `mobile/`
8. **Contributing:** Follow `docs/CONTRIBUTING.md`

---

**Happy Coding! 🚀**

For questions or help, refer to the comprehensive documentation or reach out to the BlockStop team.

Generated: 2026-06-16  
Phase: 11 - UX/UI Redesign & Experience Enhancement
