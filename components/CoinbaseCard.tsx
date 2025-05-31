// components/CoinbaseCard.tsx

import React from 'react';
import useSWR from 'swr';
import { coinbaseRankFetcher, RankData } from '@/lib/fetchers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';

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
  const prevFinanceRank = data?.prevFinanceRank;
  const prevOverallRank = data?.prevOverallRank;

  // Helper function to render rank change indicator
  const renderRankChange = (current: number | null, previous: number | null | undefined) => {
    if (current === null || previous === null || previous === undefined) return null;
    
    const change = previous - current; // Lower rank number is better
    if (change > 0) {
      return (
        <span className="text-green-600 text-sm ml-2 flex items-center">
          <TrendingUp className="h-4 w-4 mr-1" />
          {Math.abs(change)}
        </span>
      );
    } else if (change < 0) {
      return (
        <span className="text-red-600 text-sm ml-2 flex items-center">
          <TrendingDown className="h-4 w-4 mr-1" />
          {Math.abs(change)}
        </span>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Coinbase App Rank</CardTitle>
        <CardDescription>App Store Rankings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center text-center">
          <div className="text-sm text-muted-foreground">Finance Category</div>
          <div className="flex items-baseline justify-center">
            <div className="text-2xl font-bold">
              {typeof financeRank === 'number' ? `#${financeRank}` : '—'}
            </div>
            {renderRankChange(financeRank, prevFinanceRank)}
          </div>
          {prevFinanceRank && (
            <div className="text-sm text-muted-foreground mt-1">
              Previous: #{prevFinanceRank}
            </div>
          )}
        </div>
        <div className="flex flex-col items-center text-center">
          <div className="text-sm text-muted-foreground">Overall</div>
          <div className="flex items-baseline justify-center">
            <div className="text-2xl font-bold">
              {typeof overallRank === 'number' ? (
                `#${overallRank}`
              ) : overallRank === '200+' || overallRank === '100+' ? (
                <div className="text-center">
                  <div className="text-lg">Outside Top {overallRank === '200+' ? '200' : '100'}</div>
                  <div className="text-sm font-normal text-muted-foreground">
                    Currently outside of the top {overallRank === '200+' ? '200' : '100'} apps overall
                  </div>
                </div>
              ) : (
                '—'
              )}
            </div>
            {typeof overallRank === 'number' && renderRankChange(overallRank, prevOverallRank)}
          </div>
          {prevOverallRank && typeof overallRank === 'number' && (
            <div className="text-sm text-muted-foreground mt-1">
              Previous: #{prevOverallRank}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}