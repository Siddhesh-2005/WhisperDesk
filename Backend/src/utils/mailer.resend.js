// Resend email sender (modern, reliable, works on all platforms)
// Install: npm install resend
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async (email, url) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { data, error } = await resend.emails.send({
      //from: process.env.SENDER_EMAIL || 'whisperdesk26@gmail.com',
      from: 'onboarding@resend.dev',
      to: email,
      subject: "Your Magic Login Link ✔",
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

    if (error) {
      throw error;
    }

    console.log("✅ Email sent successfully via Resend:", email, "- ID:", data.id);
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error("❌ Failed to send email to:", email);
    console.error("Error details:", error.message);
    throw error;
  }
};
