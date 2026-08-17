import { NextRequest, NextResponse } from 'next/server';

interface ContactFormData {
  name: string;
  email: string;
  projectType: string;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ContactFormData = await request.json();

    const { name, email, projectType, message } = body;

    // Validation
    if (!name || !email || !projectType || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Message validation
    if (message.trim().length < 10) {
      return NextResponse.json(
        { error: 'Message must be at least 10 characters' },
        { status: 400 }
      );
    }

    // Send email (using environment variable EMAIL_SERVICE)
    // For now, we'll log to console and simulate success
    console.log('Contact form submission:', {
      name,
      email,
      projectType,
      message,
      timestamp: new Date().toISOString(),
    });

    // TODO: Integrate with email service (SendGrid, Resend, etc.)
    // const response = await fetch('https://api.example.com/send-email', {
    //   method: 'POST',
    //   headers: { 'Authorization': `Bearer ${process.env.EMAIL_API_KEY}` },
    //   body: JSON.stringify({
    //     to: process.env.ADMIN_EMAIL,
    //     from: email,
    //     subject: `New Contact: ${projectType}`,
    //     html: `<p><strong>${name}</strong> (${email})</p><p>${message}</p>`
    //   })
    // });

    // Track conversion
    console.log('Contact form submission tracked for analytics');

    return NextResponse.json(
      {
        success: true,
        message: 'Message received. We\'ll get back to you soon.'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Failed to process contact form' },
      { status: 500 }
    );
  }
}
