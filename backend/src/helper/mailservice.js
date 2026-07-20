const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport(
    {
        service: "gmail",
        secure: true,
        port: 465,
        auth: {
            user: process.env.HOST_MAIL,
            pass: process.env.HOST_KEY
        }
    }

)
const sendingMail = (email, otp) => {
    // Professional HTML template with branding
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
            .header { background-color: #0056b3; color: #ffffff; padding: 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { padding: 30px; color: #333333; line-height: 1.6; }
            .otp-box { background-color: #f8f9fa; border: 1px dashed #0056b3; padding: 15px; text-align: center; margin: 20px 0; font-size: 28px; font-weight: bold; color: #0056b3; letter-spacing: 2px; }
            .footer { background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #777777; }
        </style>
    </head>
    <body>
        <div class="container">
            <!-- Header with Company Name/Logo Placeholder -->
            <div class="header">
                <h1>Team Collebration System</h1>
                <p>Security Alert</p>
            </div>
            
            <div class="content">
                <p>Hello,</p>
                <p>We received a request to reset your password. Use the One-Time Password (OTP) below to verify your identity:</p>
                
                <div class="otp-box">
                    ${otp}
                </div>
                
                <p><strong>Validity:</strong> This OTP is valid for the next 5 minutes.</p>
                <p>If you did not request this password reset, please ignore this email or contact our support team immediately.</p>
                
                <p>Thanks,<br>The Support Team</p>
            </div>
            
            <!-- Footer with standard company disclaimer -->
            <div class="footer">
                <p>&copy; 2026 Your Company Name. All rights reserved.</p>
                <p>This is an automated message, please do not reply.</p>
            </div>
        </div>
    </body>
    </html>
    `;

    return {
        from: process.env.HOST_MAIL, 
        to: email,
        subject: "Password Reset Verification",
        text: `Your OTP for password reset is: ${otp}. This is an automated message.`,
        html: htmlContent
    };
};

module.exports = {
    transporter,
    sendingMail
}
