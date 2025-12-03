import * as nodemailer from 'nodemailer'

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null

  private async getTransporter() {
    if (this.transporter) {
      return this.transporter
    }

    // Check if SMTP credentials are configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.warn('SMTP credentials not configured. Email sending disabled.')
      return null
    }

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })

    return this.transporter
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const transporter = await this.getTransporter()

      if (!transporter) {
        console.warn('Email not sent - transporter not configured')
        return false
      }

      const emailFrom = process.env.EMAIL_FROM || 'noreply@vera.lk'

      const info = await transporter.sendMail({
        from: emailFrom,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      })

      console.log('Email sent:', info.messageId)
      return true
    } catch (error) {
      console.error('Failed to send email:', error)
      return false
    }
  }

  async sendListingApprovedEmail(
    userEmail: string,
    listingTitle: string,
    listingId: string,
    approvalNotes?: string
  ): Promise<boolean> {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vera.lk'
    const listingUrl = `${appUrl}/listings/${listingId}`

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 0;
          }
          .header {
            background-color: #2563eb;
            color: #ffffff;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            padding: 30px;
          }
          .listing-title {
            font-size: 20px;
            font-weight: bold;
            color: #1f2937;
            margin: 20px 0;
          }
          .message {
            background-color: #f0fdf4;
            border-left: 4px solid #22c55e;
            padding: 15px;
            margin: 20px 0;
          }
          .notes {
            background-color: #f3f4f6;
            border-left: 4px solid #6b7280;
            padding: 15px;
            margin: 20px 0;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #2563eb;
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: 600;
          }
          .footer {
            background-color: #f9fafb;
            padding: 20px 30px;
            text-align: center;
            font-size: 14px;
            color: #6b7280;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Listing Approved</h1>
          </div>
          <div class="content">
            <p>Your vehicle listing has been approved and is now live on vera.lk!</p>

            <div class="listing-title">${listingTitle}</div>

            <div class="message">
              <strong>Status:</strong> Your listing is now active and visible to buyers.
            </div>

            ${approvalNotes ? `
              <div class="notes">
                <strong>Admin Notes:</strong><br>
                ${approvalNotes}
              </div>
            ` : ''}

            <p>Your listing is now visible to thousands of potential buyers. You can view and manage your listing using the link below.</p>

            <a href="${listingUrl}" class="button">View Your Listing</a>

            <p><strong>Next Steps:</strong></p>
            <ul>
              <li>Monitor your listing views and messages</li>
              <li>Respond promptly to buyer inquiries</li>
              <li>Consider boosting your listing for more visibility</li>
            </ul>
          </div>
          <div class="footer">
            <p>This is an automated notification from vera.lk</p>
            <p>If you have questions, please contact our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `

    const text = `
Your Listing Has Been Approved!

${listingTitle}

Your vehicle listing has been approved and is now live on vera.lk.

${approvalNotes ? `Admin Notes: ${approvalNotes}\n` : ''}

View your listing: ${listingUrl}

Next Steps:
- Monitor your listing views and messages
- Respond promptly to buyer inquiries
- Consider boosting your listing for more visibility

---
This is an automated notification from vera.lk
    `.trim()

    return this.sendEmail({
      to: userEmail,
      subject: `✓ Your Listing "${listingTitle}" is Now Live`,
      html,
      text,
    })
  }
}

export const emailService = new EmailService()
