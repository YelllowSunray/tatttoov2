import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createInquiry } from '@/lib/firestore';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      artistId,
      artistEmail,
      artistName,
      customerName,
      customerEmail,
      preferredDate,
      preferredTime,
      bodyPart,
      budget,
      message,
    } = body;

    // Validate required fields
    if (!artistId || !customerEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // User ID will be passed from client if authenticated
    // For now, we'll get it from the request body if provided
    const userId = body.userId;

    // Create inquiry in Firestore
    const inquiryId = await createInquiry({
      artistId,
      userId,
      customerEmail,
      customerName,
      preferredDate,
      preferredTime,
      bodyPart,
      budget,
      message,
    });

    // Send email to artist if email is available
    if (artistEmail) {
      try {
        const emailSubject = `New Consultation Request from ${customerName || customerEmail}`;
        
        const emailBody = `
          <h2>New Consultation Request</h2>
          <p>You have received a new consultation request through Tattoo Discovery.</p>
          
          <h3>Customer Information:</h3>
          <ul>
            <li><strong>Name:</strong> ${customerName || 'Not provided'}</li>
            <li><strong>Email:</strong> ${customerEmail}</li>
            ${preferredDate ? `<li><strong>Preferred Date:</strong> ${preferredDate}</li>` : ''}
            ${preferredTime ? `<li><strong>Preferred Time:</strong> ${preferredTime}</li>` : ''}
            ${bodyPart ? `<li><strong>Body Part:</strong> ${bodyPart}</li>` : ''}
            ${budget ? `<li><strong>Budget:</strong> €${budget.toLocaleString()}</li>` : ''}
          </ul>
          
          ${message ? `<h3>Message:</h3><p>${message.replace(/\n/g, '<br>')}</p>` : ''}
          
          <p>Please respond to this inquiry at your earliest convenience.</p>
          
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            This inquiry was sent through Tattoo Discovery. You can manage your inquiries in your artist dashboard.
          </p>
        `;

        await resend.emails.send({
          from: 'Tattoo Discovery <onboarding@resend.dev>', // You'll need to verify a domain with Resend for production
          to: artistEmail,
          subject: emailSubject,
          html: emailBody,
          replyTo: customerEmail,
        });
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
        // Don't fail the request if email fails - inquiry is still saved
      }
    }

    return NextResponse.json({ 
      success: true, 
      inquiryId 
    });
  } catch (error: any) {
    console.error('Error creating inquiry:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create inquiry' },
      { status: 500 }
    );
  }
}

