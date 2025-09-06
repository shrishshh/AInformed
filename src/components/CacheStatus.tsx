'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Trash2, Database, HardDrive } from 'lucide-react';

interface CacheStats {
  memory: {
    size: number;
    keys: string[];
    hitRate: number;
  };
  database: {
    totalCaches: number;
    validCaches: number;
    expiredCaches: number;
  };
  timestamp: string;
}

export default function CacheStatus() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchCacheStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/cache');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
        setLastRefresh(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch cache stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearCache = async (pattern: string = 'all') => {
    try {
      const response = await fetch(`/api/cache?pattern=${pattern}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        // Refresh stats after clearing
        await fetchCacheStats();
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="p-4 border rounded-lg bg-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Database className="h-5 w-5" />
          Cache Status
        </h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCacheStats}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => clearCache()}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Clear All
          </Button>
        </div>
      </div>

      {stats && (
        <div className="space-y-4">
          {/* Memory Cache */}
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-blue-500" />
            <span className="font-medium">Memory Cache:</span>
            <Badge variant="secondary">{stats.memory.size} items</Badge>
            {stats.memory.keys.length > 0 && (
              <span className="text-sm text-muted-foreground">
                (Keys: {stats.memory.keys.slice(0, 3).join(', ')}...)
              </span>
            )}
          </div>

          {/* Database Cache */}
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-green-500" />
            <span className="font-medium">Database Cache:</span>
            <Badge variant="outline">{stats.database.validCaches} valid</Badge>
            <Badge variant="secondary">{stats.database.expiredCaches} expired</Badge>
            <Badge variant="default">{stats.database.totalCaches} total</Badge>
          </div>

          {/* Last Updated */}
          <div className="text-sm text-muted-foreground">
            Last updated: {formatTimeAgo(stats.timestamp)}
          </div>

          {/* Cache Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => clearCache('news')}
              className="text-xs"
            >
              Clear News Cache
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => clearCache('rss')}
              className="text-xs"
            >
              Clear RSS Cache
            </Button>
          </div>
        </div>
      )}

      {lastRefresh && (
        <div className="mt-4 text-xs text-muted-foreground">
          Last refresh: {formatTimeAgo(lastRefresh.toISOString())}
        </div>
      )}

      {!stats && !loading && (
        <div className="text-center text-muted-foreground py-4">
          Click "Refresh" to view cache statistics
        </div>
      )}
    </div>
  );
}

