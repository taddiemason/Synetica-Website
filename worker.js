import { contactEmail, careersEmail, sendFormEmail } from './lib/email.js';

const MAX_RESUME_BYTES = 5 * 1024 * 1024;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (path === '/api/contact' && request.method === 'POST') {
      return handleContactForm(request, env, corsHeaders);
    }

    if (path === '/careers-application' && request.method === 'POST') {
      return handleCareersApplication(request, env, corsHeaders);
    }

    try {
      const assetResponse = await env.ASSETS.fetch(request);
      const response = new Response(assetResponse.body, assetResponse);

      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      response.headers.set('Cache-Control', getCacheControl(path));
      return response;
    } catch (error) {
      console.error('Error serving asset:', error);
      return new Response('Not Found', { status: 404 });
    }
  }
};

async function handleContactForm(request, env, corsHeaders) {
  try {
    const formData = await request.formData();

    // Honeypot: bots fill the hidden "_hp" field. Silently accept and drop.
    if (formData.get('_hp')) {
      return jsonResponse({ success: true, message: 'Thank you! Your message has been sent successfully.' }, 200, corsHeaders);
    }

    const name    = formData.get('name');
    const email   = formData.get('email');
    const phone   = formData.get('phone');
    const company = formData.get('company');
    const message = formData.get('message');

    if (!name || !email || !message) {
      return jsonResponse({ success: false, message: 'Name, email, and message are required' }, 400, corsHeaders);
    }

    const { subject, text, html } = contactEmail({ name, email, phone, company, message });

    await sendFormEmail(env, {
      to:      env.CONTACT_TO,
      replyTo: email,
      subject,
      text,
      html,
    });

    return jsonResponse({ success: true, message: 'Thank you! Your message has been sent successfully.' }, 200, corsHeaders);

  } catch (error) {
    console.error('Contact form error:', error);
    return jsonResponse({ success: false, message: 'Failed to send message. Please try again.' }, 500, corsHeaders);
  }
}

async function handleCareersApplication(request, env, corsHeaders) {
  try {
    const formData = await request.formData();

    // Honeypot: bots fill the hidden "_hp" field. Silently accept and drop.
    if (formData.get('_hp')) {
      return jsonResponse({ success: true, message: 'Application submitted successfully! We will review your application and get back to you soon.' }, 200, corsHeaders);
    }

    const firstName   = formData.get('firstName');
    const lastName    = formData.get('lastName');
    const email       = formData.get('email');
    const phone       = formData.get('phone');
    const position    = formData.get('position');
    const experience  = formData.get('experience');
    const linkedin    = formData.get('linkedin');
    const coverLetter = formData.get('coverLetter');
    const resume      = formData.get('resume');

    if (!firstName || !lastName || !email || !phone || !position || !resume) {
      return jsonResponse({ success: false, error: 'Missing required fields' }, 400, corsHeaders);
    }

    if (!resume || resume.size === 0) {
      return jsonResponse({ success: false, error: 'Resume file is required' }, 400, corsHeaders);
    }

    if (resume.size > MAX_RESUME_BYTES) {
      return jsonResponse({ success: false, error: 'Resume file size must be less than 5MB' }, 400, corsHeaders);
    }

    const { subject, text, html } = careersEmail({
      firstName, lastName, email, phone, position, experience, linkedin, coverLetter,
    });

    await sendFormEmail(env, {
      to:      env.CAREERS_TO,
      replyTo: email,
      subject,
      text,
      html,
      attachment: {
        content:  await resume.arrayBuffer(),
        filename: resume.name,
        type:     resume.type,
      },
    });

    return jsonResponse({
      success: true,
      message: 'Application submitted successfully! We will review your application and get back to you soon.'
    }, 200, corsHeaders);

  } catch (error) {
    console.error('Career application error:', error);
    return jsonResponse({
      success: false,
      error: 'Failed to submit application. Please email your resume to careers@synetica.us'
    }, 500, corsHeaders);
  }
}

function jsonResponse(data, status, corsHeaders) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function getCacheControl(path) {
  const ext = path.split('.').pop().toLowerCase();

  if (ext === 'html' || path === '/') return 'public, max-age=3600';
  if (ext === 'css' || ext === 'js')  return 'public, max-age=86400';

  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'woff', 'woff2', 'ttf', 'eot'].includes(ext)) {
    return 'public, max-age=604800';
  }

  return 'public, max-age=3600';
}
