// /functions/api/contact.js
export async function onRequestPost({ request, env }) {
  // Add CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

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
        headers: corsHeaders
      });
    }

    // Email body with HTML formatting
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Contact Form Submission</h2>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
          <p><strong>Company:</strong> ${company || 'Not provided'}</p>
        </div>
        <div style="margin-top: 20px;">
          <p><strong>Message:</strong></p>
          <p style="white-space: pre-wrap;">${message}</p>
        </div>
      </div>
    `.trim();

    // Send email using MailChannels
    const emailPayload = {
      personalizations: [
        {
          to: [{ email: 'info@synetica.us', name: 'Synetica' }],
          dkim_domain: 'synetica.us',
          dkim_selector: 'mailchannels',
        },
      ],
      from: {
        email: 'noreply@synetica.us',
        name: 'Synetica Website',
      },
      reply_to: {
        email: email,
        name: name,
      },
      subject: `New Contact from ${name}`,
      content: [
        {
          type: 'text/html',
          value: emailBody,
        },
      ],
    };

    console.log('Sending email with payload:', JSON.stringify(emailPayload, null, 2));

    const mailResponse = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    const responseText = await mailResponse.text();
    console.log('MailChannels response status:', mailResponse.status);
    console.log('MailChannels response:', responseText);

    if (mailResponse.ok) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Message sent successfully!'
      }), {
        status: 200,
        headers: corsHeaders
      });
    } else {
      // Log the error for debugging
      console.error('MailChannels error:', {
        status: mailResponse.status,
        statusText: mailResponse.statusText,
        body: responseText
      });

      return new Response(JSON.stringify({
        success: false,
        message: `Failed to send email: ${mailResponse.statusText}. Error: ${responseText}`
      }), {
        status: 500,
        headers: corsHeaders
      });
    }

  } catch (error) {
    console.error('Form submission error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: `Error: ${error.message}`
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

// Handle OPTIONS request for CORS
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
