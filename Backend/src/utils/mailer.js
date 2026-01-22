import nodemailer from "nodemailer";

// Verify required environment variables for Gmail SMTP
if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
  console.error("❌ GMAIL_USER or GMAIL_APP_PASSWORD environment variable is not set!");
}

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465, // SSL
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD, // must be an App Password, not the account password
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
  logger: process.env.NODE_ENV === "production" ? false : true,
  debug: process.env.NODE_ENV !== "production",
});

// Verify transporter on startup (optional)
if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
  transporter.verify((error) => {
    if (error) {
      console.error("❌ Gmail SMTP Configuration Error:", error.message);
      console.log("💡 Ensure you are using a Gmail App Password and that IMAP/SMTP is allowed.");
    } else {
      console.log("✅ Gmail SMTP server is ready to send emails");
    }
  });
}

export const sendEmail = async (email, url) => {
  try {
    // Verify transporter configuration
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      throw new Error("GMAIL_USER or GMAIL_APP_PASSWORD is not configured");
    }

    const info = await transporter.sendMail({
      from: process.env.SENDER_EMAIL || process.env.GMAIL_USER,
      to: email,
      subject: "Your Magic Login Link ✔",
      text: `Click this link to login: ${url}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Welcome to BlogApp!</h2>
          <p>Click the button below to log in to your account:</p>
          <a href="${url}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">Login Now</a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${url}</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">This link will expire in 15 minutes.</p>
        </div>
      `,
    });

    console.log("✅ Email sent successfully:", email, "- Message ID:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Failed to send email to:", email);
    console.error("Error details:", error.message);
    console.error("Error code:", error.code);
    if (error.response) {
      console.error("SMTP Response:", error.response);
    }
    throw error;
  }
};