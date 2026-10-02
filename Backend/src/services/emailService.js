const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: Number(process.env.SMTP_PORT || 587) === 465,
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 20000,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const sendEmail = async ({
  to,
  subject,
  text,
  html,
}) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      text,
      html,
    });

    console.log(
      `Email sent successfully: ${info.messageId}`
    );

    return info;
  } catch (error) {
    console.error(
      "Email sending error:",
      error.message
    );

    throw error;
  }
};

module.exports = {
  sendEmail,
};
