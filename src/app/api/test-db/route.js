import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
  try {
    // Attempt to connect to MongoDB
    await connectDB();
    
    // Try to count users in the database
    const userCount = await User.countDocuments();
    
    return NextResponse.json({
      status: 'success',
      message: 'MongoDB connection successful',
      userCount: userCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('MongoDB test connection error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'MongoDB connection failed',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 