import { NextResponse } from 'next/server';
import axios from 'axios';

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_LIST_ID = process.env.BREVO_LIST_ID;

export async function POST(req) {
  const { email } = await req.json();
  console.log('Received email for newsletter:', email);
  console.log('Using Brevo List ID:', BREVO_LIST_ID);

  if (!email || !/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
    console.log('Invalid email format:', email);
    return NextResponse.json({ success: false, error: 'Invalid email' }, { status: 400 });
  }

  try {
    const payload = {
      email,
      listIds: [parseInt(BREVO_LIST_ID, 10)],
      updateEnabled: true,
    };
    console.log('Sending payload to Brevo:', payload);
    const headers = {
      'Content-Type': 'application/json',
      'api-key': BREVO_API_KEY,
    };
    console.log('Using headers:', headers);

    const response = await axios.post(
      'https://api.brevo.com/v3/contacts',
      payload,
      { headers }
    );
    console.log('Brevo API response:', response.data);
    return NextResponse.json({ success: true, message: 'Subscribed successfully!' });
  } catch (error) {
    if (error.response) {
      console.error('Brevo API error response:', error.response.data);
    } else {
      console.error('Brevo API error:', error.message);
    }
    return NextResponse.json({ success: false, error: error.response?.data?.message || error.message }, { status: 400 });
  }
} 