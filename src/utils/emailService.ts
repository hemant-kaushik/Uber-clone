import nodemailer, { TransportOptions } from 'nodemailer';
import { ApiError } from './ApiError.js';

// Email configuration interface
interface EmailConfig {
    from: string;
    to: string;
    subject: string;
    html: string;
}

// Create nodemailer transporter
const createTransporter = () => {
    // For production
    if (process.env.NODE_ENV === 'production') {
        return nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE, // e.g., 'gmail'
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        } as TransportOptions);
    }

    // For development/testing - using ethereal email
    return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
            user: process.env.ETHEREAL_EMAIL_USER,
            pass: process.env.ETHEREAL_EMAIL_PASSWORD,
        },
    } as TransportOptions);
};

/**
 * Sends an email using nodemailer
 * @param {EmailConfig} config - Email configuration object
 * @returns {Promise<void>}
 */
export const sendEmail = async (config: EmailConfig): Promise<void> => {
    try {
        const transporter = createTransporter();

        // Set default from address if not provided
        const from = config.from || `${process.env.APP_NAME} <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`;

        // Send email
        const info = await transporter.sendMail({
            from,
            to: config.to,
            subject: config.subject,
            html: config.html,
        });
        // Log email URL in development (for ethereal email)
        if (process.env.NODE_ENV !== 'production') {
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        }
    } catch (error: any) {
        throw new ApiError(500, `Error sending email: ${error.message}`);
    }
};

/**
 * Generates HTML content for password reset email
 * @param {string} username - User's name
 * @param {string} resetUrl - Password reset URL
 * @returns {string} HTML content
 */
export const generatePasswordResetEmailTemplate = (username: string, resetUrl: string): string => {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p>Hello ${username},</p>
            <p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
            <p>To reset your password, click the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                    Reset Password
                </a>
            </div>
            <p>Or copy and paste this link in your browser:</p>
            <p style="color: #666;">${resetUrl}</p>
            <p>This link will expire in 10 minutes for security reasons.</p>
            <p>If you didn't request this, please ignore this email or contact support if you have concerns.</p>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">This is an automated email, please do not reply.</p>
        </div>
    `;
}; 