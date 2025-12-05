/**
 * Cloudflare Worker for Synetica MSP Website
 * Serves static files with caching and proper content types
 * Version: 2025-12-05 - HTML caching disabled for immediate updates
 */

// Cache configuration - HTML caching disabled to ensure fresh content
const CACHE_CONFIG = {
  HTML: 'no-cache, no-store, must-revalidate, max-age=0', // Always fetch fresh HTML
  CSS: 'public, max-age=86400, s-maxage=604800', // 1 day browser, 1 week CDN
  JS: 'public, max-age=86400, s-maxage=604800',
  IMAGES: 'public, max-age=604800, s-maxage=2592000', // 1 week browser, 30 days CDN
};

// File mappings
const FILE_MAP = {
  '/': 'index.html',
  '/index.html': 'index.html',
  '/styles.css': 'styles.css',
  '/script.js': 'script.js',
};

// Content type mappings
const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

// GitHub base URL for raw files
const GITHUB_BASE = 'https://raw.githubusercontent.com/taddiemason/Synetica-Website/claude/synetica-msp-website-012TNubQC37JiDpKAZqpcmHL/';

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      const pathname = url.pathname;

      // Map the pathname to a file
      let fileName = FILE_MAP[pathname] || pathname.slice(1);

      // Security: Prevent directory traversal
      if (fileName.includes('..') || fileName.includes('//')) {
        return new Response('Invalid path', { status: 400 });
      }

      // Build GitHub URL
      const githubUrl = GITHUB_BASE + fileName;

      // Determine file extension
      const extension = fileName.substring(fileName.lastIndexOf('.'));
      const isHTML = extension === '.html' || fileName === 'index.html';

      // Try cache first (skip cache for HTML files to ensure fresh content)
      const cache = caches.default;
      let response;

      if (!isHTML) {
        response = await cache.match(request);

        if (response) {
          // Return cached response
          const headers = new Headers(response.headers);
          headers.set('X-Cache', 'HIT');
          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: headers,
          });
        }
      }

      // Fetch from GitHub (always fresh for HTML files)
      response = await fetch(githubUrl);

      if (!response.ok) {
        return new Response(`File not found: ${fileName}`, { status: 404 });
      }

      // Determine content type
      const contentType = CONTENT_TYPES[extension] || 'text/plain';

      // Determine cache control
      let cacheControl;
      if (extension === '.html') {
        cacheControl = CACHE_CONFIG.HTML;
      } else if (extension === '.css') {
        cacheControl = CACHE_CONFIG.CSS;
      } else if (extension === '.js') {
        cacheControl = CACHE_CONFIG.JS;
      } else if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico'].includes(extension)) {
        cacheControl = CACHE_CONFIG.IMAGES;
      } else {
        cacheControl = 'public, max-age=3600';
      }

      // Create response with proper headers
      const headers = new Headers({
        'Content-Type': contentType,
        'Cache-Control': cacheControl,
        'X-Cache': 'MISS',
        'X-Content-Source': 'GitHub',
        // Security headers
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()',
      });

      const modifiedResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers,
      });

      // Store in cache (skip caching HTML files for immediate updates)
      if (!isHTML) {
        ctx.waitUntil(cache.put(request, modifiedResponse.clone()));
      }

      return modifiedResponse;
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(
        `Error loading website: ${error.message}`,
        {
          status: 500,
          headers: { 'Content-Type': 'text/plain' }
        }
      );
    }
  },
};
