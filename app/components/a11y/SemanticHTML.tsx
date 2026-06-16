/**
 * Semantic HTML Best Practices Guide
 * WCAG 2.1 Level AAA - Semantic Structure (1.3.1, 2.4.1)
 * Reference component and utilities for semantic HTML patterns
 */

'use client';

import React from 'react';

/**
 * Semantic HTML patterns and best practices
 */

/**
 * Semantic Heading Structure
 * H1 should be unique per page and appear once
 * Use h1-h6 in logical order (no skipping levels)
 */
export const HeadingExample: React.FC = () => (
  <>
    <h1>Main Page Title</h1>
    <section>
      <h2>Section Title</h2>
      <p>Content here...</p>

      <h3>Subsection</h3>
      <p>More content...</p>
    </section>
  </>
);

/**
 * Semantic Navigation
 * Use nav element for main navigation
 * Use landmarks: main, aside, footer, header
 */
export const NavigationExample: React.FC = () => (
  <header>
    <nav aria-label="Primary navigation">
      <ul>
        <li>
          <a href="/">Home</a>
        </li>
        <li>
          <a href="/about">About</a>
        </li>
        <li>
          <a href="/contact">Contact</a>
        </li>
      </ul>
    </nav>
  </header>
);

/**
 * Semantic Main Content
 * Use main element for unique content per page
 */
export const MainContentExample: React.FC = () => (
  <main id="main-content">
    <h1>Page Title</h1>
    <article>
      <h2>Article Title</h2>
      <p>Article content...</p>
    </article>
  </main>
);

/**
 * Semantic Sidebar
 * Use aside for complementary content
 */
export const SidebarExample: React.FC = () => (
  <aside aria-label="Sidebar">
    <h2>Related Information</h2>
    <ul>
      <li>Item 1</li>
      <li>Item 2</li>
    </ul>
  </aside>
);

/**
 * Semantic Footer
 * Use footer for page footer content
 */
export const FooterExample: React.FC = () => (
  <footer>
    <p>&copy; 2024 Your Company. All rights reserved.</p>
    <nav aria-label="Footer navigation">
      <a href="/privacy">Privacy Policy</a>
      <a href="/terms">Terms of Service</a>
    </nav>
  </footer>
);

/**
 * Semantic Form Structure
 * Always use label elements paired with inputs
 */
export const FormExample: React.FC = () => (
  <form>
    <fieldset>
      <legend>Contact Information</legend>

      <div>
        <label htmlFor="name">
          Name <span aria-label="required">*</span>
        </label>
        <input id="name" type="text" required />
      </div>

      <div>
        <label htmlFor="email">
          Email <span aria-label="required">*</span>
        </label>
        <input id="email" type="email" required />
        <div id="email-help" className="help-text">
          We'll never share your email
        </div>
      </div>

      <div>
        <label htmlFor="message">Message</label>
        <textarea id="message" aria-describedby="message-limit" />
        <small id="message-limit">Max 500 characters</small>
      </div>

      <button type="submit">Send Message</button>
    </fieldset>
  </form>
);

/**
 * Semantic List Structure
 * Use ul for unordered, ol for ordered lists
 */
export const ListExample: React.FC = () => (
  <>
    <h2>Steps to Complete</h2>
    <ol>
      <li>First step</li>
      <li>Second step</li>
      <li>Third step</li>
    </ol>

    <h2>Features</h2>
    <ul>
      <li>Feature one</li>
      <li>Feature two</li>
      <li>Feature three</li>
    </ul>
  </>
);

/**
 * Semantic Button vs Link
 * Use button for actions, a for navigation
 */
export const ButtonVsLinkExample: React.FC = () => (
  <>
    {/* Navigation - use link */}
    <a href="/about">Go to About Page</a>

    {/* Action - use button */}
    <button onClick={() => console.log('Action')}>Submit Form</button>

    {/* Icon button - needs aria-label */}
    <button aria-label="Close menu">×</button>

    {/* Link styled as button - use proper semantics */}
    <a href="/products" className="button-style">
      Shop Now
    </a>
  </>
);

/**
 * Semantic Table Structure
 * Use thead, tbody, tfoot and proper th/td
 */
export const TableExample: React.FC = () => (
  <table>
    <caption>Sales Data 2024</caption>
    <thead>
      <tr>
        <th scope="col">Month</th>
        <th scope="col">Revenue</th>
        <th scope="col">Growth</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>January</td>
        <td>$50,000</td>
        <td>+5%</td>
      </tr>
      <tr>
        <td>February</td>
        <td>$65,000</td>
        <td>+30%</td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <th scope="row">Total</th>
        <td>$115,000</td>
        <td>+17.5%</td>
      </tr>
    </tfoot>
  </table>
);

/**
 * Semantic Article vs Section
 * article: Self-contained, independently reusable content
 * section: Thematic grouping of content
 */
export const ArticleVsSectionExample: React.FC = () => (
  <>
    <article>
      <h2>Blog Post Title</h2>
      <p>Published on January 1, 2024</p>
      <p>Article content...</p>

      <section>
        <h3>Related Resources</h3>
        <ul>
          <li>Resource 1</li>
          <li>Resource 2</li>
        </ul>
      </section>
    </article>

    <section>
      <h2>Blog Posts</h2>
      <article>
        <h3>First Post</h3>
      </article>
      <article>
        <h3>Second Post</h3>
      </article>
    </section>
  </>
);

/**
 * Semantic Image with Alternative Text
 * Always provide meaningful alt text
 */
export const ImageExample: React.FC = () => (
  <>
    {/* Decorative image - use empty alt */}
    <img src="decoration.png" alt="" />

    {/* Informative image - describe content */}
    <img
      src="chart.png"
      alt="Sales chart showing 30% growth from January to February"
    />

    {/* Image with caption */}
    <figure>
      <img src="product.png" alt="Blue widget product" />
      <figcaption>Our best-selling blue widget</figcaption>
    </figure>

    {/* Complex image - use longdesc */}
    <img
      src="complex-diagram.png"
      alt="System architecture diagram"
      aria-describedby="diagram-description"
    />
    <div id="diagram-description">
      <h3>System Architecture</h3>
      <p>Detailed description of the diagram...</p>
    </div>
  </>
);

/**
 * Semantic Dialog/Modal
 * Use dialog element with proper attributes
 */
export const DialogExample: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const dialogRef = React.useRef<HTMLDialogElement>(null);

  const openDialog = () => {
    setIsOpen(true);
    dialogRef.current?.showModal();
  };

  const closeDialog = () => {
    setIsOpen(false);
    dialogRef.current?.close();
  };

  return (
    <>
      <button onClick={openDialog}>Open Dialog</button>

      <dialog
        ref={dialogRef}
        onClose={closeDialog}
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
      >
        <h2 id="dialog-title">Confirm Action</h2>
        <p id="dialog-description">Are you sure you want to continue?</p>
        <div>
          <button onClick={closeDialog}>Cancel</button>
          <button onClick={closeDialog}>Confirm</button>
        </div>
      </dialog>
    </>
  );
};

/**
 * Semantic Details/Summary
 * Use for collapsible content
 */
export const DetailsExample: React.FC = () => (
  <details>
    <summary>Click to expand FAQ</summary>
    <div>
      <h3>What is this?</h3>
      <p>This is a frequently asked question with answer.</p>
    </div>
  </details>
);

/**
 * Semantic Mark/Highlight
 * Use mark for highlighting relevant text
 */
export const MarkExample: React.FC = () => (
  <p>
    The following text is <mark>highlighted because it's important</mark>.
  </p>
);

/**
 * Semantic Code Samples
 */
export const CodeExample: React.FC = () => (
  <>
    {/* Inline code */}
    <p>
      Use the <code>useState</code> hook to manage component state.
    </p>

    {/* Code block */}
    <pre>
      <code>{`const [count, setCount] = useState(0);`}</code>
    </pre>
  </>
);

/**
 * Semantic Emphasis vs Strong
 * em: Stress emphasis
 * strong: Strong importance
 */
export const EmphasisExample: React.FC = () => (
  <>
    <p>
      This is <em>important</em> information.
    </p>
    <p>
      This is <strong>critically important</strong> information.
    </p>
  </>
);

/**
 * Semantic Time Element
 */
export const TimeExample: React.FC = () => (
  <p>
    Published on <time dateTime="2024-01-15">January 15, 2024</time>
  </p>
);

/**
 * Semantic Address Element
 */
export const AddressExample: React.FC = () => (
  <address>
    <p>Contact us at:</p>
    <p>123 Main Street</p>
    <p>City, State 12345</p>
    <a href="mailto:info@example.com">info@example.com</a>
  </address>
);

/**
 * WCAG 2.1 Semantic HTML Checklist
 */
export const SemanticHTMLChecklist = [
  '✓ One h1 per page, unique and descriptive',
  '✓ Heading hierarchy (h1-h6) in logical order',
  '✓ No skipped heading levels',
  '✓ main element for unique content',
  '✓ nav element for navigation',
  '✓ header and footer elements',
  '✓ article for self-contained content',
  '✓ section for thematic grouping',
  '✓ aside for complementary content',
  '✓ All form inputs have associated labels',
  '✓ Buttons for actions, links for navigation',
  '✓ Meaningful alt text on images',
  '✓ Table with thead, tbody, tfoot',
  '✓ Table with proper th scope attributes',
  '✓ Lists with ul, ol, li elements',
  '✓ Code markup with code and pre',
  '✓ Emphasis with em and strong',
  '✓ Dialogs use dialog element',
  '✓ Time element with datetime attribute',
  '✓ Figure and figcaption for image groups',
];

/**
 * HTML5 Semantic Elements Reference
 */
export const SemanticElementsReference: Record<string, string> = {
  header: 'Page or section header',
  nav: 'Navigation links',
  main: 'Main content (unique per page)',
  article: 'Self-contained, reusable content',
  section: 'Thematic grouping of content',
  aside: 'Complementary content (sidebar)',
  footer: 'Page or section footer',
  h1: 'Page title (one per page)',
  h2: 'Section title',
  h3: 'Subsection title',
  p: 'Paragraph',
  ul: 'Unordered list',
  ol: 'Ordered list',
  li: 'List item',
  dl: 'Description list',
  dt: 'Description term',
  dd: 'Description definition',
  figure: 'Image with caption',
  figcaption: 'Figure caption',
  time: 'Date/time with machine-readable format',
  mark: 'Highlighted/emphasized text',
  code: 'Computer code',
  pre: 'Preformatted text block',
  em: 'Stress emphasis',
  strong: 'Strong importance',
  address: 'Contact information',
  blockquote: 'Extended quotation',
  q: 'Short inline quotation',
  button: 'Interactive button',
  form: 'Form container',
  fieldset: 'Form field grouping',
  legend: 'Fieldset caption',
  label: 'Form input label',
  input: 'Form input',
  textarea: 'Multi-line text input',
  select: 'Dropdown selection',
  optgroup: 'Option group',
  option: 'Select option',
  table: 'Data table',
  thead: 'Table header section',
  tbody: 'Table body section',
  tfoot: 'Table footer section',
  tr: 'Table row',
  th: 'Table header cell',
  td: 'Table data cell',
  img: 'Image',
  picture: 'Responsive image',
  video: 'Video content',
  audio: 'Audio content',
  source: 'Media source',
  track: 'Media track (captions, etc)',
  a: 'Hyperlink',
  dialog: 'Modal dialog',
  details: 'Disclosure/collapsible content',
  summary: 'Summary/title for details',
};

/**
 * Documentation for semantic HTML usage
 */
export const SemanticHTMLDoc = `
# Semantic HTML for WCAG 2.1 Level AAA

Semantic HTML is the foundation of accessible web content. It provides meaning to both
browsers and assistive technologies.

## Key Principles

1. **Meaningful Structure**: Use HTML elements that convey meaning, not just styling
2. **Proper Landmarks**: Use header, nav, main, aside, footer for page structure
3. **Heading Hierarchy**: One h1 per page, with h2-h6 in logical order
4. **Form Semantics**: Use label elements for all inputs, fieldset for grouping
5. **List Semantics**: Use ul/ol/li for lists, never use divs to fake lists
6. **Link vs Button**: Links navigate, buttons perform actions
7. **Alternative Text**: Provide meaningful alt text for all images
8. **Table Structure**: Use thead, tbody, tfoot with proper scope attributes

## Benefits

- Better accessibility for screen reader users
- Improved SEO for search engines
- Cleaner, more maintainable code
- Better keyboard navigation
- Better mobile experience
- Future-proof for evolving standards

## Testing

Use semantic HTML validator tools:
- Wave WebAIM
- Axe DevTools
- NVDA or JAWS screen reader testing
- Keyboard-only navigation testing
`;

export default SemanticHTMLChecklist;
