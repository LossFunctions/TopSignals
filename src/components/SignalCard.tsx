// src/components/SignalCard.tsx

import React from 'react';
import useSWR from 'swr';
import { coinbaseRankFetcher } from '@/lib/fetchers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/neon-glass-card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, ArrowUp, ArrowDown, TrendingUp, TrendingDown } from 'lucide-react';

// Extended RankData interface with all necessary fields
export interface RankData {
  rank: number | null;
  financeRank?: number | null;
  overallRank?: number | null;
  prevFinanceRank?: number | null;
  prevOverallRank?: number | null;
  direction?: 'up' | 'down' | 'none';
  lastUpdated: string;
  cached?: boolean;
}

interface SignalCardProps {
  signalName: string;
}

const SignalCard: React.FC<SignalCardProps> = ({ signalName }) => {
  const { data, error, isLoading } = useSWR<RankData>(
    '/api/coinbaseRank',
    coinbaseRankFetcher,
    { refreshInterval: 300000 } // Refresh every 5 minutes
  );

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>{signalName}</CardTitle>
          <CardDescription>App Store Rankings</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-12 w-24" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>{signalName}</CardTitle>
          <CardDescription>App Store Rankings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-neon-red">
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
  const direction = data?.direction || 'none';

  // Helper function for overall rank change indicator (keeping original logic for overall rank)
  const renderOverallRankChange = (current: number | null | undefined, previous: number | null | undefined) => {
    if (current === null || current === undefined || previous === null || previous === undefined) return null;
    
    const change = previous - current; // Lower rank number is better
    if (change > 0) {
      return (
        <span className="text-neon-green text-xs ml-2 flex items-center">
          <TrendingUp className="h-3 w-3 mr-1" />
          {Math.abs(change)}
        </span>
      );
    } else if (change < 0) {
      return (
        <span className="text-neon-red text-xs ml-2 flex items-center">
          <TrendingDown className="h-3 w-3 mr-1" />
          {Math.abs(change)}
        </span>
      );
    }
    return null;
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>{signalName}</CardTitle>
        <CardDescription>App Store Rankings</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center space-y-4">
        <div className="flex flex-col items-center text-center">
          <div className="text-sm text-[#A1A1AA]">Finance Category</div>
          <div className="flex items-baseline justify-center mt-1">
            <div className="text-2xl font-semibold text-neon-cyan">
              {typeof financeRank === 'number' ? `#${financeRank}` : '—'}
            </div>
          </div>
          {prevFinanceRank !== null && (
            <div className="text-xs text-[#A1A1AA] mt-1">
              Previous:&nbsp;
              <span className={direction === 'up' ? 'text-neon-green' : 
                              direction === 'down' ? 'text-neon-red' : ''}>
                #{prevFinanceRank}
              </span>
              {direction === 'up' && <ArrowUp className="inline h-3 w-3 ml-1 text-neon-green" />}
              {direction === 'down' && <ArrowDown className="inline h-3 w-3 ml-1 text-neon-red" />}
            </div>
          )}
        </div>
        <div className="flex flex-col items-center text-center">
          <div className="text-sm text-[#A1A1AA]">Overall</div>
          <div className="flex items-baseline justify-center mt-1">
            {typeof overallRank === 'number' ? (
              <div className="flex items-baseline">
                <div className="text-2xl font-semibold text-neon-cyan">
                  #{overallRank}
                </div>
                {renderOverallRankChange(overallRank, prevOverallRank)}
              </div>
            ) : (
              <div className="text-center">
                <div className="text-lg font-semibold text-neon-cyan">Outside Top 100</div>
                <div className="text-xs font-normal text-[#A1A1AA] mt-0.5">
                  Currently outside of the top 100 apps overall
                </div>
              </div>
            )}
          </div>
          {prevOverallRank && typeof overallRank === 'number' && (
            <div className="text-xs text-[#A1A1AA] mt-1">
              Previous: #{prevOverallRank}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SignalCard;