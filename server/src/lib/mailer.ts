import { Resend } from 'resend';

const getResend = () => new Resend(process.env.RESEND_API_KEY);

export const sendVerificationEmail = async (email: string, name: string, token: string): Promise<void> => {
    const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;

    await getResend().emails.send({
        from:    'onboarding@resend.dev',
        to:      email,
        subject: 'Verify your email — LetsMovNow',
        html: `
      <h2>Hi ${name},</h2>
      <p>Thanks for signing up! Click the link below to verify your email address:</p>
      <a href="${verifyUrl}" style="background:#4ECDC4;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">
        Verify Email
      </a>
      <p>This link expires in 24 hours.</p>
      <p>If you didn't sign up, you can ignore this email.</p>
    `,
    });
};

export const sendPasswordResetEmail = async (email: string, name: string, token: string): Promise<void> => {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

    await getResend().emails.send({
        from:    'onboarding@resend.dev',
        to:      email,
        subject: 'Reset your password — LetsMovNow',
        html: `
      <h2>Hi ${name},</h2>
      <p>We received a request to reset your password. Click the link below:</p>
      <a href="${resetUrl}" style="background:#4ECDC4;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">
        Reset Password
      </a>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request a password reset, you can ignore this email.</p>
    `,
    });
};