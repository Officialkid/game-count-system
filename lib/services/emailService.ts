/**
 * Email Service
 * 
 * Sends transactional emails via SMTP or Appwrite Messaging
 * Phase F: Admin, Emails, Audit
 */

interface EmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email via configured SMTP provider
 * 
 * In production, this would use:
 * - Appwrite Messaging API
 * - Or server-side SMTP (nodemailer)
 * - Or email API (SendGrid, Postmark, etc.)
 * 
 * For now, returns success in mock mode
 */
export async function sendEmail(params: EmailParams): Promise<{ success: boolean; error?: string }> {
  const { to, subject, html, text } = params;

  try {
    // Check if we're using Appwrite services
    const useAppwrite = process.env.NEXT_PUBLIC_USE_APPWRITE_SERVICES === 'true';
    const smtpConfigured = process.env.SMTP_HOST && process.env.SMTP_USER;

    if (!useAppwrite || !smtpConfigured) {
      // Mock mode: log email instead of sending
      console.log('[EMAIL MOCK] Would send email:', {
        to,
        subject,
        preview: html.substring(0, 100) + '...',
      });
      return { success: true };
    }
    // Real implementation: Call Appwrite Function if configured
    const fnId = process.env.NEXT_PUBLIC_APPWRITE_FUNCTION_SEND_EMAIL;
    if (!fnId) {
      console.warn('Email function not configured (NEXT_PUBLIC_APPWRITE_FUNCTION_SEND_EMAIL)');
      return { success: false, error: 'Email function not configured' };
    }
    try {
      const { functions } = await import('@/lib/appwrite');
      await functions.createExecution(fnId, JSON.stringify({ to, subject, html, text }), true);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to invoke email function' };
    }
  } catch (err: any) {
    console.error('Email send error:', err);
    return { success: false, error: err.message || 'Failed to send email' };
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  appUrl: string
): Promise<{ success: boolean; error?: string }> {
  const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset Request</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hello,</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      We received a request to reset your password for your Game Count System account.
    </p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Click the button below to reset your password:
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" style="background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 16px; font-weight: bold;">
        Reset Password
      </a>
    </div>
    
    <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
      Or copy and paste this link into your browser:
    </p>
    
    <p style="font-size: 14px; color: #667eea; word-break: break-all; background: white; padding: 10px; border-radius: 5px;">
      ${resetUrl}
    </p>
    
    <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
      <strong>This link will expire in 1 hour.</strong><br>
      If you didn't request a password reset, you can safely ignore this email.
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
    <p>Game Count System &copy; ${new Date().getFullYear()}</p>
    <p>This is an automated message, please do not reply.</p>
  </div>
</body>
</html>
  `;

  const text = `
Password Reset Request

We received a request to reset your password for your Game Count System account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email.

Game Count System © ${new Date().getFullYear()}
  `;

  return sendEmail({
    to: email,
    subject: 'Reset Your Password - Game Count System',
    html,
    text,
  });
}

/**
 * Send event invitation email
 */
export async function sendEventInviteEmail(
  email: string,
  eventName: string,
  inviterName: string,
  eventUrl: string
): Promise<{ success: boolean; error?: string }> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Event Invitation</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🎉 You're Invited!</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hello,</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      <strong>${inviterName}</strong> has invited you to join the event:
    </p>
    
    <div style="background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0;">
      <h2 style="margin: 0; color: #667eea; font-size: 22px;">${eventName}</h2>
    </div>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Click the button below to view the event and join the fun:
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${eventUrl}" style="background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 16px; font-weight: bold;">
        View Event
      </a>
    </div>
    
    <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
      Or copy and paste this link into your browser:
    </p>
    
    <p style="font-size: 14px; color: #667eea; word-break: break-all; background: white; padding: 10px; border-radius: 5px;">
      ${eventUrl}
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
    <p>Game Count System &copy; ${new Date().getFullYear()}</p>
    <p>This is an automated message, please do not reply.</p>
  </div>
</body>
</html>
  `;

  const text = `
You're Invited!

${inviterName} has invited you to join the event: ${eventName}

Click the link below to view the event:
${eventUrl}

Game Count System © ${new Date().getFullYear()}
  `;

  return sendEmail({
    to: email,
    subject: `You're invited to ${eventName}`,
    html,
    text,
  });
}

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(
  email: string,
  userName: string,
  dashboardUrl: string
): Promise<{ success: boolean; error?: string }> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Game Count System</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Game Count System!</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${userName},</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Thanks for joining Game Count System! We're excited to have you on board.
    </p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      You can now create events, track scores, and manage teams all in one place.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${dashboardUrl}" style="background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 16px; font-weight: bold;">
        Go to Dashboard
      </a>
    </div>
    
    <div style="background: white; padding: 20px; border-radius: 5px; margin-top: 30px;">
      <h3 style="margin-top: 0; color: #667eea;">Quick Start Guide:</h3>
      <ul style="padding-left: 20px;">
        <li style="margin-bottom: 10px;">Create your first event</li>
        <li style="margin-bottom: 10px;">Add teams to compete</li>
        <li style="margin-bottom: 10px;">Track scores in real-time</li>
        <li style="margin-bottom: 10px;">Share public scoreboards</li>
      </ul>
    </div>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
    <p>Game Count System &copy; ${new Date().getFullYear()}</p>
    <p>This is an automated message, please do not reply.</p>
  </div>
</body>
</html>
  `;

  const text = `
Welcome to Game Count System!

Hi ${userName},

Thanks for joining Game Count System! We're excited to have you on board.

You can now create events, track scores, and manage teams all in one place.

Visit your dashboard: ${dashboardUrl}

Quick Start Guide:
- Create your first event
- Add teams to compete
- Track scores in real-time
- Share public scoreboards

Game Count System © ${new Date().getFullYear()}
  `;

  return sendEmail({
    to: email,
    subject: 'Welcome to Game Count System',
    html,
    text,
  });
}
