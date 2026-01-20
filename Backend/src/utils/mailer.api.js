// Brevo API-based email sender (works on Render)
import * as brevo from '@getbrevo/brevo';

// Initialize API client
let apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
  brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

export const sendEmail = async (email, url) => {
  try {
    if (!process.env.BREVO_API_KEY) {
      throw new Error("BREVO_API_KEY is not configured");
    }

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    
    sendSmtpEmail.sender = {
      email: process.env.SENDER_EMAIL || 'whisperdesk26@gmail.com',
      name: 'WhisperDesk'
    };
    
    sendSmtpEmail.to = [{ email: email }];
    sendSmtpEmail.subject = "Your Magic Login Link ✔";
    sendSmtpEmail.textContent = `Click this link to login: ${url}`;
    sendSmtpEmail.htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Welcome to BlogApp!</h2>
        <p>Click the link below to log in to your account:</p>
        <p style="word-break: break-all; color: #666;">${url}</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">This link will expire in 15 minutes.</p>
      </div>
    `;

    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("Email sent successfully via API:", email, "- Message ID:", result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("Failed to send email to:", email);
    console.error("Error details:", error.message);
    if (error.body) {
      console.error("API Response:", error.body);
    }
    throw error;
  }
};
