import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://remotive.com/api/remote-jobs?search=AI', { cache: 'no-store' });
    const data = await response.json();
    const topJobs = (data.jobs || []).slice(0, 5).map((job: any) => ({
      title: job.title,
      company: job.company_name,
      url: job.url,
    }));
    return new NextResponse(JSON.stringify(topJobs), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
} 