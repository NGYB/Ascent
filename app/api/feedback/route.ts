import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { feedbackType, message, userEmail, currentPage } = body;

    // Validate message
    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { error: 'Please provide feedback message text.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        { 
          error: 'Feedback delivery is temporarily unavailable because RESEND_API_KEY is not configured yet in .env.' 
        },
        { status: 503 }
      );
    }

    const recipient = process.env.FEEDBACK_RECIPIENT_EMAIL?.trim();
    if (!recipient) {
      return NextResponse.json(
        { 
          error: 'Feedback delivery is temporarily unavailable because FEEDBACK_RECIPIENT_EMAIL is not configured yet in .env.' 
        },
        { status: 503 }
      );
    }
    const cleanType = ['bug', 'feature', 'general'].includes(feedbackType) ? feedbackType : 'general';
    const cleanMessage = message.trim();
    const cleanUserEmail = (typeof userEmail === 'string' && userEmail.trim().includes('@')) ? userEmail.trim() : null;
    const cleanPage = typeof currentPage === 'string' ? currentPage.trim() : 'App';

    const typeDetails: Record<string, { label: string; badgeBg: string; badgeColor: string; emoji: string }> = {
      bug: { label: 'Bug Report', badgeBg: '#fee2e2', badgeColor: '#991b1b', emoji: '🐛' },
      feature: { label: 'Feature Idea', badgeBg: '#e0e7ff', badgeColor: '#3730a3', emoji: '💡' },
      general: { label: 'General Feedback', badgeBg: '#ecfdf5', badgeColor: '#065f46', emoji: '💬' },
    };

    const currentType = typeDetails[cleanType] || typeDetails.general;
    const preview = cleanMessage.slice(0, 50).replace(/\r?\n/g, ' ');
    const subject = `${currentType.emoji} [Ascent Feedback] ${currentType.label}: ${preview}${cleanMessage.length > 50 ? '...' : ''}`;

    // Format safe HTML message
    const formattedMessage = cleanMessage
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br/>');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
            .card { max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 28px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
            .header { border-bottom: 1px solid #f1f5f9; padding-bottom: 16px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; }
            .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; background: ${currentType.badgeBg}; color: ${currentType.badgeColor}; }
            .meta-row { margin-bottom: 8px; font-size: 13px; color: #64748b; }
            .meta-row strong { color: #334155; }
            .message-box { background: #f8fafc; border-left: 4px solid #4f46e5; border-radius: 4px; padding: 16px; margin: 20px 0; font-size: 14px; line-height: 1.6; color: #0f172a; }
            .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8; text-align: center; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <span class="badge">${currentType.emoji} ${currentType.label}</span>
              <span style="font-size: 12px; color: #94a3b8; float: right;">Ascent Platform</span>
            </div>

            <div class="message-box">
              ${formattedMessage}
            </div>

            <div style="background-color: #f8fafc; border-radius: 8px; padding: 14px; margin-top: 16px;">
              <div class="meta-row">
                <strong>Sender Contact:</strong> ${cleanUserEmail ? `<a href="mailto:${cleanUserEmail}" style="color: #4f46e5; text-decoration: none;">${cleanUserEmail}</a>` : 'Anonymous (no email provided)'}
              </div>
              <div class="meta-row">
                <strong>Submitted From Page:</strong> <code>${cleanPage}</code>
              </div>
              <div class="meta-row" style="margin-bottom: 0;">
                <strong>Received At:</strong> ${new Date().toUTCString()}
              </div>
            </div>

            ${cleanUserEmail ? `
              <p style="font-size: 12px; color: #64748b; margin-top: 16px;">
                💡 <em>You can reply directly to this email in your email client to respond to the user.</em>
              </p>
            ` : ''}

            <div class="footer">
              Sent securely from your Ascent Job Acquisition Platform
            </div>
          </div>
        </body>
      </html>
    `;

    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: 'Ascent Feedback <onboarding@resend.dev>',
      to: [recipient],
      replyTo: cleanUserEmail || undefined,
      subject,
      html: htmlContent,
    });

    if (error) {
      console.error('Resend delivery error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to dispatch email via Resend' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback delivered successfully',
      id: data?.id
    });

  } catch (err: any) {
    console.error('Feedback route exception:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error processing feedback' },
      { status: 500 }
    );
  }
}
