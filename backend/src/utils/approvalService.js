const nodemailer = require('nodemailer');

const sendAdminApprovalEmail = async (operatorId, operatorName) => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) throw new Error("Admin email not configured");

    const approvalLink = `http://localhost:5000/api/auth/operator/approve?operatorId=${operatorId}&action=accept`;
    const rejectionLink = `http://localhost:5000/api/auth/operator/approve?operatorId=${operatorId}&action=reject`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS, 
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: adminEmail,
      subject: 'New Operator Registration Approval Required',
      html: `
        <p>New operator <strong>${operatorName}</strong> has registered. Please approve or reject their registration:</p>
        <p><a href="${approvalLink}">Approve</a></p>
        <p><a href="${rejectionLink}">Reject</a></p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Approval email sent to admin');
  } catch (error) {
    console.error('Error sending approval email:', error);
    throw error;
  }
};

module.exports = { sendAdminApprovalEmail };
