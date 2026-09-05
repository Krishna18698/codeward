// Transactional email via Brevo (https://brevo.com).
//
// Brevo is used instead of a domain-based sender because it verifies a single
// SENDER ADDRESS rather than a whole domain — so this works without owning a
// custom domain. Sent over Brevo's REST API directly; no SDK dependency.
//
// Everything the app sends goes through sendPasswordResetEmail below, so
// swapping providers later (e.g. Resend once a domain is verified) is a change
// to this one file.

const apiKey = process.env.BREVO_API_KEY;

/** Must be an address verified in Brevo under Senders, Domains & Dedicated IPs. */
const FROM_EMAIL = process.env.EMAIL_FROM ?? "";
const FROM_NAME = process.env.EMAIL_FROM_NAME ?? "Codeward";

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

/** Both the key and a verified sender address are required to actually send. */
export const emailConfigured = Boolean(apiKey && FROM_EMAIL);

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

/** Sends the reset email. Returns true only if Brevo accepted it.
 *  Never throws — a mail failure must not change what the caller tells the
 *  user, or it would leak whether an account exists. */
export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<boolean> {
  if (!emailConfigured) {
    if (process.env.NODE_ENV !== "production") {
      const missing = !apiKey ? "BREVO_API_KEY" : "EMAIL_FROM";
      console.log(`[email] ${missing} not set — reset link for ${to}: ${resetUrl}`);
    }
    return false;
  }

  try {
    const res = await fetch(BREVO_ENDPOINT, {
      method: "POST",
      headers: {
        "api-key": apiKey as string,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: FROM_NAME, email: FROM_EMAIL },
        to: [{ email: to }],
        subject: "Reset your Codeward password",
        htmlContent: resetEmailHtml(resetUrl),
      }),
    });

    if (!res.ok) {
      // Brevo returns a JSON body with { code, message } on failure — surface it,
      // otherwise a misconfigured sender fails silently in production.
      console.error(`[email] Brevo rejected the password reset (${res.status}):`, await res.text());
      return false;
    }

    if (process.env.NODE_ENV !== "production") {
      const { messageId } = (await res.json()) as { messageId?: string };
      console.log(`[email] password reset sent to ${to} (messageId: ${messageId})`);
    }
    return true;
  } catch (err) {
    console.error("[email] failed to send password reset:", err);
    return false;
  }
}
