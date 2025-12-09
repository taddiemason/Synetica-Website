/**
 * Cloudflare Pages Function to handle career application submissions
 * Handles file uploads and sends applications via Web3Forms
 */

export async function onRequestPost(context) {
  // Add CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    const formData = await context.request.formData();

    const firstName = formData.get('firstName');
    const lastName = formData.get('lastName');
    const email = formData.get('email');
    const phone = formData.get('phone');
    const position = formData.get('position');
    const coverLetter = formData.get('coverLetter') || 'No cover letter provided';
    const linkedin = formData.get('linkedin') || 'Not provided';
    const experience = formData.get('experience');
    const resume = formData.get('resume');

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !position || !resume) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Validate file
    if (!resume || resume.size === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Resume file is required'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Check file size (5MB max)
    if (resume.size > 5 * 1024 * 1024) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Resume file size must be less than 5MB'
      }), {
        status: 400,
        headers: corsHeaders
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

    // Attach resume file
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

    console.log('Web3Forms response status:', response.status);

    // Handle non-JSON responses
    let result;
    try {
      const text = await response.text();
      result = JSON.parse(text);
      console.log('Web3Forms response:', result);
    } catch (parseError) {
      console.error('Failed to parse Web3Forms response:', parseError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to submit application. Please try again or email your resume to careers@synetica.us'
      }), {
        status: 500,
        headers: corsHeaders
      });
    }

    if (result.success) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Application submitted successfully! We will review your application and get back to you soon.'
      }), {
        status: 200,
        headers: corsHeaders
      });
    } else {
      console.error('Web3Forms error:', result);
      return new Response(JSON.stringify({
        success: false,
        error: result.message || 'Failed to submit application. Please email your resume to careers@synetica.us'
      }), {
        status: 500,
        headers: corsHeaders
      });
    }

  } catch (error) {
    console.error('Career application submission error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to submit application. Please email your resume to careers@synetica.us'
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
