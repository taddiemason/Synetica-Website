// /functions/api/contact.js
// Simple Web3Forms integration
export async function onRequestPost({ request }) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    const formData = await request.formData();

    // Get form fields
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

    // Build payload
    const payload = {
      access_key: '96109e90-d006-4c97-9436-77ad8757b056',
      name: name,
      email: email,
      message: message
    };

    if (phone) payload.phone = phone;
    if (company) payload.company = company;

    // Send to Web3Forms
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.success) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Thank you! Your message has been sent successfully.'
      }), {
        status: 200,
        headers: corsHeaders
      });
    } else {
      return new Response(JSON.stringify({
        success: false,
        message: result.message || 'Failed to send message. Please try again.'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

  } catch (error) {
    console.error('Form error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Failed to send message. Please try again.'
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
