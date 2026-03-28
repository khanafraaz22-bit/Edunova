const nodemailer = require('nodemailer');

let transporter;

async function getTransporter() {
  if (transporter) return transporter;
  
  if (process.env.NODE_ENV === 'production' && process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else {
    // Use Ethereal for development
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  }
  
  return transporter;
}

async function sendResetEmail(to, resetToken) {
  const transport = await getTransporter();
  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
  
  const info = await transport.sendMail({
    from: '"EduNova" <noreply@edunova.ai>',
    to,
    subject: 'EduNova — Password Reset',
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; background: #02020e; color: #e8eaf6; padding: 40px; border-radius: 12px;">
        <h1 style="color: #00f5ff;">EduNova</h1>
        <p>You requested a password reset. Click the button below to set a new password:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #00f5ff, #9b5de5); color: #02020e; font-weight: bold; border-radius: 8px; text-decoration: none; margin: 20px 0;">
          Reset Password
        </a>
        <p style="color: #7c83a0; font-size: 12px; margin-top: 30px;">
          This link expires in 1 hour. If you didn't request this, ignore this email.
        </p>
      </div>
    `
  });

  // Log preview URL in dev mode
  if (process.env.NODE_ENV !== 'production') {
    console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info));
  }

  return info;
}

module.exports = { sendResetEmail };
