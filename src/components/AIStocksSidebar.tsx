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
      <div className="border border-border shadow-lg rounded-xl bg-card overflow-hidden">
        <div className="pb-4 px-6 pt-6 border-b border-border">
          <h3 className="text-xl font-semibold">AI Market Trends</h3>
          <p className="text-sm text-muted-foreground mt-1">Real-time stock prices</p>
        </div>
        <div className="pt-4 px-6 pb-6">
          {loading && <div className="text-muted-foreground text-center py-4">Loading market data...</div>}
          {error && <div className="text-red-500 text-center py-4">{error}</div>}
          {!loading && !error && Array.isArray(stocks) && (
            <div className="space-y-3">
              {stocks.map((stock, index) => {
                const isUp = stock.change >= 0;
                return (
                  <div
                    key={stock.symbol}
                    className={`grid grid-cols-3 items-center gap-4 py-2 px-3 rounded-lg transition-colors ${
                      index % 2 === 0 ? 'bg-muted/30' : ''
                    }`}
                  >
                    <span className="font-semibold text-foreground">{stock.symbol}</span>
                    <span className="font-medium text-foreground">${stock.price.toFixed(2)}</span>
                    <span
                      className={`font-semibold flex items-center justify-end ${
                        isUp ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'
                      }`}
                    >
                      {isUp ? (
                        <span className="mr-1 text-sm">▲</span>
                      ) : (
                        <span className="mr-1 text-sm">▼</span>
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