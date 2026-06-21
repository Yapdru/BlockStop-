# BlockStop PRO Documentation & Landing Page

This directory contains the GitHub Pages documentation and landing page for BlockStop PRO.

## Pages

- **index.html** - Landing page with features, pricing overview, and call-to-action
- **features.html** - Comprehensive feature showcase and comparison
- **pricing.html** - Detailed pricing tiers with FAQ
- **setup.html** - Getting started guide and installation instructions
- **api-docs.html** - Complete REST API documentation (served as `/api.html`)
- **support.html** - Support center with contact forms and FAQ

## Structure

```
docs/
├── index.html          # Landing page
├── features.html       # Features showcase
├── pricing.html        # Pricing page
├── setup.html          # Getting started guide
├── api-docs.html       # API documentation
├── support.html        # Support center
├── README.md           # This file
└── [Markdown docs]     # Additional documentation in Markdown
    ├── API_DOCUMENTATION.md
    ├── INTEGRATION_GUIDE.md
    └── [other docs]
```

## Design System

All HTML pages use:
- **Bootstrap 5.3** for responsive grid and components
- **Custom CSS** with design tokens:
  - Primary: #1E88FF (light blue)
  - Accent: #FFE500 (yellow)
  - Success: #4CAF50 (green)
- **Font Awesome 6.4** for icons
- **Google Fonts**: Inter (body), Poppins (headings)
- **Mobile-first responsive design**
- **SEO optimized** with proper meta tags

## Deployment

Pages are automatically deployed via GitHub Actions when changes are pushed to main branch.

### GitHub Pages Configuration

- **Source:** docs/ folder
- **Branch:** main
- **URL:** https://yourusername.github.io/BlockStop-

## Local Development

To test the docs locally:

1. Open any HTML file in your browser directly
2. Or use a local server:
   ```bash
   cd docs
   python -m http.server 8000
   # Visit http://localhost:8000
   ```

## Customization

### Adding New Pages

1. Create new HTML file in `/docs`
2. Copy the navbar and footer from existing pages
3. Update nav links in all pages to include new page
4. Follow the existing CSS structure

### Updating Colors

Edit the CSS `:root` variables in any HTML file:

```css
:root {
    --primary: #1E88FF;
    --accent: #FFE500;
    --success: #4CAF50;
}
```

### Updating Content

All content is in the HTML files. Edit the relevant sections directly.

## Analytics

To enable analytics:

1. Get a Google Analytics ID
2. Replace `G-XXXXXXXXXX` in the script tag in `index.html`
3. Uncomment the gtag config line

## SEO Optimization

Each page includes:
- Meta description
- Relevant keywords
- Semantic HTML
- Proper heading hierarchy
- Internal linking
- Mobile viewport configuration

## Support

For documentation questions or improvements, open an issue on GitHub or contact support@blockstop.io
