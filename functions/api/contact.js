// /functions/api/contact.js
export async function onRequestPost({ request, env }) {
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
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Email body
    const emailBody = `
New Contact Form Submission

Name: ${name}
Email: ${email}
Phone: ${phone || 'Not provided'}
Company: ${company || 'Not provided'}

Message:
${message}
    `.trim();

    // Send email using MailChannels (free with Cloudflare)
    const send_request = new Request('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: 'info@synetica.us' }], // Your email
          },
        ],
        from: {
          email: 'noreply@synetica.us',
          name: 'Synetica Website',
        },
        subject: `New Contact from ${name}`,
        content: [
          {
            type: 'text/plain',
            value: emailBody,
          },
        ],
      }),
    });

    const response = await fetch(send_request);

    if (response.ok) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Message sent successfully!'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      throw new Error('Failed to send email');
    }

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: 'Failed to send message. Please try again.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
