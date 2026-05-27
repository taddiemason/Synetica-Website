import { EmailMessage } from "cloudflare:email";

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

    const name = formData.get('name');
    const email = formData.get('email');
    const phone = formData.get('phone');
    const company = formData.get('company');
    const message = formData.get('message');

    if (!name || !email || !message) {
      return jsonResponse({ success: false, message: 'Name, email, and message are required' }, 400, corsHeaders);
    }

    const bodyLines = [
      `Name: ${name}`,
      `Email: ${email}`,
      phone   ? `Phone: ${phone}`     : null,
      company ? `Company: ${company}` : null,
      '',
      'Message:',
      message,
    ].filter(l => l !== null);

    const raw = buildEmail({
      from:    'noreply@synetica.us',
      to:      'info@synetica.us',
      replyTo: `${name} <${email}>`,
      subject: `New Contact: ${name} — Synetica Website`,
      body:    bodyLines.join('\n'),
    });

    const msg = new EmailMessage('noreply@synetica.us', 'info@synetica.us', raw);
    await env.EMAIL.send(msg);

    return jsonResponse({ success: true, message: 'Thank you! Your message has been sent successfully.' }, 200, corsHeaders);

  } catch (error) {
    console.error('Contact form error:', error);
    return jsonResponse({ success: false, message: 'Failed to send message. Please try again.' }, 500, corsHeaders);
  }
}

async function handleCareersApplication(request, env, corsHeaders) {
  try {
    const formData = await request.formData();

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

    if (resume.size > 5 * 1024 * 1024) {
      return jsonResponse({ success: false, error: 'Resume file size must be less than 5MB' }, 400, corsHeaders);
    }

    const bodyLines = [
      `Name: ${firstName} ${lastName}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      `Position: ${position}`,
      `Experience: ${experience || 'Not specified'}`,
      `LinkedIn: ${linkedin || 'Not provided'}`,
      '',
      'Cover Letter:',
      coverLetter || 'Not provided',
    ];

    const resumeBuffer = await resume.arrayBuffer();
    const resumeBase64 = wrapBase64(Buffer.from(resumeBuffer).toString('base64'));

    const raw = buildEmailWithAttachment({
      from:        'noreply@synetica.us',
      to:          'careers@synetica.us',
      replyTo:     `${firstName} ${lastName} <${email}>`,
      subject:     `New Job Application: ${position} — ${firstName} ${lastName}`,
      body:        bodyLines.join('\n'),
      attachment: {
        filename:    resume.name,
        contentType: resume.type || 'application/octet-stream',
        base64:      resumeBase64,
      },
    });

    const msg = new EmailMessage('noreply@synetica.us', 'careers@synetica.us', raw);
    await env.EMAIL.send(msg);

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

function buildEmail({ from, to, replyTo, subject, body }) {
  return [
    `From: Synetica <${from}>`,
    `To: ${to}`,
    `Reply-To: ${replyTo}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset=utf-8`,
    ``,
    body,
  ].join('\r\n');
}

function buildEmailWithAttachment({ from, to, replyTo, subject, body, attachment }) {
  const boundary = `----=_Part_${Date.now()}`;

  return [
    `From: Synetica Careers <${from}>`,
    `To: ${to}`,
    `Reply-To: ${replyTo}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset=utf-8`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    body,
    ``,
    `--${boundary}`,
    `Content-Type: ${attachment.contentType}`,
    `Content-Disposition: attachment; filename="${attachment.filename}"`,
    `Content-Transfer-Encoding: base64`,
    ``,
    attachment.base64,
    `--${boundary}--`,
  ].join('\r\n');
}

function wrapBase64(b64) {
  return b64.match(/.{1,76}/g).join('\r\n');
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
