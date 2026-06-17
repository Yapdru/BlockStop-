# WCAG 2.1 Level AAA Compliance Checklist

This document provides a comprehensive checklist for WCAG 2.1 Level AAA compliance implementation in the BlockStop application.

## Table of Contents

1. [Perceivable](#perceivable)
2. [Operable](#operable)
3. [Understandable](#understandable)
4. [Robust](#robust)
5. [Testing Procedures](#testing-procedures)
6. [Resources](#resources)

---

## Perceivable

Guidelines for making content perceivable to all users.

### 1.1 Text Alternatives

- [ ] **1.1.1 Non-text Content (Level A)**
  - All images have descriptive alt text
  - Decorative images have empty alt attributes (`alt=""`)
  - Complex images use aria-describedby with longer descriptions
  - Use `<figcaption>` for image captions
  - Testing: Screen reader verification with NVDA/JAWS

- [ ] **1.1.2 (Level AAA)**
  - Extended descriptions for complex images
  - Audio descriptions for video content
  - Text transcripts for audio-only content
  - Use `<figure>` and `<figcaption>` semantically

### 1.2 Time-based Media

- [ ] **1.2.1 Audio-only and Video-only (Pre-recorded) (Level A)**
  - Captions provided for video
  - Audio descriptions for video
  - Text transcript for audio-only content

- [ ] **1.2.2 Captions (Pre-recorded) (Level A)**
  - Synchronized captions for all video content
  - Captions include speaker identification
  - Captions include sound descriptions

- [ ] **1.2.3 Audio Description or Media Alternative (Pre-recorded) (Level A)**
  - Audio descriptions synchronized with video
  - Transcript of video with descriptions

- [ ] **1.2.5 Audio Description (Pre-recorded) (Level AAA)**
  - Detailed audio descriptions for all video

### 1.3 Adaptable

- [ ] **1.3.1 Info and Relationships (Level A)**
  - Semantic HTML structure maintained
  - Heading hierarchy: one H1, h2-h6 in order
  - No skipped heading levels
  - Form labels properly associated with inputs
  - List items use `<ul>`, `<ol>`, `<li>`
  - Table structure: `<thead>`, `<tbody>`, `<tfoot>`
  - Table headers use `scope` attribute

- [ ] **1.3.2 Meaningful Sequence (Level A)**
  - Content order matches visual order
  - Tab order follows logical flow
  - No hidden content in wrong visual order

- [ ] **1.3.3 Sensory Characteristics (Level A)**
  - Instructions don't rely on shape alone (not "click the red button")
  - Instructions don't rely on color alone
  - Instructions don't rely on sound alone
  - Use text labels with color coding
  - Use aria-label for shape-only indicators

- [ ] **1.3.4 Orientation (Level AAA)**
  - Content not restricted to single orientation
  - Portrait and landscape modes supported
  - No rotation lock unless essential

- [ ] **1.3.5 Identify Input Purpose (Level AAA)**
  - Form inputs have clear, programmatically-determined purpose
  - Use autocomplete attribute for common fields
  - Use proper input types (email, tel, number, etc.)

- [ ] **1.3.6 Identify Purpose (Level AAA)**
  - Buttons, links, form fields have clear visible labels
  - Icons supplemented with text labels
  - Purpose determinable from context

### 1.4 Distinguishable

- [ ] **1.4.1 Use of Color (Level A)**
  - Color not used as only means of conveying information
  - Sufficient contrast between adjacent colors
  - Use patterns, text, or icons in addition to color

- [ ] **1.4.2 Audio Control (Level A)**
  - Auto-playing audio can be paused/stopped
  - Volume controllable independent of system volume

- [ ] **1.4.3 Contrast (Minimum) (Level AA)**
  - Normal text: 4.5:1 contrast ratio
  - Large text (18pt+ or 14pt+ bold): 3:1 contrast ratio
  - Graphical elements: 3:1 contrast ratio
  - Testing: Use WebAIM Contrast Checker

- [ ] **1.4.4 Resize Text (Level AA)**
  - Text can be resized up to 200% without loss of functionality
  - No horizontal scrolling at 200% zoom
  - Content remains readable and usable

- [ ] **1.4.5 Images of Text (Level AA)**
  - Text not rendered as images (except logos)
  - Actual text used instead of text images
  - Benefits: resizable, searchable, selectable

- [ ] **1.4.11 Non-text Contrast (Level AAA)**
  - 7:1 contrast ratio for all text (normal and large)
  - 3:1 contrast ratio for UI components and graphics
  - Use `color-contrast.ts` utilities for validation

- [ ] **1.4.13 Content on Hover or Focus (Level AAA)**
  - Hoverable/focusable content doesn't obscure other content
  - Keyboard dismissible (Escape key)
  - Persistent until interaction dismissed
  - Hoverable without moving mouse

---

## Operable

Guidelines for making content operable with various input methods.

### 2.1 Keyboard Accessible

- [ ] **2.1.1 Keyboard (Level A)**
  - All functionality accessible via keyboard
  - No keyboard trap (except modals with focus trap)
  - Use Tab, Shift+Tab for navigation
  - Use Enter/Space for activation
  - Use Escape to close dialogs/modals
  - Use arrow keys for menus and lists
  - Testing: Keyboard-only navigation

- [ ] **2.1.2 No Keyboard Trap (Level A)**
  - Focus can move away from components
  - Exception: Modal dialogs with proper focus trap
  - Focus trap must allow Escape key to exit
  - Use `FocusTrap.tsx` component for modals

- [ ] **2.1.3 Keyboard (No Exception) (Level AAA)**
  - All content operable by keyboard
  - No exceptions except inherent limitations

- [ ] **2.1.4 Character Key Shortcuts (Level A)**
  - Keyboard shortcuts don't use single characters
  - Or: Shortcut can be disabled or remapped
  - Or: Only active when component has focus
  - Use modifiers (Ctrl/Cmd/Alt) with single keys

### 2.2 Enough Time

- [ ] **2.2.1 Timing Adjustable (Level A)**
  - No auto-advancing content (or user can disable)
  - Sessions don't expire automatically
  - Or: Warning before session ends with option to extend
  - Or: User can request more time before expiring

- [ ] **2.2.2 Pause, Stop, Hide (Level A)**
  - Auto-play content can be paused/stopped
  - Auto-updating content can be paused/stopped
  - Blinking/scrolling content limited to < 5 seconds

- [ ] **2.2.3 No Timing (Level AAA)**
  - No time limits on completing tasks
  - Exception: Real-time events (auctions)

- [ ] **2.2.6 Timeouts (Level AAA)**
  - Warn user before session timeout
  - Option to extend session
  - At least 20 second warning

### 2.3 Seizures and Physical Reactions

- [ ] **2.3.1 Three Flashes or Below Threshold (Level A)**
  - No content flashes more than 3 times per second
  - Or: Flash area is small enough (< 25% viewport)
  - Testing: Photosensitive Epilepsy Analysis Tool (PEAT)

- [ ] **2.3.2 Three Flashes (Level AAA)**
  - No content flashes more than 3 times per second

- [ ] **2.3.3 Animation from Interactions (Level AAA)**
  - Animation can be disabled via prefers-reduced-motion
  - Use `@media (prefers-reduced-motion: reduce)` in CSS

### 2.4 Navigable

- [ ] **2.4.1 Bypass Blocks (Level A)**
  - Skip to main content link provided
  - Skip links appear on first Tab
  - Use `SkipNavigation.tsx` component
  - Announce when skip link activated

- [ ] **2.4.2 Page Titled (Level A)**
  - Each page has descriptive title
  - Title describes page purpose or content
  - Testing: Check `<title>` element

- [ ] **2.4.3 Focus Order (Level A)**
  - Focus order is meaningful and logical
  - Tab order matches visual order
  - Focus order based on DOM order
  - Use tabindex sparingly (only -1 or 0)

- [ ] **2.4.4 Link Purpose (In Context) (Level A)**
  - Link purpose determined from link text alone
  - Or: From link text + surrounding context
  - Avoid generic link text ("click here", "read more")
  - Descriptive link text (e.g., "Learn more about pricing")

- [ ] **2.4.5 Multiple Ways (Level AA)**
  - More than one way to find pages:
    - Search function
    - Navigation menu
    - Sitemap
    - Table of contents
    - Index of information

- [ ] **2.4.7 Focus Visible (Level AA)**
  - Focus indicator visible for keyboard navigation
  - Minimum 3px outline or 2px border
  - Contrast ratio of 3:1 with adjacent colors
  - Use CSS `:focus-visible` pseudo-class
  - Testing: Keyboard Tab navigation

- [ ] **2.4.8 Focus Visible (Enhanced) (Level AAA)**
  - Very visible focus indicator
  - Minimum 3px visible width
  - High contrast (7:1 preferred)

- [ ] **2.4.9 Link Purpose (Link Only) (Level AAA)**
  - Link purpose determined from link text alone
  - No reliance on surrounding context

---

## Understandable

Guidelines for making content understandable to all users.

### 3.1 Readable

- [ ] **3.1.1 Language of Page (Level A)**
  - Page language specified in HTML: `<html lang="en">`
  - Language code follows RFC 5646 format

- [ ] **3.1.2 Language of Parts (Level AA)**
  - Content in different languages marked with `lang` attribute
  - Example: `<span lang="es">Hola</span>`

- [ ] **3.1.3 Unusual Words (Level AAA)**
  - Definition or expansion for unusual words
  - Abbreviations expanded on first use
  - Use `<abbr>` for abbreviations

- [ ] **3.1.4 Abbreviations (Level AAA)**
  - Abbreviations expanded on first use
  - Use `<abbr title="Full Term">ABBR</abbr>`

- [ ] **3.1.5 Reading Level (Level AAA)**
  - Content written for age 14+ reading level
  - Or: Supplemental content for complex material
  - Use plain language
  - Short sentences and paragraphs

- [ ] **3.1.6 Pronunciation (Level AAA)**
  - Pronunciation available for words with ambiguous pronunciation
  - Use ruby annotations or phonetic spelling
  - Context or definition can clarify pronunciation

### 3.2 Predictable

- [ ] **3.2.1 On Focus (Level A)**
  - No unexpected changes when element receives focus
  - No context switches
  - No form submissions
  - No dialogs opening (except expected)

- [ ] **3.2.2 On Input (Level A)**
  - No unexpected context change on input
  - Or: User warned before change occurs
  - Use aria-live="polite" for notifications

- [ ] **3.2.3 Consistent Navigation (Level AA)**
  - Navigation menus in consistent location
  - Navigation menus in consistent order
  - Relative links work consistently

- [ ] **3.2.4 Consistent Identification (Level AA)**
  - Components with same functionality identified consistently
  - Same labels for same functionality
  - Same icons for same functionality
  - Consistency across application

- [ ] **3.2.5 Change on Request (Level AAA)**
  - Significant changes only on explicit user request
  - Provide clear mechanism to request change
  - Warn user before significant change

### 3.3 Input Assistance

- [ ] **3.3.1 Error Identification (Level A)**
  - Errors clearly identified
  - Error location clearly identified
  - Error description clearly stated
  - Use aria-invalid and aria-describedby

- [ ] **3.3.2 Labels or Instructions (Level A)**
  - Labels or instructions provided for inputs
  - Labels clearly associated with inputs
  - Required fields marked as required
  - Format requirements specified

- [ ] **3.3.3 Error Suggestion (Level AA)**
  - Suggestions provided for correction of errors
  - Suggestions placed before input
  - Focus moved to field with error

- [ ] **3.3.4 Error Prevention (Legal, Financial, Data) (Level AA)**
  - Submission reviewed before completion
  - Ability to correct errors before completion
  - Confirmation for legal/financial transactions
  - Option to reverse submitted data

- [ ] **3.3.5 Help (Level AAA)**
  - Help available for all inputs
  - Help accessible via F1 or inline links
  - Help text in plain language
  - Example values provided

- [ ] **3.3.6 Error Prevention (All) (Level AAA)**
  - Submissions are reversible, or
  - Data is checked for errors and confirmation provided, or
  - Confirmation required for legal/financial transactions

---

## Robust

Guidelines for maximizing compatibility with assistive technologies.

### 4.1 Compatible

- [ ] **4.1.1 Parsing (Level A)**
  - Valid HTML according to HTML spec
  - Use HTML validator (validator.w3.org)
  - No duplicate IDs
  - Proper nesting of elements
  - Complete start and end tags

- [ ] **4.1.2 Name, Role, Value (Level A)**
  - All components have accessible name
  - All components have accessible role
  - All components expose state/value
  - Use ARIA for custom components
  - Use semantic HTML elements

- [ ] **4.1.3 Status Messages (Level AA)**
  - Status messages announced to screen readers
  - Use aria-live for status announcements
  - Use aria-live="assertive" for errors
  - Use aria-live="polite" for general updates
  - Use `AriaLiveRegion.tsx` component

- [ ] **4.1.4 Status Messages (Level AAA)**
  - Status messages programmatically determined
  - Announced to screen readers without changing focus
  - Important status messages use assertive announcement

---

## Testing Procedures

### Manual Testing

1. **Keyboard Navigation**
   - Navigate entire site using only keyboard
   - Tab through all interactive elements
   - Ensure logical tab order
   - Verify focus visible indicators
   - Test Escape key in modals

2. **Screen Reader Testing**
   - Test with NVDA (Windows, free)
   - Test with JAWS (Windows, paid)
   - Test with VoiceOver (macOS/iOS, built-in)
   - Verify all headings, labels, alt text
   - Verify live region announcements
   - Verify form error messages

3. **Color Contrast**
   - Use WebAIM Contrast Checker
   - Use Axe DevTools browser extension
   - Verify 7:1 ratio for normal text
   - Verify 4.5:1 ratio for large text
   - Test links and UI components

4. **Zoom Testing**
   - Zoom to 200% in browser
   - Verify no horizontal scrolling
   - Verify content remains readable
   - Verify focus indicators visible

### Automated Testing

- Use Axe DevTools for automated scanning
- Use WebAIM WAVE for visual feedback
- Use Lighthouse accessibility audit
- Use Pa11y for continuous integration
- Use jest-axe for testing React components

### Browser Testing

- Chrome with Axe DevTools
- Firefox with WAVE
- Safari with Accessibility Inspector
- Edge with Accessibility Checker

---

## Implementation Utilities

The BlockStop application includes the following accessibility utilities:

### ARIA Labels (`aria-labels.ts`)
- ARIA label constants and builders
- Label and description helpers
- Validation and state utilities

### Keyboard Shortcuts (`keyboard-shortcuts.ts`)
- Keyboard shortcut definitions
- Shortcut registry and handlers
- React hooks for shortcuts

### Focus Management (`focus-management.ts`)
- Focus trap for modals
- Focus restoration
- Focusable element queries
- React hooks for focus

### Color Contrast (`color-contrast.ts`)
- Color parsing and validation
- Contrast ratio calculation
- WCAG level checking
- Color suggestion utilities

### Screen Reader (`screen-reader-utils.ts`)
- Live region announcer
- Accessible announcements
- Screen reader text helpers
- Accessible description creation

### Components

1. **SkipNavigation** (`SkipNavigation.tsx`)
   - Skip to main content link
   - Auto-hides until first Tab
   - Keyboard accessible

2. **FocusTrap** (`FocusTrap.tsx`)
   - Focus trapping for modals
   - Modal component with built-in focus trap
   - Custom hooks for focus management

3. **AriaLiveRegion** (`AriaLiveRegion.tsx`)
   - Live region announcements
   - Status messages
   - Progress announcements
   - Search results announcements

4. **SemanticHTML** (`SemanticHTML.tsx`)
   - Semantic HTML patterns
   - Best practices examples
   - Reference guide

---

## Common Issues and Fixes

### Issue: Missing Alt Text
**Solution**: Add descriptive alt text to all images
```jsx
<img src="product.jpg" alt="Blue widget product" />
```

### Issue: No Focus Indicator
**Solution**: Add visible focus outline
```css
button:focus-visible {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}
```

### Issue: Form Labels Not Associated
**Solution**: Use htmlFor attribute
```jsx
<label htmlFor="email">Email</label>
<input id="email" type="email" />
```

### Issue: Non-semantic HTML
**Solution**: Use semantic elements
```jsx
// Wrong
<div className="button" onClick={handler}>Click me</div>

// Right
<button onClick={handler}>Click me</button>
```

### Issue: Poor Color Contrast
**Solution**: Use WebAIM Contrast Checker, increase contrast
```css
color: #000; /* Higher contrast with white background */
background-color: #fff;
```

---

## Resources

### Official Standards
- [WCAG 2.1 Standard](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [HTML Specification](https://html.spec.whatwg.org/)

### Testing Tools
- [Axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE by WebAIM](https://wave.webaim.org/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Pa11y](https://pa11y.org/)

### Screen Readers
- [NVDA (Windows)](https://www.nvaccess.org/)
- [JAWS (Windows)](https://www.freedomscientific.com/products/software/jaws/)
- [VoiceOver (macOS/iOS)](https://www.apple.com/accessibility/voiceover/)
- [TalkBack (Android)](https://support.google.com/accessibility/android/answer/6283677)

### Learning Resources
- [WebAIM Articles](https://webaim.org/articles/)
- [A11y Project](https://www.a11yproject.com/)
- [Level Access](https://www.levelaccess.com/)
- [Deque University](https://dequeuniversity.com/)

---

## Maintenance

### Regular Audits
- Run accessibility tests in CI/CD pipeline
- Manual testing at least quarterly
- Update tools and standards as they evolve
- Track and fix accessibility issues

### Team Training
- Train developers on WCAG compliance
- Accessibility awareness sessions
- Code review focusing on accessibility
- Document accessibility decisions

---

Last Updated: 2024
WCAG Version: 2.1 Level AAA
