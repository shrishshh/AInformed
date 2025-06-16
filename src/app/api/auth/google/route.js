import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

const client_id = process.env.GOOGLE_CLIENT_ID;
const client_secret = process.env.GOOGLE_CLIENT_SECRET;

// Add these logs for debugging
console.log('NEXT_PUBLIC_APP_URL (in route.js):', process.env.NEXT_PUBLIC_APP_URL);
console.log('GOOGLE_REDIRECT_URI (in route.js):', process.env.GOOGLE_REDIRECT_URI);

const redirect_uri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/google/callback`;

const oauth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uri
);

export async function GET(req) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  if (!code) {
    return NextResponse.json({ message: 'No code provided' }, { status: 400 });
  }

  try {
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    // Find or create user
    let user = await User.findOne({ email: userInfo.email });
    if (!user) {
      user = new User({
        name: userInfo.name,
        email: userInfo.email,
        password: jwt.sign({ email: userInfo.email }, process.env.JWT_SECRET), // random password
        isEmailVerified: true,
      });
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Redirect to frontend with token
    const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/redirect?token=${token}`;
    console.log('Redirecting to:', redirectTo); // Add this log as well
    return NextResponse.redirect(redirectTo);
  } catch (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.json({ message: 'Google OAuth error', error: error.message }, { status: 500 });
  }
} 