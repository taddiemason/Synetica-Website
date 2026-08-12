import { contactEmail, careersEmail, sendFormEmail } from './lib/email.js';

const MAX_RESUME_BYTES = 5 * 1024 * 1024;

// --- SyneticaBot (/syneticabot) ---
// Thin proxy in front of the Tier 1 support Worker, reached over a Service
// Binding so the tier chain is never exposed to the internet and the browser
// only ever talks to same-origin URLs (keeps the `connect-src 'self'` CSP).
const BOT_MAX_MESSAGE = 1000;
// Per-IP cap on messages. Generous enough for a real troubleshooting session,
// tight enough that a script can't run up a Workers AI bill.
const BOT_RATE_LIMIT = 20;
const BOT_RATE_WINDOW_SECONDS = 600;
const SESSION_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

    // The bot routes deliberately skip the wildcard CORS headers above: they
    // spend Workers AI on every call, so only our own pages may use them.
    if (path.startsWith('/api/bot/')) {
      if (!isSameOrigin(request, url)) {
        return jsonResponse({ success: false, message: 'Forbidden' }, 403, {});
      }
      if (path === '/api/bot/config' && request.method === 'GET') {
        return jsonResponse({ turnstileSitekey: env.TURNSTILE_SITEKEY || null }, 200, {});
      }
      if (path === '/api/bot/send' && request.method === 'POST') {
        return handleBotSend(request, env);
      }
      if (path === '/api/bot/poll' && request.method === 'GET') {
        return handleBotPoll(request, env);
      }
      return jsonResponse({ success: false, message: 'Not found' }, 404, {});
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

// ── SyneticaBot ───────────────────────────────────────────────────────────────

/**
 * Same-origin check for the bot endpoints.
 *
 * Browsers always send Origin on cross-origin POSTs, so a missing Origin means a
 * same-origin navigation or a non-browser client — neither of which is the case
 * we're guarding against (another website embedding our AI).
 */
function isSameOrigin(request, url) {
  const origin = request.headers.get('Origin');
  if (!origin) return true;
  try {
    return new URL(origin).host === url.host;
  } catch {
    return false;
  }
}

/**
 * The visitor's chat identity: a UUID minted in the browser and sent on every
 * request. Unguessable (122 bits of randomness), which is the whole access
 * control — same model as any opaque session token.
 */
function botSession(request) {
  const id = request.headers.get('X-Bot-Session') || '';
  return SESSION_RE.test(id) ? id : null;
}

/** Ask Tier 1 over the Service Binding. */
function tier1(env, path, init = {}) {
  return env.TIER1_SERVICE.fetch(`https://tier1.internal${path}`, {
    ...init,
    headers: { ...(init.headers || {}), 'X-Web-Secret': env.WEB_CONSULT_SECRET || '' },
  });
}

/**
 * Fixed-window per-IP counter in KV. Approximate by design — a visitor can get
 * up to 2x the cap across a window boundary, which is fine for cost control and
 * far cheaper than a Durable Object per IP.
 */
async function overRateLimit(env, request) {
  if (!env.BOT_RATE_LIMIT_KV) return false; // not configured — fail open

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const window = Math.floor(Date.now() / 1000 / BOT_RATE_WINDOW_SECONDS);
  const key = `bot:rl:${window}:${ip}`;

  const count = parseInt((await env.BOT_RATE_LIMIT_KV.get(key)) || '0', 10) || 0;
  if (count >= BOT_RATE_LIMIT) return true;

  // TTL covers two windows so the key outlives its own window boundary.
  await env.BOT_RATE_LIMIT_KV.put(key, String(count + 1), {
    expirationTtl: BOT_RATE_WINDOW_SECONDS * 2,
  });
  return false;
}

/**
 * Turnstile gate, checked once per session rather than per message.
 *
 * Tokens are single-use, so re-verifying every message means racing the widget's
 * reset — a visitor typing quickly would get rejected. One check at the start of
 * the conversation proves a real browser; the per-IP counter handles volume from
 * there.
 */
async function botVerified(env, session, token, request) {
  if (!env.TURNSTILE_SECRET_KEY) return true; // protection not configured yet

  const key = `bot:verified:${session}`;
  if (env.BOT_RATE_LIMIT_KV && (await env.BOT_RATE_LIMIT_KV.get(key))) return true;

  if (!(await turnstileOk(env, token, request))) return false;

  if (env.BOT_RATE_LIMIT_KV) {
    await env.BOT_RATE_LIMIT_KV.put(key, '1', { expirationTtl: 60 * 60 * 24 });
  }
  return true;
}

/** Cloudflare Turnstile server-side verification. */
async function turnstileOk(env, token, request) {
  if (!token) return false;

  const body = new FormData();
  body.append('secret', env.TURNSTILE_SECRET_KEY);
  body.append('response', token);
  const ip = request.headers.get('CF-Connecting-IP');
  if (ip) body.append('remoteip', ip);

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
    });
    const data = await res.json();
    return data.success === true;
  } catch (error) {
    console.error('Turnstile verify error:', error);
    return false;
  }
}

async function handleBotSend(request, env) {
  const session = botSession(request);
  if (!session) {
    return jsonResponse({ success: false, message: 'Invalid session' }, 400, {});
  }

  if (!env.TIER1_SERVICE) {
    console.error('SyneticaBot: TIER1_SERVICE binding missing');
    return jsonResponse({ success: false, message: 'Support chat is unavailable right now.' }, 503, {});
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ success: false, message: 'Invalid request' }, 400, {});
  }

  const message = typeof body.message === 'string' ? body.message.trim().slice(0, BOT_MAX_MESSAGE) : '';
  if (!message) {
    return jsonResponse({ success: false, message: 'Please type a message first.' }, 400, {});
  }

  if (!(await botVerified(env, session, body.turnstileToken, request))) {
    return jsonResponse(
      { success: false, message: "Couldn't verify you're human. Please reload the page and try again." },
      403,
      {},
    );
  }

  if (await overRateLimit(env, request)) {
    return jsonResponse(
      {
        success: false,
        message: "You've hit the message limit for now. Give it a few minutes, or call us at (716) 259-2627.",
      },
      429,
      {},
    );
  }

  try {
    const res = await tier1(env, '/web/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: session, message }),
    });
    if (!res.ok) {
      console.error('SyneticaBot: Tier 1 send returned', res.status);
      return jsonResponse({ success: false, message: 'The support desk did not accept that. Please try again.' }, 502, {});
    }
    return jsonResponse({ success: true }, 200, {});
  } catch (error) {
    console.error('SyneticaBot send error:', error);
    return jsonResponse({ success: false, message: 'Could not reach the support desk. Please try again.' }, 502, {});
  }
}

async function handleBotPoll(request, env) {
  const session = botSession(request);
  if (!session) {
    return jsonResponse({ success: false, message: 'Invalid session' }, 400, {});
  }

  if (!env.TIER1_SERVICE) {
    return jsonResponse({ messages: [], ticket: null }, 200, {});
  }

  const after = parseInt(new URL(request.url).searchParams.get('after') || '0', 10) || 0;

  try {
    const res = await tier1(env, `/web/messages?session=${session}&after=${after}`);
    if (!res.ok) {
      console.error('SyneticaBot: Tier 1 poll returned', res.status);
      return jsonResponse({ messages: [], ticket: null }, 502, {});
    }
    return new Response(res.body, {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('SyneticaBot poll error:', error);
    return jsonResponse({ messages: [], ticket: null }, 502, {});
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
