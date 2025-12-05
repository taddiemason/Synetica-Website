/**
 * Cloudflare Pages Function to handle career application submissions
 * Handles file uploads and sends applications via MailChannels
 */

export async function onRequestPost(context) {
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
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate file
    if (!resume || resume.size === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Resume file is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check file size (5MB max)
    if (resume.size > 5 * 1024 * 1024) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Resume file size must be less than 5MB'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Read file as base64
    const resumeBuffer = await resume.arrayBuffer();
    const resumeBase64 = btoa(String.fromCharCode(...new Uint8Array(resumeBuffer)));

    // Determine file content type
    const fileType = resume.type || 'application/pdf';
    const fileName = resume.name || 'resume.pdf';

    // Send email with resume attachment using MailChannels
    const emailResponse = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: 'careers@synetica.com', name: 'Synetica HR' }],
          dkim_domain: 'synetica.com',
          dkim_selector: 'mailchannels',
        }],
        from: {
          email: 'noreply@synetica.com',
          name: 'Synetica Careers Portal',
        },
        reply_to: {
          email: email,
          name: `${firstName} ${lastName}`,
        },
        subject: `New Job Application: ${position} - ${firstName} ${lastName}`,
        content: [{
          type: 'text/html',
          value: `
            <h2>New Career Application Received</h2>

            <h3>Applicant Information</h3>
            <p><strong>Name:</strong> ${firstName} ${lastName}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            <p><strong>Position:</strong> ${position}</p>
            <p><strong>Years of Experience:</strong> ${experience}</p>
            <p><strong>LinkedIn:</strong> ${linkedin}</p>

            <h3>Cover Letter</h3>
            <p>${coverLetter.replace(/\n/g, '<br>')}</p>

            <hr>
            <p><em>Resume attached: ${fileName}</em></p>
          `,
        }],
        attachments: [{
          content: resumeBase64,
          filename: fileName,
          type: fileType,
          disposition: 'attachment'
        }]
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('MailChannels error:', errorText);
      throw new Error('Failed to send application email');
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Application submitted successfully! We will review your application and get back to you soon.'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Career application submission error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to submit application. Please email your resume to careers@synetica.com'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
