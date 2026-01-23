// Gmail API sender (HTTPS, no SMTP egress required)
import { google } from "googleapis";

// Required envs:
// GMAIL_USER: account email to send from
// GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN
// Optional: SENDER_EMAIL (must be same as GMAIL_USER unless you use aliases)

const requiredEnv = [
  "GMAIL_USER",
  "GMAIL_CLIENT_ID",
  "GMAIL_CLIENT_SECRET",
  "GMAIL_REFRESH_TOKEN",
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`❌ Missing env ${key} for Gmail API sending`);
  }
}

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  // Redirect URI is not used at runtime; only needed when you created the refresh token
  process.env.GMAIL_REDIRECT_URI || "https://developers.google.com/oauthplayground"
);

oauth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN,
});

const gmail = google.gmail({ version: "v1", auth: oauth2Client });

function buildRawMessage({ from, to, subject, html, text }) {
  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: 7bit`,
  ];

  const body = html || text || "";
  const raw = headers.join("\r\n") + "\r\n\r\n" + body;
  return Buffer.from(raw)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export const sendEmail = async (email, url) => {
  try {
    // Ensure envs exist
    for (const key of requiredEnv) {
      if (!process.env[key]) {
        throw new Error(`${key} is not configured`);
      }
    }

    // Get a fresh access token (googleapis handles refresh automatically)
    await oauth2Client.getAccessToken();

    const from = process.env.SENDER_EMAIL || process.env.GMAIL_USER;
    const subject = "Your Magic Login Link ✔";
    const html = `
      <div style=\"font-family: Arial, sans-serif; padding: 20px;\">
        <h2>Welcome to BlogApp!</h2>
        <p>Click the button below to log in to your account:</p>
        <a href=\"${url}\" style=\"display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;\">Login Now</a>
        <p>Or copy and paste this link into your browser:</p>
        <p style=\"word-break: break-all; color: #666;\">${url}</p>
        <p style=\"color: #999; font-size: 12px; margin-top: 30px;\">This link will expire in 15 minutes.</p>
      </div>
    `;

    const raw = buildRawMessage({ from, to: email, subject, html });

    const res = await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw },
    });

    const id = res?.data?.id || res?.data?.message?.id;
    console.log("✅ Email sent via Gmail API:", email, "- ID:", id);
    return { success: true, messageId: id };
  } catch (error) {
    console.error("❌ Failed to send email via Gmail API to:", email);
    console.error("Error details:", error?.message || error);
    if (error?.response?.data) {
      console.error("API Response:", JSON.stringify(error.response.data));
    }
    throw error;
  }
};