import { NextResponse } from 'next/server';
import axios from 'axios';

const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const SYMBOLS = ['NVDA', 'GOOGL', 'MSFT', 'AMD', 'META', 'TSLA', 'ARM', 'SNOW'];

export async function GET() {
  if (!API_KEY) {
    return NextResponse.json({ error: 'Alpha Vantage API key not set' }, { status: 500 });
  }

  try {
    const results = await Promise.all(
      SYMBOLS.map(async (symbol) => {
        const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
        const response = await axios.get(url);
        const data = response.data['Global Quote'];
        if (!data || !data['05. price']) {
          console.warn(`No valid data for symbol: ${symbol}`, response.data);
          return null;
        }
        return {
          symbol: symbol,
          price: parseFloat(data['05. price']),
          change: parseFloat(data['09. change']),
          percentChange: data['10. change percent'],
          lastUpdated: new Date().toISOString(),
        };
      })
    );
    // Filter out any nulls (invalid/missing data)
    const validResults = results.filter(Boolean);
    return NextResponse.json(validResults);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch stock prices' }, { status: 500 });
  }
} 