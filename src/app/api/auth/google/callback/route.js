import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

const client_id = process.env.GOOGLE_CLIENT_ID;
const client_secret = process.env.GOOGLE_CLIENT_SECRET;
const redirect_uri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:9002/api/auth/google/callback';

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
    console.log('Google user info received:', userInfo);

    // Find or create user
    let user = await User.findOne({ email: userInfo.email });
    console.log('Existing user found:', !!user);
    
    if (!user) {
      user = new User({
        name: userInfo.name,
        email: userInfo.email,
        password: jwt.sign({ email: userInfo.email }, process.env.JWT_SECRET), // random password
        isEmailVerified: true,
      });
      await user.save();
      console.log('New user created:', user.email);
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    console.log('JWT token generated for user:', user.email);

    // Redirect to frontend with token
    const redirectTo = `http://localhost:9002/redirect?token=${token}`;
    return NextResponse.redirect(redirectTo);
  } catch (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.json({ message: 'Google OAuth error', error: error.message }, { status: 500 });
  }
} 