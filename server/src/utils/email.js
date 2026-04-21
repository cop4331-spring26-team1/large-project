const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = process.env.EMAIL_FROM || 'LetsMovNow <onboarding@resend.dev>';

const sendVerificationEmail = async (to, name, token) => {
  const link = `${process.env.CLIENT_URL}/verify-email/${token}`;
  await resend.emails.send({
    from:    FROM,
    to,
    subject: 'Verify your LetsMovNow account',
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;">
        <h2 style="color:#1B1F3B;">Welcome to LetsMovNow, ${name}! 🏠</h2>
        <p style="color:#444;line-height:1.6;">
          You're one step away from finding (or listing) your perfect campus room.
          Click the button below to verify your email address.
        </p>
        <a href="${link}"
           style="display:inline-block;margin:24px 0;padding:14px 32px;
                  background:#4ECDC4;color:#fff;border-radius:8px;
                  text-decoration:none;font-weight:600;">
          Verify My Email
        </a>
        <p style="color:#888;font-size:13px;">
          This link expires in 24 hours. If you didn't create an account, ignore this email.
        </p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
        <p style="color:#aaa;font-size:12px;">LetsMovNow — Student Rentals Near Campus</p>
      </div>
    `,
  });
};

const sendPasswordResetEmail = async (to, name, token) => {
  const link = `${process.env.CLIENT_URL}/reset-password/${token}`;
  await resend.emails.send({
    from:    FROM,
    to,
    subject: 'Reset your LetsMovNow password',
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;">
        <h2 style="color:#1B1F3B;">Password Reset Request</h2>
        <p style="color:#444;line-height:1.6;">
          Hi ${name}, we received a request to reset your password.
          Click below to set a new one. This link expires in <strong>1 hour</strong>.
        </p>
        <a href="${link}"
           style="display:inline-block;margin:24px 0;padding:14px 32px;
                  background:#FF6B6B;color:#fff;border-radius:8px;
                  text-decoration:none;font-weight:600;">
          Reset My Password
        </a>
        <p style="color:#888;font-size:13px;">
          If you didn't request this, your account is safe — just ignore this email.
        </p>
      </div>
    `,
  });
};

const sendListingExpiredEmail = async (to, name, listingTitle) => {
  const link = `${process.env.CLIENT_URL}/my-listings`;
  await resend.emails.send({
    from:    FROM,
    to,
    subject: `Your listing "${listingTitle}" has expired`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;">
        <h2 style="color:#1B1F3B;">Your listing has gone off market</h2>
        <p style="color:#444;line-height:1.6;">
          Hi ${name}, your listing <strong>"${listingTitle}"</strong> has been active for 90 days
          and has automatically moved to <em>Off Market</em> status.
        </p>
        <p style="color:#444;line-height:1.6;">
          It's no longer visible in search results. Contact us if you'd like to reactivate it.
        </p>
        <a href="${link}"
           style="display:inline-block;margin:24px 0;padding:14px 32px;
                  background:#1B1F3B;color:#fff;border-radius:8px;
                  text-decoration:none;font-weight:600;">
          View My Listings
        </a>
      </div>
    `,
  });
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendListingExpiredEmail,
};
