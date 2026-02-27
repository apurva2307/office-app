import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.ethereal.email",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER || "dummy@example.com",
    pass: process.env.SMTP_PASS || "dummy_pass",
  },
});

export async function sendWelcomeEmail(
  to: string,
  fullName: string,
  tempPassword: string,
) {
  const mailOptions = {
    from: process.env.SMTP_FROM || '"Sr. DFM Office App" <noreply@example.com>',
    to,
    subject: "Welcome to Office Web App",
    html: `
      <h1>Welcome, ${fullName}!</h1>
      <p>Your account has been created on the Office Web App.</p>
      <p>Your temporary password is: <strong>${tempPassword}</strong></p>
      <p>Please log in and change your password as soon as possible.</p>
      <p><a href="${process.env.NEXTAUTH_URL}/login">Login Here</a></p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${to}`);
    return { success: true };
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return { success: false, error: "Failed to send email" };
  }
}

export async function sendPasswordChangeEmail(to: string, fullName: string) {
  const mailOptions = {
    from: process.env.SMTP_FROM || '"Office App" <noreply@example.com>',
    to,
    subject: "Password Changed Successfully",
    html: `
        <h1>Password Updated</h1>
        <p>Dear ${fullName},</p>
        <p>This is a confirmation that your password has been successfully changed.</p>
        <p>If you did not perform this action, please contact your administrator immediately.</p>
      `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Error sending password change confirmation:", error);
    return { success: false, error: "Failed to send email" };
  }
}
