import React from 'react';
import useSWR from 'swr';
import { coinbaseRankFetcher, RankData } from '@/lib/fetchers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

export function CoinbaseCard() {
  const { data, error, isLoading } = useSWR<RankData>(
    '/api/coinbaseRank',
    coinbaseRankFetcher,
    { refreshInterval: 300000 } // Refresh every 5 minutes
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Coinbase App Rank</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-12 w-24" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Coinbase App Rank</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-red-600">
            <AlertCircle className="mr-2 h-5 w-5" />
            <span>Failed to load: {error.message}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const financeRank = data?.financeRank;
  const overallRank = data?.overallRank;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Coinbase App Rank</CardTitle>
        <CardDescription>App Store Rankings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="text-sm text-muted-foreground">Finance Category</div>
          <div className="text-2xl font-bold">
            {typeof financeRank === 'number' ? `#${financeRank}` : '—'}
          </div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Overall</div>
          <div className="text-2xl font-bold">
            {typeof overallRank === 'number' ? (
              `#${overallRank}`
            ) : (
              <div>
                <div className="text-lg">Outside Top 100</div>
                <div className="text-sm font-normal text-muted-foreground">
                  Currently outside of top 100 apps
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}