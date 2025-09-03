import nodemailer from 'nodemailer';
import mjml2html from 'mjml';
import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const prisma = new PrismaClient();

// Zoho Mail SMTP Configuration
const transporter = nodemailer.createTransporter({
  host: 'smtp.zoho.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.ZOHO_EMAIL, // bluerockasset@zohomail.com
    pass: process.env.ZOHO_APP_PASSWORD, // App-specific password
  },
});

export interface EmailTemplate {
  subject: string;
  mjml: string;
  plainText: string;
}

export interface EmailData {
  to: string;
  template: string;
  data: Record<string, any>;
}

export const emailTemplates: Record<string, EmailTemplate> = {
  welcome: {
    subject: 'Welcome to BlueRock Asset Management',
    mjml: `
      <mjml>
        <mj-head>
          <mj-title>Welcome to BlueRock Asset Management</mj-title>
          <mj-font name="Inter" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" />
          <mj-attributes>
            <mj-all font-family="Inter, Arial, sans-serif" />
          </mj-attributes>
        </mj-head>
        <mj-body background-color="#f9fafb">
          <mj-section background-color="#ffffff" padding="40px 20px">
            <mj-column>
              <mj-image src="{{logoUrl}}" alt="BlueRock Asset Management" width="200px" />
              <mj-text font-size="24px" font-weight="600" color="#0066CC" align="center" padding="20px 0">
                Welcome to BlueRock Asset Management
              </mj-text>
              <mj-text font-size="16px" color="#374151" line-height="1.6">
                Dear {{firstName}},
              </mj-text>
              <mj-text font-size="16px" color="#374151" line-height="1.6">
                Welcome to BlueRock Asset Management, where your financial future meets expert guidance and innovative investment solutions.
              </mj-text>
              <mj-text font-size="16px" color="#374151" line-height="1.6">
                Your account has been successfully created. You can now access your dashboard to:
              </mj-text>
              <mj-text font-size="14px" color="#374151" line-height="1.8" padding-left="20px">
                • Make secure cryptocurrency deposits<br/>
                • Track your investment performance<br/>
                • Monitor weekly payouts<br/>
                • Access detailed transaction history<br/>
                • Manage withdrawal requests
              </mj-text>
              <mj-button background-color="#0066CC" color="#ffffff" font-size="16px" font-weight="600" href="{{dashboardUrl}}" padding="20px 0">
                Access Your Dashboard
              </mj-button>
              <mj-text font-size="14px" color="#6B7280" line-height="1.6" padding="20px 0 0 0">
                If you have any questions, our support team is available 24/7 through live chat or email.
              </mj-text>
            </mj-column>
          </mj-section>
          <mj-section background-color="#f9fafb" padding="20px">
            <mj-column>
              <mj-text font-size="12px" color="#9CA3AF" align="center">
                © 2025 BlueRock Asset Management. All rights reserved.<br/>
                This email was sent to {{email}}. Investment involves risk.
              </mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `,
    plainText: `Welcome to BlueRock Asset Management

Dear {{firstName}},

Welcome to BlueRock Asset Management, where your financial future meets expert guidance and innovative investment solutions.

Your account has been successfully created. You can now access your dashboard to:
• Make secure cryptocurrency deposits
• Track your investment performance  
• Monitor weekly payouts
• Access detailed transaction history
• Manage withdrawal requests

Access your dashboard: {{dashboardUrl}}

If you have any questions, our support team is available 24/7 through live chat or email.

© 2025 BlueRock Asset Management. All rights reserved.
This email was sent to {{email}}. Investment involves risk.`
  },

  depositReceived: {
    subject: 'Deposit Received - Pending Confirmation',
    mjml: `
      <mjml>
        <mj-head>
          <mj-title>Deposit Received</mj-title>
          <mj-font name="Inter" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" />
        </mj-head>
        <mj-body background-color="#f9fafb">
          <mj-section background-color="#ffffff" padding="40px 20px">
            <mj-column>
              <mj-image src="{{logoUrl}}" alt="BlueRock Asset Management" width="200px" />
              <mj-text font-size="24px" font-weight="600" color="#0066CC" align="center">
                Deposit Received
              </mj-text>
              <mj-text font-size="16px" color="#374151">
                Dear {{firstName}},
              </mj-text>
              <mj-text font-size="16px" color="#374151">
                We have received your deposit submission and it is currently being processed.
              </mj-text>
              <mj-table>
                <tr style="border-bottom:1px solid #E5E7EB;text-align:left;">
                  <td style="padding: 10px; font-weight: 600;">Amount:</td>
                  <td style="padding: 10px;">${{amount}} USD</td>
                </tr>
                <tr style="border-bottom:1px solid #E5E7EB;text-align:left;">
                  <td style="padding: 10px; font-weight: 600;">Cryptocurrency:</td>
                  <td style="padding: 10px;">{{cryptoType}}</td>
                </tr>
                <tr style="border-bottom:1px solid #E5E7EB;text-align:left;">
                  <td style="padding: 10px; font-weight: 600;">Transaction ID:</td>
                  <td style="padding: 10px;">{{transactionId}}</td>
                </tr>
                <tr style="text-align:left;">
                  <td style="padding: 10px; font-weight: 600;">Status:</td>
                  <td style="padding: 10px; color: #F59E0B;">Pending Confirmation</td>
                </tr>
              </mj-table>
              <mj-text font-size="14px" color="#6B7280">
                Your deposit will be confirmed within 24 hours. Once confirmed, your investment plan will automatically begin.
              </mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `,
    plainText: `Deposit Received - Pending Confirmation

Dear {{firstName}},

We have received your deposit submission and it is currently being processed.

Amount: ${{amount}} USD
Cryptocurrency: {{cryptoType}}
Transaction ID: {{transactionId}}
Status: Pending Confirmation

Your deposit will be confirmed within 24 hours. Once confirmed, your investment plan will automatically begin.`
  },

  depositConfirmed: {
    subject: 'Investment Plan Activated - Welcome to BlueRock',
    mjml: `
      <mjml>
        <mj-head>
          <mj-title>Investment Plan Activated</mj-title>
          <mj-font name="Inter" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" />
        </mj-head>
        <mj-body background-color="#f9fafb">
          <mj-section background-color="#ffffff" padding="40px 20px">
            <mj-column>
              <mj-image src="{{logoUrl}}" alt="BlueRock Asset Management" width="200px" />
              <mj-text font-size="24px" font-weight="600" color="#10B981" align="center">
                Investment Plan Activated
              </mj-text>
              <mj-text font-size="16px" color="#374151">
                Congratulations {{firstName}}!
              </mj-text>
              <mj-text font-size="16px" color="#374151">
                Your deposit has been confirmed and your investment plan is now active.
              </mj-text>
              <mj-table>
                <tr style="border-bottom:1px solid #E5E7EB;text-align:left;">
                  <td style="padding: 10px; font-weight: 600;">Investment Amount:</td>
                  <td style="padding: 10px;">${{amount}} USD</td>
                </tr>
                <tr style="border-bottom:1px solid #E5E7EB;text-align:left;">
                  <td style="padding: 10px; font-weight: 600;">Weekly Payout:</td>
                  <td style="padding: 10px;">${{weeklyPayout}} USD</td>
                </tr>
                <tr style="border-bottom:1px solid #E5E7EB;text-align:left;">
                  <td style="padding: 10px; font-weight: 600;">Plan Duration:</td>
                  <td style="padding: 10px;">8 weeks</td>
                </tr>
                <tr style="border-bottom:1px solid #E5E7EB;text-align:left;">
                  <td style="padding: 10px; font-weight: 600;">First Payout:</td>
                  <td style="padding: 10px;">{{nextPayoutDate}}</td>
                </tr>
                <tr style="text-align:left;">
                  <td style="padding: 10px; font-weight: 600;">Total Returns:</td>
                  <td style="padding: 10px; color: #10B981; font-weight: 600;">${{totalReturns}} USD</td>
                </tr>
              </mj-table>
              <mj-button background-color="#0066CC" color="#ffffff" href="{{dashboardUrl}}">
                View Investment Dashboard
              </mj-button>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `,
    plainText: `Investment Plan Activated

Congratulations {{firstName}}!

Your deposit has been confirmed and your investment plan is now active.

Investment Amount: ${{amount}} USD
Weekly Payout: ${{weeklyPayout}} USD
Plan Duration: 8 weeks
First Payout: {{nextPayoutDate}}
Total Returns: ${{totalReturns}} USD

View your dashboard: {{dashboardUrl}}`
  },

  weeklyPayout: {
    subject: 'Weekly Payout Sent - ${{amount}}',
    mjml: `
      <mjml>
        <mj-head>
          <mj-title>Weekly Payout Sent</mj-title>
          <mj-font name="Inter" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" />
        </mj-head>
        <mj-body background-color="#f9fafb">
          <mj-section background-color="#ffffff" padding="40px 20px">
            <mj-column>
              <mj-image src="{{logoUrl}}" alt="BlueRock Asset Management" width="200px" />
              <mj-text font-size="24px" font-weight="600" color="#10B981" align="center">
                Weekly Payout Sent
              </mj-text>
              <mj-text font-size="16px" color="#374151">
                Dear {{firstName}},
              </mj-text>
              <mj-text font-size="16px" color="#374151">
                Your weekly payout has been successfully processed and sent to your account.
              </mj-text>
              <mj-table>
                <tr style="border-bottom:1px solid #E5E7EB;text-align:left;">
                  <td style="padding: 10px; font-weight: 600;">Payout Amount:</td>
                  <td style="padding: 10px; color: #10B981; font-weight: 600;">${{amount}} USD</td>
                </tr>
                <tr style="border-bottom:1px solid #E5E7EB;text-align:left;">
                  <td style="padding: 10px; font-weight: 600;">Week Number:</td>
                  <td style="padding: 10px;">{{weekNumber}} of 8</td>
                </tr>
                <tr style="border-bottom:1px solid #E5E7EB;text-align:left;">
                  <td style="padding: 10px; font-weight: 600;">Date:</td>
                  <td style="padding: 10px;">{{payoutDate}}</td>
                </tr>
                <tr style="text-align:left;">
                  <td style="padding: 10px; font-weight: 600;">Next Payout:</td>
                  <td style="padding: 10px;">{{nextPayoutDate}}</td>
                </tr>
              </mj-table>
              <mj-button background-color="#0066CC" color="#ffffff" href="{{dashboardUrl}}">
                View Transaction History
              </mj-button>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `,
    plainText: `Weekly Payout Sent - ${{amount}}

Dear {{firstName}},

Your weekly payout has been successfully processed and sent to your account.

Payout Amount: ${{amount}} USD
Week Number: {{weekNumber}} of 8
Date: {{payoutDate}}
Next Payout: {{nextPayoutDate}}

View your transaction history: {{dashboardUrl}}`
  }
};

export const sendEmail = async (emailData: EmailData): Promise<boolean> => {
  try {
    const template = emailTemplates[emailData.template];
    if (!template) {
      throw new Error(`Email template '${emailData.template}' not found`);
    }

    // Replace template variables
    let mjmlContent = template.mjml;
    let plainTextContent = template.plainText;
    let subject = template.subject;

    Object.entries(emailData.data).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      mjmlContent = mjmlContent.replace(new RegExp(placeholder, 'g'), String(value));
      plainTextContent = plainTextContent.replace(new RegExp(placeholder, 'g'), String(value));
      subject = subject.replace(new RegExp(placeholder, 'g'), String(value));
    });

    // Convert MJML to HTML
    const { html } = mjml2html(mjmlContent);

    // Log email attempt
    const emailLog = await prisma.emailLog.create({
      data: {
        to: emailData.to,
        subject,
        template: emailData.template,
        status: 'PENDING',
      },
    });

    // Send email
    await transporter.sendMail({
      from: `"BlueRock Asset Management" <${process.env.ZOHO_EMAIL}>`,
      to: emailData.to,
      subject,
      html,
      text: plainTextContent,
    });

    // Update email log
    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
    });

    logger.info(`Email sent successfully to ${emailData.to}`);
    return true;

  } catch (error) {
    logger.error('Failed to send email:', error);
    
    // Update email log with error
    try {
      await prisma.emailLog.updateMany({
        where: {
          to: emailData.to,
          template: emailData.template,
          status: 'PENDING',
        },
        data: {
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    } catch (logError) {
      logger.error('Failed to update email log:', logError);
    }

    return false;
  }
};

// Test email configuration
export const testEmailConnection = async (): Promise<boolean> => {
  try {
    await transporter.verify();
    logger.info('Email configuration verified successfully');
    return true;
  } catch (error) {
    logger.error('Email configuration test failed:', error);
    return false;
  }
};