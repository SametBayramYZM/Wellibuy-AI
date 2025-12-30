import nodemailer from 'nodemailer';

/**
 * 📧 Email Service
 * 
 * Handles:
 * - Email verification
 * - Password reset
 * - Welcome emails
 * - Account notifications
 * 
 * TODO: Configure SMTP settings in .env
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

// Create transporter (configure with your email service)
const createTransporter = () => {
  // For development, you can use:
  // 1. Gmail (requires app password)
  // 2. SendGrid
  // 3. Mailgun
  // 4. Custom SMTP server
  
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.example.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for 587
    auth: {
      user: process.env.EMAIL_USER || 'your-email@example.com',
      pass: process.env.EMAIL_PASSWORD || 'your-password'
    }
  });
};

/**
 * Send email
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@wellibuy.com',
      to: options.to,
      subject: options.subject,
      html: options.html
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`✉️  Email sent to ${options.to}`);
    return true;
    
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

/**
 * Send email verification email
 */
export const sendVerificationEmail = async (
  email: string,
  token: string,
  userName: string = 'User'
): Promise<boolean> => {
  const verificationLink = `${process.env.APP_URL || 'http://localhost:3000'}/auth/verify?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .button { background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
          .footer { color: #999; font-size: 12px; margin-top: 20px; text-align: center; }
          .warning { background: #fff3cd; border: 1px solid #ffc107; color: #856404; padding: 12px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Wellibuy AI</h1>
            <p>Email Verification Required</p>
          </div>
          <div class="content">
            <p>Hello ${userName},</p>
            <p>Thank you for creating an account with Wellibuy AI! To complete your registration, please verify your email address by clicking the button below:</p>
            
            <a href="${verificationLink}" class="button">Verify Email</a>
            
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${verificationLink}</p>
            
            <div class="warning">
              <strong>⚠️ Security Notice:</strong> This link will expire in 24 hours. If you did not create this account, please ignore this email.
            </div>
            
            <p>Best regards,<br>Wellibuy AI Team</p>
          </div>
          <div class="footer">
            <p>© 2024 Wellibuy AI. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
  
  return sendEmail({
    to: email,
    subject: 'Verify your email - Wellibuy AI',
    html
  });
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (
  email: string,
  token: string,
  userName: string = 'User'
): Promise<boolean> => {
  const resetLink = `${process.env.APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .button { background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
          .footer { color: #999; font-size: 12px; margin-top: 20px; text-align: center; }
          .warning { background: #fff3cd; border: 1px solid #ffc107; color: #856404; padding: 12px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Wellibuy AI</h1>
            <p>Password Reset Request</p>
          </div>
          <div class="content">
            <p>Hello ${userName},</p>
            <p>We received a request to reset your password. If you made this request, click the button below to reset your password:</p>
            
            <a href="${resetLink}" class="button">Reset Password</a>
            
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${resetLink}</p>
            
            <div class="warning">
              <strong>⚠️ Security Notice:</strong> This link will expire in 30 minutes. If you did not request this, please ignore this email and your password will remain unchanged.
            </div>
            
            <p>Best regards,<br>Wellibuy AI Team</p>
          </div>
          <div class="footer">
            <p>© 2024 Wellibuy AI. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
  
  return sendEmail({
    to: email,
    subject: 'Reset your password - Wellibuy AI',
    html
  });
};

/**
 * Send welcome email
 */
export const sendWelcomeEmail = async (
  email: string,
  userName: string = 'User'
): Promise<boolean> => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .features { list-style: none; padding: 0; }
          .features li { padding: 10px 0; }
          .features li:before { content: "✓ "; color: #667eea; font-weight: bold; }
          .footer { color: #999; font-size: 12px; margin-top: 20px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Wellibuy AI</h1>
            <p>Welcome to Our Platform!</p>
          </div>
          <div class="content">
            <p>Hello ${userName},</p>
            <p>Welcome to Wellibuy AI! Your account is now active and ready to use. Here's what you can do:</p>
            
            <ul class="features">
              <li>Browse our extensive product catalog</li>
              <li>Save your favorite items</li>
              <li>Get AI-powered recommendations</li>
              <li>Secure checkout with multiple payment methods</li>
              <li>Track your orders in real-time</li>
            </ul>
            
            <p>If you have any questions, please don't hesitate to contact our support team.</p>
            <p>Best regards,<br>Wellibuy AI Team</p>
          </div>
          <div class="footer">
            <p>© 2024 Wellibuy AI. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
  
  return sendEmail({
    to: email,
    subject: 'Welcome to Wellibuy AI!',
    html
  });
};

/**
 * Send suspicious activity notification
 */
export const sendSuspiciousActivityEmail = async (
  email: string,
  activity: string,
  userName: string = 'User'
): Promise<boolean> => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc3545; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .alert { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 12px; border-radius: 5px; margin: 20px 0; }
          .footer { color: #999; font-size: 12px; margin-top: 20px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Security Alert</h1>
          </div>
          <div class="content">
            <p>Hello ${userName},</p>
            <p>We detected suspicious activity on your account:</p>
            
            <div class="alert">
              <strong>${activity}</strong>
            </div>
            
            <p>If this was you, you can disregard this email. If this was not you, please change your password immediately.</p>
            <p>Best regards,<br>Wellibuy AI Team</p>
          </div>
          <div class="footer">
            <p>© 2024 Wellibuy AI. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
  
  return sendEmail({
    to: email,
    subject: 'Security Alert - Suspicious Activity',
    html
  });
};
