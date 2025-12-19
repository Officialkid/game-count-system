// lib/email-service.ts
// Email sending service for verification and password reset
// NOTE: Nodemailer was removed. This module now logs instead of sending.

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private enabled: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    // Email service disabled (nodemailer dependency removed). Leave disabled.
    this.enabled = false;
    console.warn('⚠️  Email service disabled. Skipping email initialization.');
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.enabled) {
      console.log('📧 Email would be sent to:', options.to);
      console.log('   Subject:', options.subject);
      console.log('   (Email service not configured - check console for content)');
      return false;
    }
    // Should never reach here since enabled=false, but keep fallback
    return false;
  }

  async sendVerificationEmail(email: string, token: string): Promise<boolean> {
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const verificationLink = `${appUrl}/verify-email?token=${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #6b46c1 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #6b46c1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Verify Your Email</h1>
          </div>
          <div class="content">
            <p>Thank you for registering! Please verify your email address to activate your account.</p>
            <p>Click the button below to verify your email:</p>
            <p style="text-align: center;">
              <a href="${verificationLink}" class="button">Verify Email Address</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #6b46c1;">${verificationLink}</p>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              This link will expire in 24 hours. If you didn't create an account, please ignore this email.
            </p>
          </div>
          <div class="footer">
            <p>© 2025 Game Count System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Verify Your Email Address',
      html,
    });
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const resetLink = `${appUrl}/reset-password?token=${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #6b46c1 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #6b46c1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .warning { background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reset Your Password</h1>
          </div>
          <div class="content">
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <p style="text-align: center;">
              <a href="${resetLink}" class="button">Reset Password</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #6b46c1;">${resetLink}</p>
            <div class="warning">
              <strong>⚠️ Security Notice:</strong><br>
              This link will expire in 1 hour. If you didn't request a password reset, please ignore this email and your password will remain unchanged.
            </div>
          </div>
          <div class="footer">
            <p>© 2025 Game Count System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Reset Your Password',
      html,
    });
  }

  /**
   * Send admin invitation email
   */
  async sendAdminInvitation(
    toEmail: string,
    data: {
      inviterName: string;
      eventName: string;
      role: string;
      invitationUrl: string;
      expiresAt: string;
    }
  ): Promise<boolean> {
    const { inviterName, eventName, role, invitationUrl, expiresAt } = data;

    const roleDescriptions: Record<string, string> = {
      admin: 'manage teams, scores, and event settings',
      judge: 'add and edit scores',
      scorer: 'add scores',
    };

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .event-badge { background: #f3f4f6; border-left: 4px solid #8B5CF6; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .cta-button { display: inline-block; background: #8B5CF6; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .footer { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; text-align: center; font-size: 12px; color: #6b7280; }
          .expiry { background: #fef3c7; border: 1px solid #fcd34d; padding: 10px; border-radius: 6px; margin: 15px 0; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎮 Event Administrator Invitation</h1>
        </div>
        <div class="content">
          <p>Hi there!</p>
          <p><strong>${inviterName}</strong> has invited you to be an <strong>${role}</strong> for their event:</p>
          
          <div class="event-badge">
            <strong style="font-size: 18px; color: #8B5CF6;">${eventName}</strong>
          </div>

          <p>As a <strong>${role}</strong>, you'll be able to ${roleDescriptions[role] || 'manage event activities'}.</p>

          <div class="expiry">
            ⏰ This invitation expires on <strong>${new Date(expiresAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong>
          </div>

          <div style="text-align: center;">
            <a href="${invitationUrl}" class="cta-button">Accept Invitation</a>
          </div>

          <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
            If you don't have an account yet, you'll be able to create one when you accept the invitation.
          </p>

          <p style="font-size: 14px; color: #6b7280;">
            If you weren't expecting this invitation, you can safely ignore this email.
          </p>
        </div>
        <div class="footer">
          <p>Game Count System - Professional Event Scoring & Management</p>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: toEmail,
      subject: `You've been invited to manage "${eventName}"`,
      html,
    });
  }

  /**
   * Send invitation acceptance confirmation
   */
  async sendInvitationAcceptedNotification(
    toEmail: string,
    accepterName: string,
    eventName: string,
    role: string
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>✅ Invitation Accepted</h1>
        </div>
        <div class="content">
          <p>Good news!</p>
          <p><strong>${accepterName}</strong> has accepted your invitation to be a <strong>${role}</strong> for <strong>${eventName}</strong>.</p>
          <p>They now have access to manage the event according to their role permissions.</p>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: toEmail,
      subject: `${accepterName} accepted your invitation to manage "${eventName}"`,
      html,
    });
  }

  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  }
}

export const emailService = new EmailService();
