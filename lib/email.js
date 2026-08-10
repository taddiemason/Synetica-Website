// Transactional email for the Synetica website forms.
//
// Primary transport is the Cloudflare Email Service `send_email` binding
// (env.EMAIL) — no API key to leak, and SPF/DKIM are managed by Cloudflare
// under cf-bounce.synetica.us, leaving the M365 records on the apex alone.
//
// Resend is kept as a fallback so this can ship BEFORE synetica.us finishes
// onboarding onto Email Sending. Once `wrangler email sending dns get
// synetica.us` is clean and a test submission lands in the inbox with
// dkim=pass, delete sendViaResend() below and remove the RESEND_API_KEY secret.
//
// ── Editing these emails ─────────────────────────────────────────────────
// Look/wording lives in brandedEmailHtml() and the *Text() builders. Keep the
// text and HTML versions in sync — the plain-text part is the fallback for
// clients that don't render HTML and it measurably helps deliverability.
// Rules of thumb for HTML email: tables + inline styles only (no <style>
// blocks, no external CSS), stay under ~100KB, and never reference remote
// images (most clients block them and they hurt spam scores).
//
// Unlike an account-verification email, these ARE the product: a dropped send
// is a lost lead. So sends are deliberately NOT best-effort — they throw, and
// the route turns that into a 500 that tells the visitor to email us directly.

const FROM_NAME = 'Synetica Website';

// Pulled from the site's design system in styles.css.
const BRAND = {
  name: 'Synetica',
  accent: '#3B82F6',        // blue-500
  accentSoft: '#60A5FA',    // blue-400
  buttonText: '#F8FAFC',
  pageBg: '#020817',        // bg-void
  cardBg: '#0D1525',        // bg-space
  blockBg: '#111C32',       // bg-surface
  border: '#1E2A44',
  heading: '#F8FAFC',
  body: '#CBD5E1',
  muted: '#64748B',
  footer: '#475569',
};

const EMAIL_FONT = "font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;";

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Escape, then preserve the submitter's line breaks. Outlook's Word engine is
// unreliable with white-space:pre-wrap, so use explicit <br>.
function escapeHtmlMultiline(s) {
  return escapeHtml(s).replace(/\r\n|\r|\n/g, '<br>');
}

// Shared branded HTML shell: dark card, wordmark, a label/value field table,
// and optional free-text blocks (message body, cover letter). Table + inline
// styles for broad client support. Every caller-supplied string is escaped,
// so it is safe to pass raw form input straight in.
export function brandedEmailHtml({ title, preview, heading, fields = [], blocks = [], footerNote }) {
  const headingHtml = heading
    ? `<p style="margin:0 0 24px; ${EMAIL_FONT} font-size:18px; font-weight:600; line-height:1.4; color:${BRAND.heading};">${escapeHtml(heading)}</p>`
    : '';

  const fieldsHtml = fields.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 26px;">
              ${fields
                .map(
                  ({ label, value }) => `<tr>
                <td style="padding:0 12px 10px 0; ${EMAIL_FONT} font-size:13px; line-height:1.5; color:${BRAND.muted}; white-space:nowrap; vertical-align:top;">${escapeHtml(label)}</td>
                <td style="padding:0 0 10px; ${EMAIL_FONT} font-size:15px; line-height:1.5; color:${BRAND.heading}; word-break:break-word;">${escapeHtml(value)}</td>
              </tr>`
                )
                .join('\n              ')}
            </table>`
    : '';

  const blocksHtml = blocks
    .map(
      ({ label, value }) => `<p style="margin:0 0 8px; ${EMAIL_FONT} font-size:13px; line-height:1.5; color:${BRAND.muted};">${escapeHtml(label)}</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 26px;">
              <tr>
                <td style="background:${BRAND.blockBg}; border:1px solid ${BRAND.border}; border-radius:10px; padding:16px 18px; ${EMAIL_FONT} font-size:15px; line-height:1.6; color:${BRAND.body};">${escapeHtmlMultiline(value)}</td>
              </tr>
            </table>`
    )
    .join('\n            ');

  const footerNoteHtml = footerNote
    ? `<p style="margin:0; ${EMAIL_FONT} font-size:13px; line-height:1.5; color:${BRAND.muted};">${escapeHtml(footerNote)}</p>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark light">
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0; padding:0; background:${BRAND.pageBg}; -webkit-font-smoothing:antialiased;">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0;">${escapeHtml(preview || title)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.pageBg};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:560px; max-width:100%;">
          <tr>
            <td style="padding:0 8px 20px; ${EMAIL_FONT} font-size:20px; font-weight:700; color:${BRAND.accent}; letter-spacing:0.3px;">
              ${BRAND.name}
            </td>
          </tr>
          <tr>
            <td style="background:${BRAND.cardBg}; border:1px solid ${BRAND.border}; border-radius:14px; padding:32px;">
              ${headingHtml}
              ${fieldsHtml}
              ${blocksHtml}
              ${footerNoteHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 8px 0; ${EMAIL_FONT} font-size:12px; color:${BRAND.footer};">
              Sent automatically from the ${BRAND.name} website.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Plain-text counterpart to brandedEmailHtml.
function brandedEmailText({ heading, fields = [], blocks = [], footerNote }) {
  const lines = [];
  if (heading) lines.push(heading, '');
  for (const { label, value } of fields) lines.push(`${label}: ${value}`);
  for (const { label, value } of blocks) lines.push('', `${label}:`, value);
  if (footerNote) lines.push('', footerNote);
  lines.push('', `— Sent automatically from the ${BRAND.name} website.`);
  return lines.join('\n');
}

// True once the Email Service binding exists AND a real from-address is set.
// Until synetica.us is onboarded and EMAIL_FROM points at it, callers fall
// back to Resend rather than dropping the submission.
export function emailConfigured(env) {
  const from = env?.EMAIL_FROM;
  return !!env?.EMAIL && !!from && !from.endsWith('@yourdomain.com');
}

// Form input flows into the Subject header. The Email Service API takes
// structured fields rather than raw MIME, so it should handle this, but strip
// CR/LF ourselves rather than trusting that — a newline in a header value is
// the classic header-injection vector. Also cap the length so a pathological
// submission can't produce a 10KB subject line.
function singleLine(s, max = 120) {
  const cleaned = String(s ?? '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return cleaned.length > max ? `${cleaned.slice(0, max - 1)}…` : cleaned;
}

// MIME filenames end up in a Content-Disposition header; strip anything that
// could break out of it.
function safeFilename(name, fallback) {
  const cleaned = String(name || '')
    .replace(/[\r\n"\\]/g, '')
    .replace(/[/\\]/g, '-')
    .trim();
  return cleaned || fallback;
}

// ── Contact form ─────────────────────────────────────────────────────────

export function contactEmail({ name, email, phone, company, message }) {
  const fields = [
    { label: 'Name', value: name },
    { label: 'Email', value: email },
    phone ? { label: 'Phone', value: phone } : null,
    company ? { label: 'Company', value: company } : null,
  ].filter(Boolean);

  const content = {
    heading: 'New contact form submission',
    fields,
    blocks: [{ label: 'Message', value: message }],
    footerNote: `Reply directly to this email to respond to ${name}.`,
  };

  return {
    subject: `New Contact: ${singleLine(name, 80)} — Synetica Website`,
    text: brandedEmailText(content),
    html: brandedEmailHtml({
      title: 'New contact form submission',
      preview: `${name}${company ? ` (${company})` : ''} — ${String(message).slice(0, 90)}`,
      ...content,
    }),
  };
}

// ── Careers application ──────────────────────────────────────────────────

export function careersEmail({ firstName, lastName, email, phone, position, experience, linkedin, coverLetter }) {
  const fullName = `${firstName} ${lastName}`;
  const content = {
    heading: `New application: ${position}`,
    fields: [
      { label: 'Name', value: fullName },
      { label: 'Email', value: email },
      { label: 'Phone', value: phone },
      { label: 'Position', value: position },
      { label: 'Experience', value: experience || 'Not specified' },
      { label: 'LinkedIn', value: linkedin || 'Not provided' },
    ],
    blocks: [{ label: 'Cover Letter', value: coverLetter || 'Not provided' }],
    footerNote: `Résumé attached. Reply directly to this email to reach ${firstName}.`,
  };

  return {
    subject: `New Job Application: ${singleLine(position, 60)} — ${singleLine(fullName, 60)}`,
    text: brandedEmailText(content),
    html: brandedEmailHtml({
      title: `New application: ${position}`,
      preview: `${fullName} applied for ${position}`,
      ...content,
    }),
  };
}

// ── Transport ────────────────────────────────────────────────────────────

// Sends via the Cloudflare Email Service binding, falling back to Resend while
// the domain finishes onboarding. Throws if neither transport works, so the
// caller can tell the visitor their submission did not go through.
export async function sendFormEmail(env, { to, replyTo, subject, text, html, attachment }) {
  if (emailConfigured(env)) {
    try {
      const message = {
        to,
        from: { email: env.EMAIL_FROM, name: FROM_NAME },
        replyTo,
        subject,
        text,
        html,
      };
      if (attachment) {
        message.attachments = [
          {
            // The Workers binding takes raw bytes — no base64 hop needed.
            content: attachment.content,
            filename: safeFilename(attachment.filename, 'resume'),
            type: attachment.type || 'application/octet-stream',
            disposition: 'attachment',
          },
        ];
      }
      return await env.EMAIL.send(message);
    } catch (err) {
      // E_SENDER_NOT_VERIFIED means onboarding isn't finished; anything else is
      // worth a look in the logs. Either way, try Resend before giving up.
      console.error('[email] Cloudflare send failed:', err?.code || '', err?.message || err);
      if (!env.RESEND_API_KEY) throw err;
    }
  }

  return sendViaResend(env, { to, replyTo, subject, text, html, attachment });
}

// DELETE ME once the Cloudflare path is verified in production.
async function sendViaResend(env, { to, replyTo, subject, text, html, attachment }) {
  if (!env.RESEND_API_KEY) {
    throw new Error('No email transport configured (no EMAIL binding, no RESEND_API_KEY)');
  }

  const payload = {
    from: `${FROM_NAME} <${env.EMAIL_FROM || 'noreply@synetica.us'}>`,
    to,
    reply_to: replyTo,
    subject,
    text,
    html,
  };

  if (attachment) {
    // Resend, unlike the binding, wants base64.
    payload.attachments = [
      {
        filename: safeFilename(attachment.filename, 'resume'),
        content: base64FromArrayBuffer(attachment.content),
      },
    ];
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Resend API error ${response.status}: ${await response.text()}`);
  }

  console.log('[email] sent via Resend fallback');
  return response.json();
}

// Chunked so a multi-MB résumé doesn't blow the argument limit on
// String.fromCharCode. Avoids needing nodejs_compat just for Buffer.
function base64FromArrayBuffer(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}
