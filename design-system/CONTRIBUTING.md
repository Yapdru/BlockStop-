# Contributing to BlockStop Design System

Thank you for contributing to the BlockStop Design System! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the work, not the person
- Help others learn and grow

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Create a feature branch (`git checkout -b feature/component-name`)
4. Make your changes
5. Test your changes thoroughly
6. Push to your fork
7. Create a pull request

## Development Setup

```bash
npm install
npm run dev       # Start development server
npm run storybook # View components in Storybook
npm run test      # Run tests
npm run lint      # Lint code
```

## Adding a New Component

### 1. Component File Structure

Create a new component file in `components/` following this pattern:

```tsx
import React from 'react';
import { cn } from '../utils/cn';

/**
 * Component description and usage
 */
interface ComponentProps {
  // Props definition
}

/**
 * Component Component
 *
 * Brief description of what the component does.
 * Include key features and use cases.
 *
 * @example
 * ```tsx
 * <Component prop="value">Content</Component>
 * ```
 */
export const Component = React.forwardRef<HTMLElement, ComponentProps>(
  (props, ref) => {
    // Implementation
    return <div>Component</div>;
  }
);

Component.displayName = 'Component';
```

### 2. TypeScript Types

- Use proper TypeScript interfaces for all props
- Extend HTML attributes when appropriate
- Document all props with JSDoc comments
- Use discriminated unions for variant patterns

### 3. Accessibility Requirements

Every component must:

- [ ] Use semantic HTML elements
- [ ] Include proper ARIA labels and roles
- [ ] Support keyboard navigation
- [ ] Have proper focus management
- [ ] Pass WCAG 2.1 AA color contrast tests
- [ ] Work with screen readers
- [ ] Not trap keyboard focus

Example:

```tsx
<button
  aria-label="Close modal"
  aria-disabled={disabled}
  role="button"
/>
```

### 4. Styling Guidelines

- Use Tailwind CSS utility classes
- Reference design tokens from `tokens/` JSON files
- Create responsive designs with breakpoint prefixes
- Use semantic color tokens (primary, success, error, etc.)
- Maintain consistent spacing using the 12pt scale
- Add smooth transitions for interactive elements

```tsx
const baseStyles = 'px-4 py-2 rounded-md transition-colors duration-200';
const variantStyles = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700',
  secondary: 'bg-secondary-600 text-white hover:bg-secondary-700',
};
```

### 5. Documentation

- Write clear JSDoc comments for components
- Include `@example` sections showing usage
- Document all props, states, and callbacks
- Explain complex logic with inline comments
- Keep comments up-to-date with code changes

### 6. Storybook Stories

Create a `.stories.tsx` file for your component:

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { ComponentName } from './ComponentName';

const meta: Meta<typeof ComponentName> = {
  component: ComponentName,
  title: 'Components/ComponentName',
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // Default props
  },
};

export const Variant: Story = {
  args: {
    // Variant props
  },
};
```

## Component Checklist

Before submitting a PR, ensure:

- [ ] Component passes TypeScript checks
- [ ] All props are typed and documented
- [ ] Component is exported from `index.ts`
- [ ] Storybook stories are created
- [ ] Component has proper accessibility features
- [ ] Code follows naming conventions
- [ ] Comments are clear and helpful
- [ ] No console warnings or errors
- [ ] Component works on mobile and desktop
- [ ] Component uses design tokens consistently

## Code Style

### Naming Conventions

- **Components**: PascalCase (`Button`, `InputField`)
- **Files**: PascalCase matching component name
- **Props**: camelCase
- **Types**: PascalCase with `Props` suffix
- **Functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE for magic numbers, camelCase otherwise

### File Organization

```
components/
├── ComponentName.tsx      # Main component
├── ComponentName.stories.tsx  # Storybook stories
└── ComponentName.test.tsx # Tests
```

### Import Order

1. React imports
2. Third-party packages
3. Relative imports (utils, types)

```tsx
import React from 'react';
import type { ReactNode } from 'react';

import { cn } from '../utils/cn';
import type { CustomType } from '../types/types';
```

## Testing Requirements

- Write tests for all new functionality
- Test accessibility features
- Test edge cases and error states
- Test responsive behavior
- Aim for >80% code coverage

## Performance Guidelines

- Avoid unnecessary re-renders
- Use `React.forwardRef` for components that need ref access
- Memoize expensive computations
- Lazy load heavy dependencies
- Keep bundle size minimal

## Browser Compatibility

Ensure components work in:

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile Safari
- Chrome Mobile

## Design Token Usage

When adding new styles, update the relevant token file:

- New colors → `tokens/colors.json`
- New sizes → `tokens/typography.json` or `tokens/spacing.json`
- New shadows → `tokens/shadows.json`
- New animations → `tokens/animations.json`

Update `tailwind.config.ts` to extend the config with new tokens.

## PR Description Template

```markdown
## Description
Brief description of changes

## Type
- [ ] New Component
- [ ] Bug Fix
- [ ] Enhancement
- [ ] Documentation

## Related Issues
Closes #123

## Testing
How to test these changes

## Screenshots
If applicable

## Checklist
- [ ] TypeScript checks pass
- [ ] Accessibility tested
- [ ] Storybook stories added
- [ ] Documentation updated
```

## Review Process

1. Code review by team members
2. Accessibility review
3. Design review
4. Testing verification
5. Merge to main branch

## Questions?

- Check existing components for examples
- Review Storybook documentation
- Look at design token files
- Ask in team discussions

Thank you for contributing!
