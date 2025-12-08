/**
 * Cloudflare Worker for Synetica MSP Website
 * Serves static files from GitHub and routes to Pages Functions
 */

// Import Functions (using named imports)
import * as apiContact from './functions/api/contact.js';
import * as careersApp from './functions/careers-application.js';

// Cache configuration
const CACHE_CONFIG = {
  HTML: 'no-cache, no-store, must-revalidate, max-age=0',
  CSS: 'no-cache, no-store, must-revalidate, max-age=0',
  JS: 'no-cache, no-store, must-revalidate, max-age=0',
  IMAGES: 'public, max-age=604800, s-maxage=2592000',
};

// File mappings
const FILE_MAP = {
  '/': 'index.html',
  '/index.html': 'index.html',
  '/careers.html': 'careers.html',
  '/styles.css': 'styles.css',
  '/script.js': 'script.js',
  '/careers.js': 'careers.js',
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

      // Route to Functions
      if (pathname === '/api/contact') {
        if (request.method === 'POST') {
          return apiContact.onRequestPost({ request, env, ctx });
        } else if (request.method === 'OPTIONS') {
          return apiContact.onRequestOptions();
        }
        return new Response('Method not allowed', { status: 405 });
      }

      if (pathname === '/careers-application') {
        if (request.method === 'POST') {
          return careersApp.onRequestPost({ request, env, ctx });
        } else if (request.method === 'OPTIONS') {
          return careersApp.onRequestOptions();
        }
        return new Response('Method not allowed', { status: 405 });
      }

      // Handle static files from GitHub
      let fileName = FILE_MAP[pathname] || pathname.slice(1);

      // Security: Prevent directory traversal
      if (fileName.includes('..') || fileName.includes('//')) {
        return new Response('Invalid path', { status: 400 });
      }

      // Build GitHub URL
      const githubUrl = GITHUB_BASE + fileName;
      const extension = fileName.substring(fileName.lastIndexOf('.'));

      // Fetch from GitHub
      let response = await fetch(githubUrl);

      if (!response.ok) {
        return new Response(`File not found: ${fileName}`, { status: 404 });
      }

      // Determine content type and cache control
      const contentType = CONTENT_TYPES[extension] || 'text/plain';
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
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()',
      });

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers,
      });
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(
        `Error: ${error.message}`,
        {
          status: 500,
          headers: { 'Content-Type': 'text/plain' }
        }
      );
    }
  },
};
