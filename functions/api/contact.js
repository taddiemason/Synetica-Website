// /functions/api/contact.js
// Using Web3Forms for contact form submissions
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

    console.log('Web3Forms response:', result);

    if (result.success) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Thank you! Your message has been sent successfully.'
      }), {
        status: 200,
        headers: corsHeaders
      });
    } else {
      console.error('Web3Forms error:', result);
      return new Response(JSON.stringify({
        success: false,
        message: result.message || 'Failed to send message. Please try again.'
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
