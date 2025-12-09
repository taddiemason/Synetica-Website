/**
 * Cloudflare Worker with Static Assets
 * Serves static files and handles contact form submissions via Web3Forms
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Handle contact form submission
    if (path === '/api/contact' && request.method === 'POST') {
      return handleContactForm(request, corsHeaders);
    }

    // Handle careers application submission
    if (path === '/careers-application' && request.method === 'POST') {
      return handleCareersApplication(request, corsHeaders);
    }

    // Serve static assets using Cloudflare Assets
    try {
      // Use the ASSETS binding to serve static files
      const assetResponse = await env.ASSETS.fetch(request);

      // Clone the response so we can modify headers
      const response = new Response(assetResponse.body, assetResponse);

      // Add CORS headers to all responses
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      // Set cache control
      response.headers.set('Cache-Control', getCacheControl(path));

      return response;
    } catch (error) {
      console.error('Error serving asset:', error);
      return new Response('Not Found', { status: 404 });
    }
  }
};

/**
 * Handle contact form submission via Web3Forms
 */
async function handleContactForm(request, corsHeaders) {
  try {
    const formData = await request.formData();

    // Extract form fields
    const name = formData.get('name');
    const email = formData.get('email');
    const phone = formData.get('phone');
    const company = formData.get('company');
    const message = formData.get('message');

    // Validate required fields
    if (!name || !email || !message) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Name, email, and message are required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Prepare Web3Forms payload
    const web3formsData = new FormData();
    web3formsData.append('access_key', '96109e90-d006-4c97-9436-77ad8757b056');
    web3formsData.append('name', name);
    web3formsData.append('email', email);
    web3formsData.append('phone', phone || 'Not provided');
    web3formsData.append('company', company || 'Not provided');
    web3formsData.append('message', message);
    web3formsData.append('subject', `New Contact from ${name} - Synetica Website`);
    web3formsData.append('from_name', 'Synetica Website');
    web3formsData.append('to_email', 'info@synetica.us');
    web3formsData.append('redirect', 'false');

    console.log('Sending to Web3Forms:', {
      name,
      email,
      phone: phone || 'Not provided',
      company: company || 'Not provided',
      message: message.substring(0, 50) + '...'
    });

    // Send to Web3Forms API
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: web3formsData
    });

    const result = await response.json();

    console.log('Web3Forms response status:', response.status);
    console.log('Web3Forms response:', result);

    if (result.success) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Thank you! Your message has been sent successfully.'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      console.error('Web3Forms error:', {
        status: response.status,
        result: result
      });
      return new Response(JSON.stringify({
        success: false,
        message: `Error: ${result.message || 'Failed to send message. Please try again.'}`
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Form submission error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: `Error: ${error.message}`
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Handle careers application submission via Web3Forms
 */
async function handleCareersApplication(request, corsHeaders) {
  try {
    const formData = await request.formData();

    const firstName = formData.get('firstName');
    const lastName = formData.get('lastName');
    const email = formData.get('email');
    const phone = formData.get('phone');
    const position = formData.get('position');
    const experience = formData.get('experience');
    const linkedin = formData.get('linkedin');
    const coverLetter = formData.get('coverLetter');
    const resume = formData.get('resume');

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !position || !resume) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate file
    if (!resume || resume.size === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Resume file is required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check file size (5MB max)
    if (resume.size > 5 * 1024 * 1024) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Resume file size must be less than 5MB'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Prepare Web3Forms payload
    const web3formsData = new FormData();
    web3formsData.append('access_key', '47ebe115-0067-49be-a556-4deafa5dbb65');
    web3formsData.append('subject', `New Job Application: ${position} - ${firstName} ${lastName}`);
    web3formsData.append('from_name', `${firstName} ${lastName}`);
    web3formsData.append('email', email);
    web3formsData.append('name', `${firstName} ${lastName}`);
    web3formsData.append('phone', phone);
    web3formsData.append('position', position);
    web3formsData.append('experience', experience);
    web3formsData.append('linkedin', linkedin);
    web3formsData.append('message', coverLetter);
    web3formsData.append('to_email', 'careers@synetica.us');
    web3formsData.append('redirect', 'false');
    web3formsData.append('attachment', resume);

    console.log('Submitting career application to Web3Forms:', {
      name: `${firstName} ${lastName}`,
      email,
      position,
      resumeSize: resume.size,
      resumeName: resume.name
    });

    // Send to Web3Forms API
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: web3formsData
    });

    const result = await response.json();

    console.log('Web3Forms response:', result);

    if (result.success) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Application submitted successfully! We will review your application and get back to you soon.'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      console.error('Web3Forms error:', result);
      return new Response(JSON.stringify({
        success: false,
        error: result.message || 'Failed to submit application. Please email your resume to careers@synetica.us'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Career application submission error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to submit application. Please email your resume to careers@synetica.us'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Get content type based on file extension
 */
function getContentType(path) {
  const ext = path.split('.').pop().toLowerCase();
  const types = {
    'html': 'text/html; charset=utf-8',
    'css': 'text/css; charset=utf-8',
    'js': 'application/javascript; charset=utf-8',
    'json': 'application/json; charset=utf-8',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon',
    'pdf': 'application/pdf',
    'woff': 'font/woff',
    'woff2': 'font/woff2',
    'ttf': 'font/ttf',
    'eot': 'application/vnd.ms-fontobject',
  };
  return types[ext] || 'text/plain';
}

/**
 * Get cache control header based on file type
 */
function getCacheControl(path) {
  const ext = path.split('.').pop().toLowerCase();

  // HTML: 1 hour
  if (ext === 'html' || path === '/') {
    return 'public, max-age=3600';
  }

  // CSS/JS: 1 day
  if (ext === 'css' || ext === 'js') {
    return 'public, max-age=86400';
  }

  // Images/Fonts: 1 week
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'woff', 'woff2', 'ttf', 'eot'].includes(ext)) {
    return 'public, max-age=604800';
  }

  // Default: 1 hour
  return 'public, max-age=3600';
}
