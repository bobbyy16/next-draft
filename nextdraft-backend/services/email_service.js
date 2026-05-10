const nodemailer = require("nodemailer");

/**
 * Lightweight email helper using Nodemailer.
 *
 * Configure via environment variables:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 *
 * Falls back to Ethereal (https://ethereal.email) test account in development
 * when SMTP_HOST is not set – emails are caught and can be viewed via the URL
 * logged to the console.
 */

let _transporter = null;

async function getTransporter() {
  if (_transporter) return _transporter;

  if (process.env.SMTP_HOST) {
    _transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Dev fallback – Ethereal test account
    const testAccount = await nodemailer.createTestAccount();
    _transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    console.log("[Email] Using Ethereal test account:", testAccount.user);
  }

  return _transporter;
}

const from = () => process.env.SMTP_FROM || "NextDraft <noreply@nextdraft.app>";

/* ── Email templates ────────────────────────────────── */

async function sendMail({ to, subject, html }) {
  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail({ from: from(), to, subject, html });

    // Log Ethereal preview URL in dev
    if (!process.env.SMTP_HOST) {
      console.log("[Email] Preview:", nodemailer.getTestMessageUrl(info));
    }
    return info;
  } catch (err) {
    console.error("[Email] Send failed:", err.message);
    // Non-blocking – don't crash the request
  }
}

/* ── Welcome email ──────────────────────────────────── */

function sendWelcomeEmail(user) {
  return sendMail({
    to: user.email,
    subject: "Welcome to NextDraft! 🎉",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#111">
        <h2 style="margin:0 0 8px">Welcome, ${user.name}!</h2>
        <p style="color:#555;line-height:1.6;margin:0 0 16px">
          Your NextDraft account is ready. You've been given <strong>50 free points</strong> to get started.
        </p>
        <p style="color:#555;line-height:1.6;margin:0 0 16px">
          Upload a resume, paste a job description, and let AI optimize your resume for ATS — all in one click.
        </p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/resumes"
           style="display:inline-block;background:#0f172a;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px">
          Open your optimizer
        </a>
        <p style="color:#999;font-size:12px;margin:24px 0 0">NextDraft — Focused ATS resume optimization.</p>
      </div>
    `,
  });
}

/* ── Points added email ─────────────────────────────── */

function sendPointsAddedEmail(user, points) {
  return sendMail({
    to: user.email,
    subject: `${points} points added to your wallet`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#111">
        <h2 style="margin:0 0 8px">Points added!</h2>
        <p style="color:#555;line-height:1.6;margin:0 0 16px">
          <strong>${points} points</strong> have been added to your NextDraft wallet.
          Your new balance is <strong>${user.pointsBalance} points</strong>.
        </p>
        <p style="color:#555;line-height:1.6;margin:0 0 16px">
          Each AI resume optimization costs 50 points. Head to the optimizer to put them to use.
        </p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/resumes"
           style="display:inline-block;background:#0f172a;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px">
          Optimize a resume
        </a>
        <p style="color:#999;font-size:12px;margin:24px 0 0">NextDraft — Focused ATS resume optimization.</p>
      </div>
    `,
  });
}

/* ── Account deleted email ──────────────────────────── */

function sendAccountDeletedEmail(email, name) {
  return sendMail({
    to: email,
    subject: "Your NextDraft account has been deleted",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#111">
        <h2 style="margin:0 0 8px">Account deleted</h2>
        <p style="color:#555;line-height:1.6;margin:0 0 16px">
          Hi ${name}, your NextDraft account and all associated data have been permanently deleted as requested.
        </p>
        <p style="color:#555;line-height:1.6;margin:0 0 16px">
          If this was a mistake or you'd like to come back, you can always create a new account.
        </p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/register"
           style="display:inline-block;background:#0f172a;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px">
          Create a new account
        </a>
        <p style="color:#999;font-size:12px;margin:24px 0 0">NextDraft — Focused ATS resume optimization.</p>
      </div>
    `,
  });
}

module.exports = {
  sendWelcomeEmail,
  sendPointsAddedEmail,
  sendAccountDeletedEmail,
};
