// utils/email.ts
import { Resend } from 'resend';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Application confirmation email
export async function sendApplicationConfirmation(
  applicantEmail: string,
  jobTitle: string,
  applicantName?: string
): Promise<boolean> {
  try {
    const { data, error } = await resend.emails.send({
      from: 'BUSY BRAIN SCHOOLS <careers@busybrainschools.com>',
      to: [applicantEmail],
      subject: `✅ Application Received: ${jobTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Application Received</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f4f4f4;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background: white;
              border-radius: 15px;
              overflow: hidden;
              box-shadow: 0 4px 10px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #fbbf24, #f59e0b);
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              color: white;
              margin: 0;
              font-size: 28px;
            }
            .content {
              padding: 30px;
            }
            .job-title {
              color: #f59e0b;
              font-weight: bold;
              font-size: 20px;
              margin: 10px 0;
            }
            .message-box {
              background: #fef3c7;
              padding: 20px;
              border-radius: 10px;
              margin: 20px 0;
              border-left: 4px solid #f59e0b;
            }
            .button {
              display: inline-block;
              background: #f59e0b;
              color: white;
              text-decoration: none;
              padding: 12px 30px;
              border-radius: 25px;
              font-weight: bold;
              margin: 20px 0;
              transition: background 0.3s;
            }
            .button:hover {
              background: #d97706;
            }
            .footer {
              background: #f8f9fa;
              padding: 20px;
              text-align: center;
              color: #666;
              font-size: 14px;
              border-top: 1px solid #eee;
            }
            .social-links {
              margin: 15px 0;
            }
            .social-links a {
              display: inline-block;
              margin: 0 10px;
              color: #f59e0b;
              text-decoration: none;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Application Received!</h1>
            </div>
            
            <div class="content">
              <p>Dear ${applicantName || 'Applicant'},</p>
              
              <p>Thank you for your interest in joining the <strong>BUSY BRAIN SCHOOLS</strong> family!</p>
              
              <div class="job-title">
                Position: ${jobTitle}
              </div>
              
              <div class="message-box">
                <p style="margin: 0; font-size: 18px;">✨ <strong>What happens next?</strong></p>
                <p style="margin: 10px 0 0 0;">
                  Our HR team will review your application carefully. If your qualifications match our requirements, 
                  we will contact you within <strong>1-2 weeks</strong> for the next steps.
                </p>
              </div>
              
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'https://busybrainschools.com'}/careers" class="button">
                  Browse More Opportunities
                </a>
              </div>
              
              <div style="margin-top: 30px;">
                <p><strong>💡 Quick Tips:</strong></p>
                <ul style="color: #666;">
                  <li>Keep your phone nearby - we might call!</li>
                  <li>Check your spam folder occasionally</li>
                  <li>Update your portfolio/LinkedIn profile</li>
                  <li>Prepare for potential interviews</li>
                </ul>
              </div>
            </div>
            
            <div class="footer">
              <p>🌟 <strong>BUSY BRAIN SCHOOLS</strong></p>
              <p>79, Beside Total Comfort Filling Station, Sobi Road, Ilorin, Kwara State</p>
              <p>📞 +234 810 815 5707 | ✉️ careers@busybrainschools.com</p>
              
              <div class="social-links">
                <a href="https://facebook.com/busybrainschools">Facebook</a> |
                <a href="https://twitter.com/busybrainschools">Twitter</a> |
                <a href="https://instagram.com/busybrainschools">Instagram</a>
              </div>
              
              <p style="margin-top: 15px; font-size: 12px; color: #999;">
                This is an automated message, please do not reply directly to this email.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return false;
    }

    console.log('✅ Application confirmation email sent:', data?.id);
    return true;
  } catch (error) {
    console.error('❌ Error sending application confirmation email:', error);
    return false;
  }
}

// Application status update email
export async function sendApplicationStatusEmail(
  applicantEmail: string,
  applicantName: string,
  jobTitle: string,
  status: 'reviewed' | 'shortlisted' | 'rejected' | 'hired',
  message?: string
): Promise<boolean> {
  try {
    let subject = '';
    let statusMessage = '';
    let statusColor = '';
    let emoji = '';
    
    switch (status) {
      case 'shortlisted':
        subject = `🎯 You've been shortlisted! - ${jobTitle}`;
        statusMessage = 'Congratulations! You have been shortlisted for the next stage.';
        statusColor = '#10b981';
        emoji = '🎯';
        break;
      case 'reviewed':
        subject = `📋 Application Update - ${jobTitle}`;
        statusMessage = 'Your application has been reviewed and is being processed.';
        statusColor = '#3b82f6';
        emoji = '📋';
        break;
      case 'hired':
        subject = `🎊 Welcome to the Team! - ${jobTitle}`;
        statusMessage = 'We are excited to offer you the position! Please check your email for next steps.';
        statusColor = '#8b5cf6';
        emoji = '🎊';
        break;
      case 'rejected':
        subject = `Update regarding your application - ${jobTitle}`;
        statusMessage = 'Thank you for your interest, but we have decided to move forward with other candidates.';
        statusColor = '#ef4444';
        emoji = '💔';
        break;
    }

    const { data, error } = await resend.emails.send({
      from: 'BUSY BRAIN SCHOOLS Careers <careers@busybrainschools.com>',
      to: [applicantEmail],
      subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Application Status Update</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f4f4f4;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background: white;
              border-radius: 15px;
              overflow: hidden;
              box-shadow: 0 4px 10px rgba(0,0,0,0.1);
            }
            .header {
              background: ${statusColor};
              padding: 30px;
              text-align: center;
              color: white;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .content {
              padding: 30px;
            }
            .message-box {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 10px;
              margin: 20px 0;
              border-left: 4px solid ${statusColor};
            }
            .job-title {
              color: ${statusColor};
              font-weight: bold;
              font-size: 18px;
              margin: 10px 0;
            }
            .footer {
              background: #f8f9fa;
              padding: 20px;
              text-align: center;
              color: #666;
              font-size: 14px;
              border-top: 1px solid #eee;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${emoji} Application Status Update</h1>
            </div>
            <div class="content">
              <p>Dear <strong>${applicantName}</strong>,</p>
              
              <div class="job-title">
                Position: ${jobTitle}
              </div>
              
              <div class="message-box">
                <p style="font-size: 18px; margin: 0;">${statusMessage}</p>
              </div>
              
              ${message ? `
                <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0;"><strong>📝 Additional Notes:</strong><br>${message}</p>
                </div>
              ` : ''}
              
              <p>Thank you for your interest in joining the BUSY BRAIN SCHOOLS family.</p>
              
              <p style="margin-top: 30px;">
                Warm regards,<br>
                <strong>HR Team</strong><br>
                BUSY BRAIN SCHOOLS
              </p>
            </div>
            <div class="footer">
              <p>🌟 <strong>BUSY BRAIN SCHOOLS</strong> - Nurturing Young Minds with Islamic Values</p>
              <p>📞 +234 810 815 5707 | ✉️ careers@busybrainschools.com</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return false;
    }

    console.log(`✅ Status update email sent (${status}):`, data?.id);
    return true;
  } catch (error) {
    console.error('❌ Error sending status update email:', error);
    return false;
  }
}

// New job posting notification
export async function sendNewJobNotification(
  jobTitle: string,
  jobUrl: string,
  jobDepartment: string
): Promise<boolean> {
  try {
    const { data, error } = await resend.emails.send({
      from: 'BUSY BRAIN SCHOOLS System <system@busybrainschools.com>',
      to: [process.env.HR_EMAIL || 'hr@busybrainschools.com'],
      subject: `🚨 New Job Posted: ${jobTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 20px auto; background: white; padding: 30px; border-radius: 10px; }
            .header { background: #fbbf24; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .button { background: #f59e0b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="color: white; margin: 0;">🚨 New Job Vacancy Created</h2>
            </div>
            <div style="padding: 20px;">
              <p>A new position has been posted:</p>
              <p><strong>Position:</strong> ${jobTitle}</p>
              <p><strong>Department:</strong> ${jobDepartment}</p>
              <p><strong>URL:</strong> <a href="${jobUrl}">${jobUrl}</a></p>
              <p style="margin-top: 20px;">Please review the listing and ensure all details are correct.</p>
              <a href="${jobUrl}" class="button">View Job Posting</a>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return false;
    }

    console.log('✅ HR notification sent:', data?.id);
    return true;
  } catch (error) {
    console.error('❌ Error sending HR notification:', error);
    return false;
  }
}
// utils/email.ts - Updated sendContactFormEmail function
// utils/email.ts - Update the sendContactFormEmail function
// utils/email.ts - Updated sendContactFormEmail function
// utils/email.ts - Simplified contact form email

// Contact form email
export async function sendContactFormEmail(
  name: string,
  email: string,
  message: string
): Promise<boolean> {
  try {
    console.log("📧 Attempting to send contact form email...");
    console.log("To:", process.env.ADMIN_EMAIL || 'contactbusybrain@gmail.com');
    console.log("From: info@busybrainschools.com");
    console.log("Reply-To:", email);
    console.log("Name:", name);

    // Validate inputs
    if (!name || !email || !message) {
      console.error("❌ Missing required fields:", { name, email, message });
      return false;
    }

    const { data, error } = await resend.emails.send({
      from: 'BUSY BRAIN SCHOOLS <info@busybrainschools.com>',
      to: [process.env.ADMIN_EMAIL || 'contactbusybrain@gmail.com'],
      replyTo: email,
      subject: `📬 New message from ${name} via Contact Form`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Contact Form Message</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              line-height: 1.5;
              color: #1a1a1a;
              margin: 0;
              padding: 0;
              background-color: #f5f5f5;
            }
            .email-container {
              max-width: 500px;
              margin: 20px auto;
              background: white;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            }
            .header {
              background: #fbbf24;
              padding: 16px 24px;
            }
            .header h2 {
              margin: 0;
              color: white;
              font-size: 18px;
              font-weight: 500;
            }
            .content {
              padding: 24px;
            }
            .field {
              margin-bottom: 20px;
            }
            .label {
              font-size: 12px;
              color: #666;
              margin-bottom: 4px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .value {
              font-size: 15px;
              color: #1a1a1a;
              background: #f9f9f9;
              padding: 10px 12px;
              border-radius: 6px;
              border-left: 3px solid #fbbf24;
            }
            .message-value {
              font-size: 15px;
              color: #1a1a1a;
              background: #f9f9f9;
              padding: 12px;
              border-radius: 6px;
              border-left: 3px solid #fbbf24;
              white-space: pre-wrap;
              line-height: 1.6;
            }
            .reply-hint {
              margin-top: 24px;
              padding: 12px;
              background: #f0f9ff;
              border-radius: 6px;
              font-size: 13px;
              color: #0369a1;
            }
            .footer {
              margin-top: 24px;
              padding-top: 16px;
              border-top: 1px solid #eee;
              font-size: 12px;
              color: #999;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <h2>📬 New Contact Form Message</h2>
            </div>
            
            <div class="content">
              <div class="field">
                <div class="label">From</div>
                <div class="value">${name} &lt;${email}&gt;</div>
              </div>
              
              <div class="field">
                <div class="label">Message</div>
                <div class="message-value">${message.replace(/\n/g, '<br>')}</div>
              </div>
              
              <div class="reply-hint">
                <strong>✉️ Reply:</strong> Just hit reply - your response will go directly to ${email}
              </div>
              
              <div class="footer">
                Sent via BUSY BRAIN SCHOOLS contact form
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Resend error:', error);
      return false;
    }

    console.log('✅ Contact form email sent successfully:', data?.id);
    
    // Log the preview URL if in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`📬 Preview URL: https://resend.com/emails/${data.id}`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error sending contact form email:', error);
    return false;
  }
}