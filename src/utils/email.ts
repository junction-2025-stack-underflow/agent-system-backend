import nodemailer from "nodemailer";
import { logError } from "./logger";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendConfirmationEmail = async (
  email: string,
  agencyId: string,
  token: string
): Promise<void> => {
  const confirmationUrl = `${process.env.APP_URL}/api/agency/confirm-email?token=${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Confirm Your Agency Email - Houseek",
    html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirm Your Email</title>
      <!--[if mso]>
      <noscript>
        <xml>
          <o:OfficeDocumentSettings>
            <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
        </xml>
      </noscript>
      <![endif]-->
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8f9fa; padding: 40px 0;">
        <tr>
          <td align="center">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); overflow: hidden;">
            
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <div style="text-align: center;">
                    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                      <h2 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 24px; font-weight: 600;">
                        🎉 Almost There!
                      </h2>
                      <p style="color: #5a6c7d; font-size: 16px; line-height: 1.6; margin: 0;">
                        Thank you for registering with <strong style="color: #FF3E57;">Houseek</strong>. 
                        You're just one step away from accessing your account.
                      </p>
                    </div>
                    
                    <p style="color: #5a6c7d; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                      To complete your registration and verify your email address, please click the button below:
                    </p>
                    
                    <!-- CTA Button -->
                    <div style="margin: 40px 0;">
                      <a href="${confirmationUrl}" 
                         style="background: linear-gradient(135deg, #FF3E57 0%, #FF6B7A 100%); 
                                color: #ffffff; 
                                text-decoration: none; 
                                padding: 16px 32px; 
                                border-radius: 8px; 
                                font-weight: 600; 
                                font-size: 16px;
                                display: inline-block; 
                                box-shadow: 0 4px 15px rgba(255, 62, 87, 0.3);
                                transition: all 0.3s ease;
                                border: none;
                                cursor: pointer;">
                        ✅ Confirm Email Address
                      </a>
                    </div>
                    
                    
                    <!-- Warning -->
                    <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 30px 0;">
                      <p style="color: #856404; font-size: 14px; margin: 0;">
                        ⚠️ <strong>Important:</strong> This verification link will expire in 24 hours for security reasons.
                      </p>
                    </div>
                    
                    <!-- Additional Info -->
                    <div style="border-top: 1px solid #e9ecef; padding-top: 20px; margin-top: 30px;">
                      <p style="color: #6c757d; font-size: 14px; line-height: 1.5; margin: 0;">
                        If you didn't create an account with Houseek, you can safely ignore this email. 
                        No account will be created and no further emails will be sent.
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                  <div style="margin-bottom: 20px;">
                    <p style="color: #6c757d; font-size: 14px; margin: 0 0 10px 0;">
                      Need help? Contact our support team:
                    </p>
                    <p style="margin: 0;">
                      <a href="mailto:support@houseek.com" style="color: #FF3E57; text-decoration: none; font-weight: 600;">
                        support@houseek.com
                      </a>
                    </p>
                  </div>
                  
                  <hr style="border: none; border-top: 1px solid #dee2e6; margin: 20px 0;" />
                  
                  <p style="color: #adb5bd; font-size: 12px; margin: 0; line-height: 1.4;">
                    © ${new Date().getFullYear()} Houseek. All rights reserved.<br>
                    This email was sent to ${email}
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    logError("Error sending confirmation email", { error, email, agencyId });
    throw new Error("Failed to send confirmation email");
  }
};