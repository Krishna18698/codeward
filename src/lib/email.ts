import { Resend } from "resend";

// Optional, like the other third-party integrations (JDoodle, Upstash): if the
// key isn't set the app still runs — sending is skipped and, in development,
// the reset link is logged so the flow is testable without an email provider.
const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

/** Resend's shared sender works with no verified domain, so this has a sane
 *  default; set EMAIL_FROM once you've verified your own domain. */
const FROM = process.env.EMAIL_FROM ?? "Codeward <onboarding@resend.dev>";

export const emailConfigured = Boolean(resend);

function resetEmailHtml(resetUrl: string) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f6f7f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#16181a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e4e6e3;border-radius:14px;">
      <tr><td style="padding:28px 28px 8px;">
        <p style="margin:0 0 18px;font-size:15px;font-weight:700;letter-spacing:-0.01em;">Code<span style="color:#059669;">ward</span></p>
        <h1 style="margin:0 0 12px;font-size:19px;line-height:1.3;font-weight:600;">Reset your password</h1>
        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#55585c;">
          Someone asked to reset the password for this Codeward account. Click below to choose a new one.
          This link expires in 1 hour and can only be used once.
        </p>
        <a href="${resetUrl}" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:11px 18px;border-radius:10px;">Reset password</a>
        <p style="margin:20px 0 0;font-size:12px;line-height:1.6;color:#898d90;">
          If you didn't request this, you can safely ignore this email — your password won't change.
        </p>
        <p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:#898d90;word-break:break-all;">
          Or paste this into your browser:<br /><span style="color:#55585c;">${resetUrl}</span>
        </p>
      </td></tr>
      <tr><td style="padding:18px 28px 24px;border-top:1px solid #e4e6e3;">
        <p style="margin:0;font-size:11px;color:#898d90;">Codeward — interview prep for engineers</p>
      </td></tr>
    </table>
  </body>
</html>`;
}

/** Sends the reset email. Returns true if it was actually dispatched.
 *  Never throws — a mail failure must not leak account existence to the caller. */
export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<boolean> {
  if (!resend) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[email] RESEND_API_KEY not set — reset link for ${to}: ${resetUrl}`);
    }
    return false;
  }
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: "Reset your Codeward password",
      html: resetEmailHtml(resetUrl),
    });
    return true;
  } catch (err) {
    console.error("[email] failed to send password reset:", err);
    return false;
  }
}
