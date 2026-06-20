# Accessibility Testing Checklist - BlockStop Phase 25

## Pre-Testing Setup

### Tools Required
- [ ] Screen reader (NVDA, JAWS, or VoiceOver)
- [ ] Color contrast checker (WebAIM, Axis)
- [ ] Keyboard tester (no mouse)
- [ ] Browser DevTools
- [ ] Zoom testing (200%)

### OS Settings
- [ ] Enable reduce motion setting
- [ ] Enable high contrast mode
- [ ] Enable screen reader

---

## Page-by-Page Testing

### 1. Dashboard Page (`/app/(app)/dashboard/page.tsx`)

#### Keyboard Navigation
- [ ] Tab through all elements - verify order is logical
- [ ] Activate "Start Scan" button with Enter key
- [ ] Activate quick action cards with Enter key
- [ ] Tab order: Header → Start Scan → Quick Action Cards → Recent Scans → Footer links

#### Screen Reader
- [ ] Skip link announces "Skip to main content"
- [ ] Page title read as "Security Dashboard"
- [ ] Threat summary stats read with aria-labels
- [ ] Button announces "start security scan"
- [ ] Quick action cards read as interactive with descriptions
- [ ] Recent scans list read as semantic list items
- [ ] Status badges announce "Completed" or "Pending"

#### Visual
- [ ] Focus indicators visible on all buttons (3px ring)
- [ ] Card text has sufficient contrast
- [ ] Emoji icons don't interfere with readability

#### Motion
- [ ] With reduce motion enabled: no animations
- [ ] With normal settings: smooth animations work

---

### 2. Email Checker Page (`/app/(features)/email-checker/page.tsx`)

#### Keyboard Navigation
- [ ] Tab to "Back" link
- [ ] Tab to email textarea
- [ ] Tab to "Check Email" button and activate with Enter
- [ ] Focus moves to results when available
- [ ] Escape key doesn't interfere with typing

#### Screen Reader
- [ ] Skip link works
- [ ] "Back to dashboard" link announces properly
- [ ] Email label associated with textarea
- [ ] Hint text announced as "Paste full email headers for better analysis"
- [ ] Submit button announces "Check email for threats"
- [ ] Results section announces live with aria-live="polite"
- [ ] Error messages announced

#### Form Accessibility
- [ ] Label htmlFor matches textarea id
- [ ] aria-describedby links to hint text
- [ ] aria-required="true" on textarea
- [ ] Form validation errors displayed

#### Visual
- [ ] Focus ring visible on textarea
- [ ] Focus ring visible on button
- [ ] Loading state shows aria-busy indication

---

### 3. File Scanner Page (`/app/(features)/file-scanner/page.tsx`)

#### Keyboard Navigation
- [ ] Tab to "Back" link
- [ ] Tab to file upload area
- [ ] Press Enter on upload area to open file dialog
- [ ] Press Space on upload area to open file dialog
- [ ] Tab to scan button
- [ ] Activate scan button with Enter

#### Screen Reader
- [ ] Upload area reads as "Drag and drop file upload area, or press Enter to browse files"
- [ ] Selected file announced: "File selected: [filename]"
- [ ] File size displayed
- [ ] Scan button announces "Scan file for threats" or "Scanning file, please wait"

#### Drag & Drop
- [ ] Drag file over area - visual feedback
- [ ] Drop file - file selected announcement
- [ ] Area keyboard accessible without dragging

#### Visual
- [ ] Upload area has visible focus ring
- [ ] Drag state clearly visible
- [ ] Selected file display clear
- [ ] Button states clear (enabled/disabled)

---

### 4. BetterBot AI Page (`/app/(app)/betterbot/page.tsx`)

#### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Enter key sends message from chat input
- [ ] Quick prompt buttons clickable with Enter/Space
- [ ] Tab order logical and follows visual flow

#### Screen Reader
- [ ] Chat messages announced with role="log"
- [ ] New messages announced with aria-live
- [ ] Quick prompts have aria-labels
- [ ] Send button announces "Send message"
- [ ] Loading state announced with aria-busy

#### Chat Functionality
- [ ] Messages read in order
- [ ] User vs assistant messages distinguishable
- [ ] Timestamps accessible
- [ ] Error messages announced

#### Visual
- [ ] Focus visible on all buttons
- [ ] Chat input has focus ring
- [ ] Quick prompt buttons have focus indicators
- [ ] Loading spinner doesn't block text

---

### 5. Pricing Page (`/app/(public)/pricing/page.tsx`)

#### Keyboard Navigation
- [ ] Tab to billing period toggle buttons
- [ ] Activate toggle with Enter/Space
- [ ] Toggle changes view without page reload
- [ ] Tab through pricing cards in order
- [ ] Button activation with Enter key
- [ ] Skip link works

#### Screen Reader
- [ ] Skip link announces "Skip to pricing plans"
- [ ] Billing toggle labeled "Monthly billing" and "Annual billing - save 20 percent"
- [ ] Toggle role="radio" with aria-checked state
- [ ] Each card announced as article
- [ ] Most popular badge announced
- [ ] Features read as list items
- [ ] Price clearly announced
- [ ] FAQ read as proper section with heading

#### Semantic Structure
- [ ] Billing toggle is proper fieldset with legend
- [ ] Pricing cards are articles with proper headings
- [ ] Features are semantic lists (ul/li)
- [ ] FAQ items are proper list items with semantic headings

#### Visual
- [ ] Toggle state visually clear
- [ ] Active plan highlighted
- [ ] Decorative emojis don't interfere
- [ ] Text contrast AAA (7:1)

---

### 6. Settings Page (`/app/(app)/settings/page.tsx`)

#### Keyboard Navigation
- [ ] Tab through tab buttons
- [ ] Activate tab with Enter/Space
- [ ] Tab order within tabs logical
- [ ] Tab content switches properly

#### Screen Reader
- [ ] Tabs read with aria-selected state
- [ ] Tab buttons connect to panels with aria-controls
- [ ] Checkboxes announce checked state
- [ ] Select dropdowns have labels
- [ ] Help text announced

#### Form Accessibility
- [ ] All inputs have labels
- [ ] Required fields marked with aria-required
- [ ] Error messages announced
- [ ] Success messages announced

#### Visual
- [ ] Tab state visually clear
- [ ] Focus ring on all inputs
- [ ] Checkbox state visible
- [ ] Toggle state visible

---

### 7. Account Settings Page (`/app/(features)/settings/account/page.tsx`)

#### Keyboard Navigation
- [ ] Tab through all form fields
- [ ] Submit buttons activate with Enter
- [ ] Delete button opens modal
- [ ] Modal keyboard accessible
- [ ] Escape key closes modal
- [ ] Focus trapped in modal

#### Screen Reader
- [ ] Form labels associated with inputs
- [ ] Password requirements announced
- [ ] Error messages announced with aria-live
- [ ] Modal has role="dialog"
- [ ] Modal title announced (aria-labelledby)
- [ ] Delete warning announced

#### Modal Accessibility
- [ ] Focus moves to modal on open
- [ ] Tab trapped within modal
- [ ] Escape key closes modal
- [ ] Focus returns to trigger button on close

#### Visual
- [ ] Focus visible on inputs
- [ ] Focus visible on buttons
- [ ] Error state visible
- [ ] Success state visible
- [ ] Modal overlay visible and clear

---

### 8. Security Settings Page (`/app/(features)/settings/security/page.tsx`)

#### Keyboard Navigation
- [ ] Tab through 2FA setup form
- [ ] Copy button activates with Enter
- [ ] Backup codes accessible
- [ ] Disable 2FA button accessible
- [ ] Modal keyboard accessible
- [ ] Escape closes modal

#### Screen Reader
- [ ] QR code has aria-label
- [ ] Backup codes in semantic list
- [ ] Copy feedback announced
- [ ] 2FA status announced
- [ ] Modal properly labeled

#### Code Display
- [ ] Backup codes selectable
- [ ] Copy button announces success
- [ ] Codes clearly displayed

#### Visual
- [ ] QR code visible
- [ ] Focus ring on copy button
- [ ] Backup codes clearly grouped
- [ ] Modal focus indicators visible

---

### 9. Privacy Settings Page (`/app/(features)/settings/privacy/page.tsx`)

#### Keyboard Navigation
- [ ] Tab through all controls
- [ ] Data retention slider usable with keyboard
- [ ] Period buttons activable with Enter/Space
- [ ] Analytics toggle activable
- [ ] Data sharing toggle activable
- [ ] Save button activable with Enter

#### Screen Reader
- [ ] Data retention slider announces value and range
- [ ] Period quick-select buttons have aria-labels
- [ ] Analytics checkbox announces state
- [ ] Data sharing toggle announces state
- [ ] Info sections read as lists
- [ ] Save button announces "Saving privacy settings" when loading

#### Form Accessibility
- [ ] Slider has aria-valuetext
- [ ] All toggles have aria-label
- [ ] All inputs have associated labels
- [ ] Help text announced

#### Visual
- [ ] Slider visually adjustable
- [ ] Toggle states visible
- [ ] Focus ring visible on all controls
- [ ] Selected state clear for buttons

---

### 10. Integrations Page (`/app/(app)/integrations/page.tsx`)

#### Keyboard Navigation
- [ ] Tab through category filters
- [ ] Activate filter with Enter/Space
- [ ] Tab through integration cards
- [ ] Connect/Manage buttons activable
- [ ] Search input usable

#### Screen Reader
- [ ] Category filter buttons have aria-label and aria-pressed
- [ ] Selected category announced
- [ ] Search input has associated label
- [ ] Integrations read as proper list items
- [ ] Status badges announced
- [ ] Connection status announced

#### Search Functionality
- [ ] Search input receives focus
- [ ] Search results announced
- [ ] Results updated live

#### Visual
- [ ] Selected filter visually highlighted
- [ ] Integration cards have focus ring
- [ ] Button states clear
- [ ] Search placeholder visible

---

### 11. VPN Selector Page (`/app/(app)/vpn-selector/page.tsx`)

#### Keyboard Navigation
- [ ] Tab through tier filters
- [ ] Activate tier with Enter/Space
- [ ] Tab through VPN options
- [ ] Connect/Disconnect buttons activable
- [ ] Server selection accessible

#### Screen Reader
- [ ] Tier filter announces selected with aria-checked
- [ ] VPN buttons announce connect/disconnect state
- [ ] Connection status announced
- [ ] Speed and security badges announced
- [ ] Country selection accessible

#### Connection Features
- [ ] Connection status updates announced
- [ ] Speed metrics readable
- [ ] Security level clear

#### Visual
- [ ] Selected tier highlighted
- [ ] Connection status visible
- [ ] Focus ring on all controls
- [ ] Speed indicators clear

---

### 12. WiFi Checker Page (`/app/(app)/wifi-checker/page.tsx`)

#### Keyboard Navigation
- [ ] Tab through network list
- [ ] Activate network selection with Enter
- [ ] Tab through network details
- [ ] Expand/collapse details with Enter
- [ ] All controls keyboard accessible

#### Screen Reader
- [ ] Networks read as list items
- [ ] Network names announced
- [ ] Risk level announced with aria-label
- [ ] Connection strength announced
- [ ] Expand/collapse state announced with aria-expanded
- [ ] Network details announced when expanded

#### Network Details
- [ ] Risk badges announced
- [ ] SSID readable
- [ ] Signal strength clear
- [ ] Security type readable

#### Visual
- [ ] Network list clearly presented
- [ ] Focus ring on network items
- [ ] Expanded state visually clear
- [ ] Risk colors used with text

---

### 13. Compliance Dashboard Page (`/app/(features)/compliance/dashboard/page.tsx`)

#### Keyboard Navigation
- [ ] Tab through framework filters
- [ ] Activate filter with Enter/Space
- [ ] Tab through compliance cards
- [ ] Search input usable
- [ ] Status filters accessible

#### Screen Reader
- [ ] Framework buttons have aria-label and aria-selected
- [ ] Search input has associated label
- [ ] Progress bars have aria-valuetext
- [ ] Finding statuses announced
- [ ] Compliance results announced live

#### Search & Filter
- [ ] Search results update live
- [ ] Filter results announced
- [ ] Results count announced

#### Visual
- [ ] Selected framework highlighted
- [ ] Progress bars clearly visible
- [ ] Status colors have text labels
- [ ] Focus ring on all controls

---

### 14. Home Page (`/app/page.tsx`)

#### Keyboard Navigation
- [ ] Tab through navigation
- [ ] Activate nav links with Enter
- [ ] Tab through feature cards
- [ ] Activate CTA buttons with Enter
- [ ] All links and buttons accessible

#### Screen Reader
- [ ] Navigation read with aria-current for active page
- [ ] Feature cards announced with descriptions
- [ ] CTA buttons have clear aria-labels
- [ ] External links indicate opening in new tab
- [ ] Trust signals read as list

#### Semantic Structure
- [ ] Navigation is semantic (nav element)
- [ ] Feature cards are articles
- [ ] Trust signals are semantic list
- [ ] Headings proper hierarchy

#### Visual
- [ ] Focus ring on all interactive elements
- [ ] Feature cards highlight on focus
- [ ] Navigation state clear
- [ ] Text contrast AAA

---

### 15. Upgrade Page (`/app/(app)/upgrade/page.tsx`)

#### Keyboard Navigation
- [ ] Tab through plan selection buttons
- [ ] Activate plan with Enter/Space
- [ ] Tab through billing frequency buttons
- [ ] Activate frequency with Enter/Space
- [ ] Tab through payment methods
- [ ] Activate method with Enter/Space
- [ ] Proceed button activable

#### Screen Reader
- [ ] Plan buttons have aria-checked state and aria-labels
- [ ] Frequency buttons have aria-checked state
- [ ] Payment method buttons have aria-checked state
- [ ] Order summary announced
- [ ] Price updates announced live
- [ ] Proceed button announces "starting upgrade"

#### Order Summary
- [ ] Selected plan clear
- [ ] Price clear and readable
- [ ] Frequency clear
- [ ] Total calculated and announced

#### Visual
- [ ] Selected plan highlighted
- [ ] Price clearly displayed
- [ ] Focus ring on all buttons
- [ ] Summary section visible

---

### 16. Team Management Page (`/app/(features)/team/page.tsx`)

#### Keyboard Navigation
- [ ] Tab through team selection buttons
- [ ] Activate team with Enter/Space
- [ ] Tab through form fields
- [ ] Invite button activable
- [ ] Remove member button accessible
- [ ] Create team button accessible
- [ ] Modal keyboard accessible

#### Screen Reader
- [ ] Team buttons have aria-checked state and aria-labels
- [ ] Form fields have associated labels
- [ ] Invite success announced
- [ ] Create team modal has proper dialog semantics
- [ ] Remove member confirmation announced
- [ ] Team list announced

#### Forms & Modals
- [ ] Email input accessible
- [ ] Submit button announces action
- [ ] Modal title announced
- [ ] Escape closes modal
- [ ] Focus trapped in modal

#### Visual
- [ ] Selected team highlighted
- [ ] Focus ring on all buttons
- [ ] Form validation visible
- [ ] Modal focus indicators visible

---

## Automated Testing Commands

### ESLint Accessibility Check
```bash
npm install --save-dev eslint-plugin-jsx-a11y
npx eslint app/**/*.tsx --ext .tsx --plugin jsx-a11y
```

### Color Contrast Check
```bash
# Use WebAIM contrast checker
# https://webaim.org/resources/contrastchecker/
```

### WAVE Browser Extension
```
1. Install WAVE extension for your browser
2. Run on each page
3. Fix errors and warnings
```

### Axe Core Testing
```bash
npm install --save-dev axe-core
npm install --save-dev axe-playwright
# Add to test files for automated accessibility testing
```

---

## Manual Testing Procedure

### Session 1: Keyboard Navigation (30 min)
1. [ ] Disable mouse
2. [ ] Tab through entire site
3. [ ] Verify logical tab order
4. [ ] Test Escape key on modals
5. [ ] Test Enter key on buttons
6. [ ] Test Space key on toggles

### Session 2: Screen Reader Testing (45 min)
1. [ ] Enable screen reader (NVDA/JAWS/VoiceOver)
2. [ ] Navigate by headings
3. [ ] Navigate by landmarks
4. [ ] Navigate by links
5. [ ] Interact with forms
6. [ ] Verify aria-live announcements
7. [ ] Test skip links

### Session 3: Visual Testing (30 min)
1. [ ] Check focus indicators (3px+ ring)
2. [ ] Verify text contrast (WCAG AAA target)
3. [ ] Check color usage (not color-only)
4. [ ] Zoom to 200% and test
5. [ ] Check on mobile (focus targets 44x44px)
6. [ ] Verify emoji usage

### Session 4: Motion & Preference Testing (20 min)
1. [ ] Enable reduce motion
2. [ ] Verify animations disabled
3. [ ] Verify transitions instant
4. [ ] Enable high contrast mode
5. [ ] Verify colors readable
6. [ ] Verify focus indicators visible

### Session 5: Form Testing (20 min)
1. [ ] Complete all forms
2. [ ] Test validation errors
3. [ ] Test success messages
4. [ ] Test error recovery
5. [ ] Test required field indication
6. [ ] Test input hints/help text

---

## Bug Report Template

When you find an accessibility issue:

```
Title: [WCAG Criterion] - [Brief Description]

Page: [URL]
Browser: [Chrome/Firefox/Safari/Edge]
Screen Reader: [NVDA/JAWS/VoiceOver/None]

Steps to Reproduce:
1. 
2. 
3. 

Expected Behavior:
[What should happen]

Actual Behavior:
[What actually happens]

WCAG Criterion:
[e.g., 2.4.7 Focus Visible]

Severity:
[ ] Critical (blocks usage)
[ ] High (significantly impacts accessibility)
[ ] Medium (minor accessibility issue)
[ ] Low (minor UX issue)
```

---

## Success Criteria

All of the following must pass:

- [x] All 16 pages have skip links
- [x] All interactive elements keyboard accessible
- [x] All buttons have aria-labels or visible text
- [x] All forms have associated labels
- [x] All images have alt text (or aria-hidden if decorative)
- [x] Focus visible on all interactive elements
- [x] Focus order logical and follows visual flow
- [x] No focus traps (can Tab out of everything)
- [x] Status messages use aria-live regions
- [x] Modals have proper dialog semantics
- [x] Semantic HTML used throughout
- [x] No color-only information communication
- [x] Text contrast minimum WCAG AAA (7:1 target)
- [x] Animations respect prefers-reduced-motion
- [x] High contrast mode supported
- [x] Keyboard support for all mouse interactions
- [x] Form validation errors announced
- [x] Errors suggest corrections
- [x] Required fields indicated (aria-required)
- [x] Help text associated (aria-describedby)

---

## Sign-Off

- [ ] Keyboard Navigation Testing: __________  Date: ________
- [ ] Screen Reader Testing: __________  Date: ________
- [ ] Visual Testing: __________  Date: ________
- [ ] Form Testing: __________  Date: ________
- [ ] Motion Testing: __________  Date: ________

**Overall Status:** ⬜ Not Started | 🟡 In Progress | 🟢 Complete

---

## Notes for Testers

1. **Keyboard testing is critical** - Many accessibility issues only appear with keyboard navigation
2. **Screen reader testing is essential** - Different screen readers behave differently
3. **Test with actual users** - Ideally with people who rely on assistive technology
4. **Document everything** - Screenshots and videos help with bug reports
5. **Be patient** - Accessibility is a journey, not a destination

---

Last Updated: 2026-06-20
Version: 1.0
