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

### Cloudflare Workers with Wrangler (Current Setup)

This website is deployed as a **Cloudflare Worker** that serves static files from GitHub and handles contact form submissions via **Web3Forms**.

#### Deploy with Wrangler CLI

```bash
# Install Wrangler globally (if not already installed)
npm install -g wrangler

# Login to Cloudflare (first time only)
wrangler login

# Deploy the worker
wrangler deploy
```

That's it! Your site will be live on Cloudflare's global network.

#### How It Works

The `worker.js` file:
- **Serves static files** from this GitHub repository with intelligent caching
- **Handles contact forms** at `/api/contact` route using Web3Forms API
- **Handles career applications** at `/careers-application` route using Web3Forms API
- **CORS enabled** for cross-origin requests
- **Automatic content-type detection** for all file types
- **Smart caching** (HTML: 1hr, CSS/JS: 1 day, Images: 1 week)

Your site is deployed with:
- ✅ Free SSL/TLS certificates
- ✅ Global CDN distribution (300+ locations)
- ✅ Integrated contact form handling (no separate Functions needed)
- ✅ Web3Forms email delivery to info@synetica.us and careers@synetica.us
- ✅ Custom domain support
- ✅ Built-in CORS and security headers

#### Configuration Files

- **wrangler.toml**: Worker configuration (worker name, compatibility date)
- **worker.js**: Main worker script with form handlers and static file serving

#### Cloudflare Pages Build Settings

If deploying via Cloudflare Pages with wrangler:

1. Go to **Workers & Pages** > **Synetica Website** > **Settings** > **Builds & deployments**
2. Configure build settings:
   - **Build command**: `npx wrangler deploy`
   - **Build output directory**: `/`

The worker will automatically handle routing and form submissions.

### Custom Domain Setup

After deploying:
1. Go to your [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Workers & Pages** > **synetica-website** (your worker)
3. Click **Settings** > **Domains & Routes**
4. Add your custom domain (e.g., `synetica.us`)
5. Update DNS records as instructed
6. SSL certificate will be automatically provisioned

## File Structure

```
Synetica-Website/
├── index.html                      # Main HTML file
├── styles.css                      # All styles (mobile-first)
├── script.js                       # Interactive features
├── worker.js                       # Cloudflare Worker (handles forms + static files)
├── wrangler.toml                   # Wrangler configuration
├── functions/                      # Legacy Functions directory (not used with worker)
│   ├── api/
│   │   └── contact.js             # Legacy handler (functionality in worker.js)
│   └── careers-application.js     # Legacy handler (functionality in worker.js)
├── _headers                        # HTTP headers
├── _redirects                      # URL redirects
├── .gitignore                      # Git ignore rules
└── README.md                       # Documentation
```

**Note:** When using `worker.js` with wrangler, the form handlers are integrated directly in the worker. The `/functions/` directory is not used.

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

### Contact Forms

The website includes two functional contact forms integrated in **worker.js** and powered by **Web3Forms**:

1. **Contact Form** (`/api/contact`)
   - Handler: Integrated in `worker.js` (`handleContactForm` function)
   - Sends to: `info@synetica.us`
   - Fields: Name, Email, Phone, Company, Message
   - Web3Forms Access Key: `96109e90-d006-4c97-9436-77ad8757b056`

2. **Careers Application** (`/careers-application`)
   - Handler: Integrated in `worker.js` (`handleCareersApplication` function)
   - Sends to: `careers@synetica.us`
   - Supports: Resume attachments (up to 5MB), Position applications
   - Web3Forms Access Key: `47ebe115-0067-49be-a556-4deafa5dbb65`

Both forms are handled directly by the Cloudflare Worker with Web3Forms API for reliable email delivery.

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
- Email: info@synetica.us
- Phone: (716) 341-3678
- Address: 219 Lexington Ave, Buffalo, NY 14222
