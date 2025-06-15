import { NextResponse } from 'next/server';
import User from '@/models/User';
import connectDB from '@/lib/mongodb';
import jwt from 'jsonwebtoken';

export async function POST(req) {
  await connectDB();
  const { email, password } = await req.json();

  // Basic validation
  if (!email || !password) {
    return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
  }

  try {
    // Find user by email
    console.log('Attempting to find user with email:', email);
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found for email:', email);
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 400 });
    }
    console.log('User found:', user.email);

    // Check password
    console.log('Attempting to compare password for user:', user.email);
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('Password comparison failed for user:', user.email);
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 400 });
    }
    console.log('Password matched for user:', user.email);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
} 