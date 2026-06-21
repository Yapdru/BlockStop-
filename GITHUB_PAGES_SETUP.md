# GitHub Pages Setup Guide

BlockStop PRO documentation site is ready for GitHub Pages deployment. Follow these steps to enable it.

## Quick Setup (5 minutes)

### Step 1: Enable GitHub Pages in Repository Settings

1. Go to your GitHub repository
2. Click **Settings** → **Pages**
3. Under "Build and deployment":
   - Select **Deploy from a branch**
   - Branch: Select **main**
   - Folder: Select **/docs**
4. Click **Save**

### Step 2: Enforce HTTPS (Recommended)

1. In the same **Pages** settings
2. Check the box: **Enforce HTTPS**
3. GitHub will automatically provision an SSL certificate

### Step 3: Test Deployment

1. Go to **Actions** tab
2. Wait for the GitHub Pages deployment workflow to complete (usually 2-5 minutes)
3. Once complete, your site will be available at:
   ```
   https://yourusername.github.io/BlockStop-
   ```

## Accessing Your Site

After deployment, all pages are live at:

- **Landing Page**: `/` or `/index.html`
- **Features**: `/features.html`
- **Pricing**: `/pricing.html`
- **Getting Started**: `/setup.html`
- **API Docs**: `/api-docs.html` or `/api.html`
- **Support**: `/support.html`

## Optional: Custom Domain

If you own a domain and want to use it:

### DNS Configuration

1. Add a CNAME record to your DNS provider:
   ```
   Type: CNAME
   Name: subdomain (e.g., "docs")
   Value: yourusername.github.io
   ```

2. Or use A records for the root domain:
   ```
   Type: A
   Name: @ (root)
   Value: 185.199.108.153
   Value: 185.199.109.153
   Value: 185.199.110.153
   Value: 185.199.111.153
   ```

### GitHub Configuration

1. Go to Settings → Pages
2. Under "Custom domain", enter your domain
3. Click **Save**
4. GitHub will verify and enable HTTPS

## Automated Deployment

Every time you push to the `main` branch:

1. GitHub Actions automatically builds the site
2. Exports the Next.js app (if applicable)
3. Copies documentation files from `/docs`
4. Deploys to GitHub Pages
5. Site updates live in ~2-5 minutes

## File Structure

The deployment includes:

```
docs/
├── index.html          # Landing page
├── features.html       # Features showcase
├── pricing.html        # Pricing tiers
├── setup.html          # Getting started
├── api-docs.html       # API documentation
├── support.html        # Support center
├── README.md           # Documentation guide
└── [markdown docs]     # Additional resources
```

## Customization

### Update Content

Edit any `.html` file in `/docs` folder:
- Landing page: `docs/index.html`
- Features: `docs/features.html`
- Pricing: `docs/pricing.html`
- Setup: `docs/setup.html`
- API: `docs/api-docs.html`
- Support: `docs/support.html`

### Add Analytics

1. Get a Google Analytics tracking ID
2. Open `/docs/index.html`
3. Find the analytics script section
4. Replace `G-XXXXXXXXXX` with your GA ID
5. Uncomment the gtag config line

### Change Colors

All CSS uses custom properties. Edit the `:root` section in any HTML file:

```css
:root {
    --primary: #1E88FF;      /* Light blue */
    --primary-dark: #1565C0; /* Darker blue */
    --accent: #FFE500;       /* Yellow */
    --success: #4CAF50;      /* Green */
}
```

## Troubleshooting

### Site Not Appearing

1. Check if Pages is enabled in Settings → Pages
2. Verify the branch is set to `main` and folder is `/docs`
3. Check the Actions tab for deployment errors
4. Clear browser cache and try again

### Changes Not Reflecting

1. Pages rebuild after each push to `main`
2. Wait 2-5 minutes for deployment
3. Check GitHub Actions for any failures
4. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)

### Custom Domain Issues

1. Verify DNS records are correct
2. Wait 24-48 hours for DNS propagation
3. Check GitHub Pages settings for domain verification
4. Ensure HTTPS is enabled

## Workflow File

The deployment is handled by `.github/workflows/github-pages.yml`:

```yaml
- name: Copy documentation site
  run: |
    cp -r docs/* out/ || true
    cp docs/api-docs.html out/api.html || true

- name: Upload artifact
  uses: actions/upload-pages-artifact@v2
  with:
    path: ./out

- name: Deploy to GitHub Pages
  uses: actions/deploy-pages@v2
```

## Best Practices

1. **Update links** when adding/removing pages
2. **Test responsively** on mobile and desktop
3. **Check all links** before pushing changes
4. **Monitor analytics** for user engagement
5. **Keep content fresh** with regular updates
6. **Use HTTPS** for security
7. **Set up email alerts** for failed deployments

## Support

For GitHub Pages issues:
- GitHub Pages documentation: https://docs.github.com/pages
- GitHub Community: https://github.community
- GitHub Support: https://support.github.com

For BlockStop documentation issues:
- Email: support@blockstop.io
- GitHub Issues: https://github.com/Yapdru/BlockStop-/issues

## Performance Tips

- Pages load from CDN (very fast)
- Static HTML is optimized
- Images should be compressed
- CSS is inline for better performance
- No JavaScript dependencies

## Security

- HTTPS enforced (GitHub default)
- No server-side code execution
- Static files only
- GitHub's infrastructure security
- Regular backups via Git

---

**Status**: Ready for deployment
**Commit**: 94a9609
**Files Created**: 6 HTML pages + 1 README
**Total Size**: ~146 KB (all pages)
