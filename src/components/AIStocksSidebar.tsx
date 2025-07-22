'use client';
import { useEffect, useState } from 'react';

interface Stock {
  symbol: string;
  price: number;
  change: number;
  percentChange: string;
  lastUpdated: string;
}

export default function AIStocksSidebar() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/ai-stocks')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setStocks(data);
        } else {
          setError(data?.error || 'Failed to load stock data');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load stock data');
        setLoading(false);
      });
  }, []);

  function formatPercentChange(percent: string) {
    const num = parseFloat(percent);
    if (isNaN(num)) return percent;
    return num.toFixed(2) + '%';
  }

  return (
    <div className="space-y-6">
      <div className="border-0 shadow-sm rounded-xl bg-card/80">
        <div className="pb-3 px-6 pt-6">
          <h3 className="text-lg flex items-center gap-2 font-bold">AI Market Trends</h3>
        </div>
        <div className="pt-0 px-6 pb-6">
          {loading && <div className="text-muted-foreground">Loading...</div>}
          {error && <div className="text-red-500">{error}</div>}
          {!loading && !error && Array.isArray(stocks) && (
            <div className="space-y-2">
              {stocks.map((stock) => {
                const isUp = stock.change >= 0;
                return (
                  <div
                    key={stock.symbol}
                    className="grid grid-cols-3 items-center gap-2"
                  >
                    <span className="font-bold text-left col-span-1 w-20">{stock.symbol}</span>
                    <span className="font-bold text-left col-span-1 w-24">${stock.price.toFixed(2)}</span>
                    <span
                      className={
                        (isUp ? 'text-green-500' : 'text-red-500') +
                        ' font-semibold flex items-center justify-end col-span-1 w-24 ml-auto'
                      }
                    >
                      {isUp ? (
                        <span className="mr-1">&#x25B2;</span>
                      ) : (
                        <span className="mr-1">&#x25BC;</span>
                      )}
                      {formatPercentChange(stock.percentChange)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 