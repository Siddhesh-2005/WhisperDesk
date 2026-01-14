import nodemailer from "nodemailer"

// Verify required environment variables
if (!process.env.BREVO_SMTP_KEY) {
  console.error("❌ BREVO_SMTP_KEY environment variable is not set!");
}

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 465, // Use 465 for SSL (more reliable on cloud platforms)
  secure: true, // true for port 465
  auth: {
    user: process.env.BREVO_SMTP_USER || "9e331c001@smtp-brevo.com",
    pass: process.env.BREVO_SMTP_KEY,
  },
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 10000, // 10 seconds
  socketTimeout: 10000, // 10 seconds
  logger: process.env.NODE_ENV === 'production' ? false : true,
  debug: process.env.NODE_ENV !== 'production',
});

// Verify transporter on startup (optional)
if (process.env.BREVO_SMTP_KEY) {
  transporter.verify((error, success) => {
    if (error) {
      console.error("❌ SMTP Configuration Error:", error.message);
      console.log("💡 If you see connection timeout, Render might be blocking port 465.");
      console.log("💡 Consider using a service like SendGrid, Mailgun, or Resend instead.");
    } else {
      console.log("✅ SMTP server is ready to send emails");
    }
  });
}

export const sendEmail = async (email, url) => {
  try {
    // Verify transporter configuration
    if (!process.env.BREVO_SMTP_KEY) {
      throw new Error("BREVO_SMTP_KEY is not configured");
    }

    const info = await transporter.sendMail({
      from: process.env.SENDER_EMAIL || 'siddheshbagde456@gmail.com',
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