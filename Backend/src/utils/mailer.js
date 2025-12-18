import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: "9e331c001@smtp-brevo.com",
    pass: process.env.BREVO_SMTP_KEY,
  },
});

export const sendEmail= async (email,url) => {
  const info = await transporter.sendMail({
    from: 'siddheshbagde456@gmail.com',
    to: email,
    subject: "Hello ✔",
    text: "Hello world?", // plain‑text body
    html: `<b>${url}</b>`, // HTML body
  });

  console.log("Message sent:", email);
};