# Synetica - MSP Company Website

A modern, mobile-first website for Synetica, a Managed Service Provider (MSP) specializing in comprehensive IT solutions, cybersecurity, and cloud services.

## Features

- **Mobile-First Design**: Optimized for all devices with responsive breakpoints
- **Modern UI/UX**: Clean, professional design with smooth animations
- **Fast Performance**: Lightweight vanilla JavaScript, no dependencies
- **Accessibility**: WCAG compliant with proper ARIA labels and keyboard navigation
- **SEO Optimized**: Semantic HTML and proper meta tags
- **Interactive Elements**: Smooth scrolling, animated sections, and dynamic navigation

## Sections

1. **Hero Section**: Eye-catching introduction with clear call-to-action buttons
2. **Services**: Six comprehensive MSP service offerings:
   - Managed IT Services
   - Cybersecurity
   - Cloud Solutions
   - Network Infrastructure
   - Backup & Disaster Recovery
   - IT Consulting
3. **About**: Company information with key statistics
4. **Why Choose Us**: Four compelling reasons to partner with Synetica
5. **Contact**: Contact form and business information
6. **Footer**: Quick links, services, and social media connections

## Technology Stack

- **HTML5**: Semantic markup for better SEO and accessibility
- **CSS3**: Modern styling with CSS Grid, Flexbox, and CSS Variables
- **Vanilla JavaScript**: No frameworks required for optimal performance

## Design Highlights

- **Color Scheme**: Professional blue and purple gradients with dark backgrounds
- **Typography**: System font stack for optimal loading speed
- **Icons**: Inline SVG icons for scalability and performance
- **Animations**: Smooth fade-in effects and scroll-based animations
- **Forms**: Client-side validation with user-friendly notifications

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Getting Started

1. Clone the repository
2. Open `index.html` in your browser
3. No build process required!

## Deployment

### Cloudflare Workers (Recommended)

This website uses **Cloudflare Workers** to serve static files from GitHub with intelligent caching and CDN distribution.

#### Deploy via Wrangler CLI

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy to Cloudflare Workers
wrangler deploy
```

That's it! Your site will be deployed to Cloudflare's global network.

#### How It Works

The `worker.js` file:
- Fetches files directly from this GitHub repository
- Implements intelligent caching (HTML: 1 hour, CSS/JS: 1 day, Images: 1 week)
- Adds security headers automatically
- Serves content through Cloudflare's global CDN
- No build process required!

Your site will be automatically deployed with:
- ✅ Free SSL/TLS certificates
- ✅ Global CDN distribution (300+ locations)
- ✅ Automatic caching and optimization
- ✅ Custom domain support
- ✅ Built-in security headers

### Configuration Files

- **wrangler.toml**: Cloudflare Workers configuration
- **worker.js**: Edge worker script that serves files and handles caching
- **_headers**: Additional HTTP headers (optional, for Pages deployment)
- **_redirects**: URL redirects (optional, for Pages deployment)
- **.gitignore**: Excludes build artifacts and sensitive files

### Custom Domain Setup

After deploying:
1. Go to your [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Workers & Pages** > Your worker
3. Click **Settings** > **Domains & Routes**
4. Add your custom domain (e.g., `synetica.com`)
5. Update DNS records as instructed
6. SSL certificate will be automatically provisioned

### Alternative: Cloudflare Pages

You can also deploy as a static site on Cloudflare Pages:
1. In Cloudflare Dashboard, go to **Pages** > **Create a project**
2. Connect this repository
3. **Important**: Leave **Build command** empty
4. Set **Build output directory** to `/` (root)
5. Deploy!

For Pages deployment, the `_headers` and `_redirects` files will be automatically used.

## File Structure

```
Synetica-Website/
├── index.html          # Main HTML file
├── styles.css          # All styles (mobile-first)
├── script.js           # Interactive features
├── wrangler.toml       # Cloudflare Workers configuration
├── worker.js           # Cloudflare Worker (serves files from GitHub)
├── _headers            # HTTP headers (for Pages deployment)
├── _redirects          # URL redirects (for Pages deployment)
├── .gitignore          # Git ignore rules
└── README.md           # Documentation
```

## Customization

### Colors
Edit CSS variables in `styles.css`:
```css
:root {
    --primary-color: #2563eb;
    --secondary-color: #8b5cf6;
    --accent-color: #06b6d4;
}
```

### Content
- Update company information in `index.html`
- Modify services, features, and contact details as needed
- Replace placeholder contact information with actual data

### Form Submission
The contact form currently simulates submission. To connect to a backend:
1. Update the form submission handler in `script.js`
2. Replace the setTimeout simulation with an actual API call
3. Add your backend endpoint URL

## Performance

- **Lightweight**: No external dependencies
- **Fast Loading**: Optimized CSS and JavaScript
- **Efficient**: Intersection Observer for lazy animations
- **Mobile Optimized**: Touch-friendly with optimized images

## Accessibility

- Semantic HTML5 elements
- ARIA labels for interactive elements
- Keyboard navigation support
- Reduced motion support for users with motion sensitivity
- High contrast ratios for text readability

## Future Enhancements

- Add blog section for thought leadership
- Implement case studies showcase
- Add client testimonials slider
- Create a careers page
- Integrate with CMS for easy content management
- Add multilingual support

## License

© 2024 Synetica. All rights reserved.

## Contact

For questions or support:
- Email: info@synetica.com
- Phone: (716) 341-3678
- Address: 219 Lexington Ave, Buffalo, NY 14222
