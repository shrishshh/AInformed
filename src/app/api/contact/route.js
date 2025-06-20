console.log("Contact API route called");
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

/**
 * If you want an alternative for email, you can use:
 * https://resend.com
 * 
 * This will also let you create beautiful emails using React for your users.
 */
export async function POST(req) {
  const { name, email, subject, message } = await req.json();

  if (!name || !email || !subject || !message) {
    console.log('Missing field:', { name, email, subject, message });
    return NextResponse.json({ success: false, error: 'All fields are required.' }, { status: 400 });
  }

  // Log transporter config (not password)
  console.log('Nodemailer user:', process.env.BREVO_SMTP_USER);

  // Configure transporter for Brevo SMTP
  const transporter = nodemailer.createTransport({
    host: process.env.BREVO_SMTP_HOST,
    port: parseInt(process.env.BREVO_SMTP_PORT || '587', 10),
    secure: process.env.BREVO_SMTP_PORT === '465', // Use SSL for port 465
    auth: {
      user: process.env.BREVO_SMTP_USER,
      pass: process.env.BREVO_SMTP_PASS,
    },
  });

  const mailOptions = {
    from: 'sidemindlabs@gmail.com', // Use your verified email as the sender
    to: 'sidemindlabs@gmail.com',
    subject: `Contact Form: ${subject}`,
    text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
    replyTo: email,
  };

  console.log('Mail options:', mailOptions);

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Nodemailer sendMail info:', info);
    return NextResponse.json({ success: true, message: 'Message sent successfully!' });
  } catch (error) {
    console.error('Nodemailer error:', error);
    return NextResponse.json({ success: false, error: 'Failed to send message.' }, { status: 500 });
  }
} 