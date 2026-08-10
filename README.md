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

This website is deployed as a **Cloudflare Worker** that serves static files and handles form submissions, sending email via **Cloudflare Email Service**.

Pushes to `main` deploy automatically via Cloudflare Workers Builds. If you
rename the branch, update the watched branch in **Workers & Pages →
synetica-website → Settings → Builds**, or auto-deploys stop silently.

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
- **Serves static files** from this repository with intelligent caching
- **Handles contact forms** at `/api/contact` → emails `info@synetica.us`
- **Handles career applications** at `/careers-application` → emails `careers@synetica.us` with the résumé attached
- **CORS enabled** for cross-origin requests
- **Smart caching** (HTML: 1hr, CSS/JS: 1 day, Images: 1 week)

Email templates and transport live in `lib/email.js`, so changing wording or
swapping providers is a one-file change.

#### Configuration Files

- **wrangler.toml**: Worker config — the `send_email` binding, and the
  `EMAIL_FROM` / `CONTACT_TO` / `CAREERS_TO` vars
- **worker.js**: Routing, validation, static file serving
- **lib/email.js**: Email templates (branded HTML + plain text) and sending
- **.assetsignore**: Keeps `worker.js`, `wrangler.toml`, and `lib/` from being
  served publicly — `[assets] directory = "."` would otherwise expose them

## Email Setup

Forms send through [Cloudflare Email Service](https://developers.cloudflare.com/email-service/)
via the `send_email` binding — no API keys in the codebase.

`synetica.us` receives mail on Microsoft 365, and Email Sending does **not**
interfere with that: it provisions SPF, DKIM, and bounce-handling MX records
under `cf-bounce.synetica.us`, leaving the apex `MX`, SPF, and
`selector1`/`selector2._domainkey` records for M365 untouched. SPF is evaluated
against the `cf-bounce` Return-Path, and DMARC passes via DKIM alignment.

### One-time domain onboarding

```bash
npx wrangler email sending enable synetica.us
npx wrangler email sending dns get synetica.us   # verify records landed
```

⚠️ Onboarding overwrites `_dmarc.synetica.us` with `v=DMARC1; p=reject;`.
Restore the existing policy immediately afterward so DMARC reports keep flowing
and M365 mail isn't hard-rejected before alignment is confirmed:

```
v=DMARC1; p=none; rua=mailto:1599970809bc49df9f2376a9238c6baf@dmarc-reports.cloudflare.net
```

Tighten to `p=quarantine; pct=25` and then `p=reject` only once DMARC reports
show both M365 and Cloudflare passing.

Also trim the stale MailChannels include from the apex SPF record (left over
from an earlier setup, and a wasted lookup against SPF's 10-lookup limit):

```
v=spf1 include:spf.protection.outlook.com -all
```

### Verifying

After deploying, submit the contact form and confirm the mail lands in the
`info@synetica.us` **Inbox** (not Junk) with `dkim=pass` and `dmarc=pass` in
the `Authentication-Results` header. Then:

1. Delete `sendViaResend()` from `lib/email.js`
2. `npx wrangler secret delete RESEND_API_KEY`

Until that's done, sends fall back to Resend automatically if the Cloudflare
binding rejects them, so form submissions are never silently dropped.

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
├── worker.js                       # Cloudflare Worker (routing + static files)
├── lib/
│   └── email.js                   # Email templates + Email Service sending
├── wrangler.toml                   # Wrangler configuration
├── .assetsignore                   # Keeps source/config out of public assets
├── _headers                        # HTTP headers
├── _redirects                      # URL redirects
├── .gitignore                      # Git ignore rules
└── README.md                       # Documentation
```

## Customization

### Colors
Edit CSS variables in `styles.css`. Note that `lib/email.js` carries its own
copy of the palette — HTML email requires inline styles, so it can't read the
stylesheet. Update both if you rebrand.

```css
:root {
    --blue-500: #3B82F6;
    --cyan-500: #06B6D4;
    --orange-500: #F97316;
}
```

### Content
- Update company information in `index.html`
- Modify services, features, and contact details as needed
- Replace placeholder contact information with actual data

### Contact Forms

Two forms, both handled in `worker.js` with templates in `lib/email.js`:

1. **Contact Form** (`POST /api/contact`)
   - Handler: `handleContactForm`
   - Sends to: `CONTACT_TO` (`info@synetica.us`)
   - Fields: Name, Email, Phone, Company, Message
   - `Reply-To` is set to the visitor, so replying goes straight to them

2. **Careers Application** (`POST /careers-application`)
   - Handler: `handleCareersApplication`
   - Sends to: `CAREERS_TO` (`careers@synetica.us`)
   - Résumé attached, 5MB cap (Email Service allows 25 MiB total)
   - `Reply-To` is set to the applicant

Recipients are configured as vars in `wrangler.toml`, not hardcoded. See
[Email Setup](#email-setup) for domain onboarding.

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
  
