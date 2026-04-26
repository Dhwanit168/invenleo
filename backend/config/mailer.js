const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const BRAND_PRIMARY = '#185FA5'; // Leo Data Tech Blue
const BG_LIGHT = '#F9FAFB';
const CARD_BG = '#FFFFFF';
const TEXT_DARK = '#111827';
const TEXT_MUTED = '#6B7280';
const BORDER = '#E5E7EB';

const sendPasswordResetEmail = async (toEmail, username, resetURL) => {
  const expiresMinutes = process.env.RESET_TOKEN_EXPIRES_MINUTES || 15;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'Leo Data Tech <no-reply@leodatatech.com>',
    to: toEmail,
    subject: 'Reset your Leo Data Tech password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <style>
          body { margin:0; padding:0; background-color:${BG_LIGHT}; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; }
          .wrap { max-width:600px; margin:40px auto; padding: 20px; }
          .card { background-color:${CARD_BG}; border-radius:8px; border:1px solid ${BORDER}; padding:40px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
          .logo { font-size:24px; font-weight:800; color:${BRAND_PRIMARY}; margin-bottom:30px; letter-spacing: -0.5px; }
          h2 { font-size:22px; font-weight:700; color:${TEXT_DARK}; margin:0 0 16px; }
          p  { font-size:15px; color:${TEXT_MUTED}; line-height:1.6; margin:0 0 24px; }
          .btn { display:inline-block; padding:12px 24px; background-color:${BRAND_PRIMARY}; color:#ffffff !important;
                 text-decoration:none; border-radius:6px; font-size:15px; font-weight:600; text-align:center; }
          .note { font-size:13px; color:#9CA3AF; margin-top:32px; padding-top:24px; border-top:1px solid ${BORDER}; line-height:1.5; }
          .link { word-break:break-all; color:${BRAND_PRIMARY}; font-size:14px; }
        </style>
      </head>
      <body>
        <div class="wrap">
          <div class="card">
            <div class="logo">Leo Data Tech</div>
            <h2>Password Reset Request</h2>
            <p>Hi <strong>${username}</strong>,</p>
            <p>We received a request to reset your password for your Leo Data Tech account. Click the button below to set up a new password. For security reasons, this link will expire in <strong>${expiresMinutes} minutes</strong>.</p>
            <a href="${resetURL}" class="btn">Reset My Password</a>
            <p style="margin-top:24px; margin-bottom: 8px;">If the button doesn't work, copy and paste this link into your browser:</p>
            <a href="${resetURL}" class="link">${resetURL}</a>
            <div class="note">
              If you didn't request a password reset, you can safely ignore this email — your account remains secure and your password has not been changed.<br/><br/>
              &copy; ${new Date().getFullYear()} Leo Data Tech
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  });
};

const sendPasswordChangedEmail = async (toEmail, username) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'Leo Data Tech <no-reply@leodatatech.com>',
    to: toEmail,
    subject: 'Your Leo Data Tech password was changed',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <style>
          body { margin:0; padding:0; background-color:${BG_LIGHT}; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; }
          .wrap { max-width:600px; margin:40px auto; padding: 20px; }
          .card { background-color:${CARD_BG}; border-radius:8px; border:1px solid ${BORDER}; padding:40px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
          .logo { font-size:24px; font-weight:800; color:${BRAND_PRIMARY}; margin-bottom:30px; letter-spacing: -0.5px; }
          h2 { font-size:22px; font-weight:700; color:${TEXT_DARK}; margin:0 0 16px; }
          p  { font-size:15px; color:${TEXT_MUTED}; line-height:1.6; margin:0 0 16px; }
          .alert-box { background-color: #FEF2F2; border-left: 4px solid #EF4444; padding: 16px; border-radius: 4px; margin-top: 24px; }
          .alert-text { margin: 0; color: #991B1B; font-size: 14px; }
          .note { font-size:13px; color:#9CA3AF; margin-top:32px; padding-top:24px; border-top:1px solid ${BORDER}; }
        </style>
      </head>
      <body>
        <div class="wrap">
          <div class="card">
            <div class="logo">Leo Data Tech</div>
            <h2>Password Changed Successfully</h2>
            <p>Hi <strong>${username}</strong>,</p>
            <p>This is a confirmation that the password for your Leo Data Tech account was just changed.</p>
            <p>If you made this change, no further action is required.</p>
            
            <div class="alert-box">
              <p class="alert-text"><strong>Didn't make this change?</strong><br>Please contact your administrator immediately or use the forgotten password page to secure your account.</p>
            </div>
            
            <div class="note">&copy; ${new Date().getFullYear()} Leo Data Tech</div>
          </div>
        </div>
      </body>
      </html>
    `
  });
};


const sendReorderNotificationEmail = async (toEmail, username, details) => {
  const { productName, sku, supplier, quantity, purchaseNumber, approvedBy } = details;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'InvenLeo <no-reply@invenleo.com>',
    to: toEmail,
    subject: `[InvenLeo] Purchase Order ${purchaseNumber} created — ${productName}`,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"/>
      <style>
        body{margin:0;padding:0;background:#F7F8FA;font-family:'Segoe UI',Arial,sans-serif}
        .wrap{max-width:520px;margin:40px auto}
        .card{background:#fff;border-radius:12px;border:1px solid #E2E5EC;padding:40px}
        .logo{font-size:22px;font-weight:700;color:#1A1C28;margin-bottom:28px}
        .logo span{color:#C4600A}
        h2{font-size:20px;font-weight:600;color:#1A1C28;margin:0 0 12px}
        p{font-size:14px;color:#5A5D6E;line-height:1.7;margin:0 0 16px}
        table{width:100%;border-collapse:collapse;margin-bottom:20px}
        td{font-size:13px;padding:8px 0;border-bottom:1px solid #F0F1F4;color:#5A5D6E}
        td:first-child{color:#1A1C28;font-weight:600;width:140px}
        .badge{display:inline-block;background:#EAF3DE;color:#3F6B10;font-size:12px;font-weight:600;padding:4px 10px;border-radius:20px}
        .note{font-size:12px;color:#9CA0AE;margin-top:24px;padding-top:20px;border-top:1px solid #E2E5EC}
      </style></head>
      <body><div class="wrap"><div class="card">
        <div class="logo">Inven<span>Leo</span></div>
        <h2>Reorder Purchase Order Created</h2>
        <p>Hi <strong>${username}</strong>,</p>
        <p>A new purchase order was created after a stock reorder was approved.</p>
        <table>
          <tr><td>PO Number</td><td><span class="badge">${purchaseNumber}</span></td></tr>
          <tr><td>Product</td><td>${productName}</td></tr>
          <tr><td>SKU</td><td>${sku}</td></tr>
          <tr><td>Supplier</td><td>${supplier}</td></tr>
          <tr><td>Quantity</td><td>${quantity} units</td></tr>
          <tr><td>Approved By</td><td>${approvedBy}</td></tr>
        </table>
        <p>Please log in to InvenLeo to review and receive the order when it arrives.</p>
        <div class="note">&copy; ${new Date().getFullYear()} InvenLeo</div>
      </div></div></body></html>`
  });
};
module.exports = { sendPasswordResetEmail, sendPasswordChangedEmail, sendReorderNotificationEmail };

