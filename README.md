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

### Cloudflare Pages (Current Setup)

This website is deployed on **Cloudflare Pages** with serverless Functions for contact form handling.

#### Automatic Deployment

The site automatically deploys from this GitHub repository using Cloudflare Pages:

1. **Static Files**: HTML, CSS, JS served from the repository root
2. **Serverless Functions**: Located in `/functions/` directory
   - `/functions/api/contact.js` → Routes to `/api/contact`
   - `/functions/careers-application.js` → Routes to `/careers-application`

#### Cloudflare Pages Configuration

**IMPORTANT**: The build settings must be configured correctly in Cloudflare Dashboard:

1. Go to **Workers & Pages** > **Synetica Website** > **Settings** > **Builds & deployments**
2. Configure build settings:
   - **Build command**: Leave empty or set to `echo "No build needed"`
   - **Build output directory**: `/` (root directory)
3. **Do NOT use** `npx wrangler deploy` or any worker deployment commands

#### How It Works

- **Static files** are served directly from the repository
- **Functions** are automatically deployed from the `/functions/` directory
- **Automatic routing**: Cloudflare Pages routes requests based on file structure
  - `/api/contact` → `/functions/api/contact.js`
  - `/careers-application` → `/functions/careers-application.js`

Your site is deployed with:
- ✅ Free SSL/TLS certificates
- ✅ Global CDN distribution (300+ locations)
- ✅ Serverless Functions for form handling
- ✅ Web3Forms integration for email delivery
- ✅ Custom domain support
- ✅ Built-in security headers

### Custom Domain Setup

After deploying:
1. Go to your [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Workers & Pages** > **Synetica Website**
3. Click **Custom domains** > **Set up a custom domain**
4. Add your custom domain (e.g., `synetica.us`)
5. Update DNS records as instructed
6. SSL certificate will be automatically provisioned

## File Structure

```
Synetica-Website/
├── index.html                      # Main HTML file
├── styles.css                      # All styles (mobile-first)
├── script.js                       # Interactive features
├── functions/                      # Cloudflare Pages Functions
│   ├── api/
│   │   └── contact.js             # Contact form handler (/api/contact)
│   └── careers-application.js     # Careers form handler (/careers-application)
├── _headers                        # HTTP headers (for Pages deployment)
├── _redirects                      # URL redirects (for Pages deployment)
├── .gitignore                      # Git ignore rules
└── README.md                       # Documentation
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

### Contact Forms

The website includes two functional contact forms powered by **Web3Forms**:

1. **Contact Form** (`/api/contact`)
   - Handler: `/functions/api/contact.js`
   - Sends to: `info@synetica.us`
   - Fields: Name, Email, Phone, Company, Message

2. **Careers Application** (`/careers-application`)
   - Handler: `/functions/careers-application.js`
   - Sends to: `careers@synetica.us`
   - Supports: Resume attachments, Position applications

Both forms use Cloudflare Pages Functions with Web3Forms API for reliable email delivery.

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
