import nodemailer from "nodemailer";

interface EmailParams {
  to: string;
  recipientName: string;
  role: string;
  eventName: string;
  certificateId: string;
  /**
   * Whether a Shim account already exists for this email.
   * - false (or undefined, for legacy callers): send the certificate link plus a
   *   "create your account" call to action with the email pre-filled.
   * - true: tell the recipient the certificate was added to their existing
   *   account and give them a sign-in link.
   */
  accountExists?: boolean;
}

/**
 * Resolve the public base URL for links inside emails.
 * Prefers NEXTAUTH_URL, then the common deployment host, then localhost.
 */
function resolveBaseUrl(): string {
  return (
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3100"
  ).replace(/\/+$/, "");
}

/**
 * Shared delivery. When SMTP_HOST is unset we log to the console instead of
 * sending, so local development works without mail credentials.
 */
async function deliver(mailOptions: {
  from: string;
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}, mockLog: string) {
  try {
    if (!process.env.SMTP_HOST) {
      console.log(`\n======================================================\n[EMAIL SIMULATION (SMTP_HOST is unset in .env)]\nTo: ${mailOptions.to}\nSubject: ${mailOptions.subject}\nLog: ${mockLog}\n💡 NOTE: To send REAL emails to real inboxes, add SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS to your .env file.\n======================================================\n`);
      return { success: true, message: "Mock email sent successfully (SMTP_HOST unset)" };
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      ...mailOptions,
      replyTo: mailOptions.replyTo || process.env.SMTP_REPLY_TO || undefined,
    });
    console.log(`Email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
}

const FROM = () => process.env.SMTP_FROM || '"shim Team" <noreply@shim.local>';

const shell = (title: string, body: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #4f46e5; padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">${title}</h1>
      </div>
      <div style="padding: 32px; background-color: #ffffff;">
        ${body}
      </div>
      <div style="background-color: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
        <p style="font-size: 12px; color: #9ca3af; margin: 0;">
          Powered by shim System<br>Cryptographically Secured
        </p>
      </div>
    </div>`;

export async function sendCertificateEmail({
  to,
  recipientName,
  role,
  eventName,
  certificateId,
  accountExists = false,
}: EmailParams) {
  const base = resolveBaseUrl();
  const certUrl = `${base}/validate?id=${certificateId}`;

  // The signup / login links carry the recipient's email so the form can pre-fill it
  // and the certificate can be attached to the account they create or sign into.
  const emailParam = encodeURIComponent(to);
  const signupUrl = `${base}/register?email=${emailParam}&claim=${certificateId}`;
  const loginUrl = `${base}/login?email=${emailParam}&claim=${certificateId}`;

  const headerTitle = accountExists
    ? "Your Certificate Has Been Added"
    : "Your Event Certificate Is Ready!";

  const introLine = accountExists
    ? `Good news - your official digital certificate for <strong>${eventName}</strong> has been added straight to your existing Shim account. Just sign in to see it in your wallet.`
    : `Congratulations! Your official digital certificate for <strong>${eventName}</strong> has been generated. You can view and download it right away, and create a free Shim account to keep it safe in your wallet.`;

  // Existing users get one primary action (sign in). New users get the certificate
  // link plus a secondary "create your account" card.
  const primaryCta = accountExists
    ? `
        <div style="text-align: center; margin: 32px 0;">
          <a href="${loginUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
            Sign in to view your wallet
          </a>
        </div>`
    : `
        <div style="text-align: center; margin: 32px 0;">
          <a href="${certUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
            View and Download Certificate
          </a>
        </div>`;

  const secondaryBlock = accountExists
    ? `
        <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 24px;">
          Prefer to share the public link?<br>
          <a href="${certUrl}" style="color: #4f46e5;">${certUrl}</a>
        </p>`
    : `
        <div style="border-top: 1px solid #e5e7eb; margin-top: 32px; padding-top: 24px;">
          <p style="font-size: 15px; color: #374151; margin: 0 0 8px 0;">
            <strong>Keep this certificate forever.</strong>
          </p>
          <p style="font-size: 14px; color: #6b7280; margin: 0 0 20px 0;">
            Create a free Shim account with <strong>${to}</strong> to store this and every future certificate in one secure wallet. Already have an account? Just sign in.
          </p>
          <div style="text-align: center;">
            <a href="${signupUrl}" style="background-color: #18181b; color: #ffffff; padding: 11px 22px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; display: inline-block; margin: 0 6px 10px 6px;">
              Create your account
            </a>
            <a href="${loginUrl}" style="background-color: #ffffff; color: #18181b; border: 1px solid #d4d4d8; padding: 10px 22px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; display: inline-block; margin: 0 6px 10px 6px;">
              I already have an account
            </a>
          </div>
        </div>`;

  const htmlContent = shell(
    headerTitle,
    `
        <p style="font-size: 16px; color: #374151;">Hi <strong>${recipientName}</strong>,</p>
        <p style="font-size: 16px; color: #374151;">${introLine}</p>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px 20px; margin: 24px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; width: 130px; vertical-align: top;">Event:</td>
              <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${eventName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; vertical-align: top;">Role:</td>
              <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${role}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; vertical-align: top;">Certificate ID:</td>
              <td style="padding: 6px 0;">
                <code style="background-color: #e2e8f0; color: #0f172a; padding: 4px 8px; border-radius: 4px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 13px; font-weight: 600; letter-spacing: 0.5px; display: inline-block;">${certificateId}</code>
              </td>
            </tr>
          </table>
        </div>
        ${primaryCta}
        <p style="font-size: 13px; color: #9ca3af; text-align: center;">
          Or copy this link into your browser:<br>
          <a href="${certUrl}" style="color: #4f46e5;">${certUrl}</a>
        </p>
        ${secondaryBlock}
    `
  );

  const subject = accountExists
    ? `Your certificate for ${eventName} is in your account`
    : `Your Certificate for ${eventName}`;

  const result = await deliver(
    { from: FROM(), to, subject, html: htmlContent },
    `[MOCK EMAIL SENT TO ${to}] account=${accountExists} | cert -> ${certUrl} | signup -> ${signupUrl} | login -> ${loginUrl}`
  );

  return { ...result, links: { certUrl, signupUrl, loginUrl } };
}

interface CheckInParams {
  to: string;
  recipientName: string;
  eventName: string;
  accountExists?: boolean;
}

/**
 * Confirmation email sent at kiosk check-in for events where the certificate is
 * NOT issued automatically. There is no certificate link yet - this just
 * reassures the attendee they are registered and tells them what happens next.
 * If they already have an account we point at the wallet; otherwise we invite
 * them to create one so the certificate has somewhere to land.
 */
export async function sendCheckInConfirmationEmail({
  to,
  recipientName,
  eventName,
  accountExists = false,
}: CheckInParams) {
  const base = resolveBaseUrl();
  const emailParam = encodeURIComponent(to);
  const signupUrl = `${base}/register?email=${emailParam}`;
  const loginUrl = `${base}/login?email=${emailParam}`;
  const portalUrl = `${base}/portal`;

  const actionBlock = accountExists
    ? `
        <div style="text-align: center; margin: 32px 0;">
          <a href="${portalUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
            Open your wallet
          </a>
        </div>
        <p style="font-size: 14px; color: #6b7280; text-align: center;">
          Your certificate will appear in your wallet as soon as the organizer issues it.
        </p>`
    : `
        <div style="border-top: 1px solid #e5e7eb; margin-top: 32px; padding-top: 24px;">
          <p style="font-size: 15px; color: #374151; margin: 0 0 8px 0;">
            <strong>Want it the moment it's ready?</strong>
          </p>
          <p style="font-size: 14px; color: #6b7280; margin: 0 0 20px 0;">
            Create a free Shim account with <strong>${to}</strong> and your certificate will land straight in your wallet once the organizer issues it. Already have an account? Just sign in.
          </p>
          <div style="text-align: center;">
            <a href="${signupUrl}" style="background-color: #18181b; color: #ffffff; padding: 11px 22px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; display: inline-block; margin: 0 6px 10px 6px;">
              Create your account
            </a>
            <a href="${loginUrl}" style="background-color: #ffffff; color: #18181b; border: 1px solid #d4d4d8; padding: 10px 22px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; display: inline-block; margin: 0 6px 10px 6px;">
              I already have an account
            </a>
          </div>
        </div>`;

  const htmlContent = shell(
    "You're Checked In",
    `
        <p style="font-size: 16px; color: #374151;">Hi <strong>${recipientName}</strong>,</p>
        <p style="font-size: 16px; color: #374151;">
          You're checked in for <strong>${eventName}</strong>. Thanks for attending!
        </p>
        <p style="font-size: 16px; color: #374151;">
          Your certificate is being prepared by the organizer and will be emailed to
          <strong>${to}</strong> as soon as it's ready. No action needed right now.
        </p>
        ${actionBlock}
    `
  );

  const result = await deliver(
    { from: FROM(), to, subject: `You're checked in for ${eventName}`, html: htmlContent },
    `[MOCK EMAIL SENT TO ${to}] checkin-confirmation account=${accountExists} | signup -> ${signupUrl} | login -> ${loginUrl}`
  );

  return { ...result, links: { signupUrl, loginUrl } };
}
