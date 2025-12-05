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

### Cloudflare Pages (Recommended)

This website is configured for easy deployment on Cloudflare Pages:

#### Option 1: Deploy via Cloudflare Dashboard (Easiest)
1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Go to **Pages** > **Create a project**
3. Connect your GitHub account and select this repository
4. Configure build settings:
   - **Build command**: Leave empty (static site)
   - **Build output directory**: `/` (root directory)
5. Click **Save and Deploy**

Your site will be automatically deployed with:
- Free SSL/TLS certificates
- Global CDN distribution
- Automatic deployments on git push
- Custom domain support

#### Option 2: Deploy via Wrangler CLI
```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy to Cloudflare Pages
wrangler pages deploy . --project-name=synetica-website
```

### Configuration Files

- **wrangler.toml**: Cloudflare Workers/Pages configuration
- **_headers**: HTTP security headers and caching rules
- **_redirects**: URL redirect rules (customize as needed)
- **.gitignore**: Excludes build artifacts and sensitive files

### Custom Domain Setup

1. In Cloudflare Pages, go to your project
2. Click **Custom domains**
3. Add your domain (e.g., `synetica.com`)
4. Update DNS records as instructed
5. SSL certificate will be automatically provisioned

## File Structure

```
Synetica-Website/
├── index.html          # Main HTML file
├── styles.css          # All styles (mobile-first)
├── script.js           # Interactive features
├── wrangler.toml       # Cloudflare configuration
├── _headers            # HTTP headers configuration
├── _redirects          # URL redirects
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
- Phone: +1 (555) 123-4567
- Address: 123 Technology Drive, Business District, ST 12345
