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
    const botcheck = formData.get('botcheck');

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

    // Prepare Web3Forms payload as JSON
    const web3formsData = {
      access_key: '96109e90-d006-4c97-9436-77ad8757b056',
      name: name,
      email: email,
      message: message,
      subject: `New Contact from ${name} - Synetica Website`,
      from_name: 'Synetica Website'
    };

    // Add optional fields only if they have values
    if (phone) web3formsData.phone = phone;
    if (company) web3formsData.company = company;
    if (botcheck) web3formsData.botcheck = botcheck;

    console.log('Sending to Web3Forms:', {
      name,
      email,
      phone: phone || 'Not provided',
      company: company || 'Not provided',
      message: message.substring(0, 50) + '...'
    });

    // Send to Web3Forms API with proper headers
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(web3formsData)
    });

    console.log('Web3Forms response status:', response.status);

    // Handle non-JSON responses
    let result;
    let text;
    try {
      text = await response.text();
      console.log('Web3Forms raw response text:', text);
      result = JSON.parse(text);
      console.log('Web3Forms parsed response:', result);
    } catch (parseError) {
      console.error('Failed to parse Web3Forms response:', parseError);
      console.error('Response text that failed to parse:', text);
      return new Response(JSON.stringify({
        success: false,
        message: 'Failed to send message. Please try again or contact us directly at info@synetica.us'
      }), {
        status: 500,
        headers: corsHeaders
      });
    }

    if (result.success) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Thank you! Your message has been sent successfully.'
      }), {
        status: 200,
        headers: corsHeaders
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
