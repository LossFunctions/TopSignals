import React from 'react';
import useSWR from 'swr';
import { coinbaseRankFetcher, RankData } from '@/lib/fetchers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

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
      <Card>
        <CardHeader>
          <CardTitle>{signalName}</CardTitle>
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
          <CardTitle>{signalName}</CardTitle>
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

  const financeRank = data?.financeRank ?? 999;
  const overallRank = data?.overallRank ?? 999;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{signalName}</CardTitle>
        <CardDescription>App Store Rankings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="text-sm text-muted-foreground">Finance Category</div>
          <div className="text-2xl font-bold">#{financeRank}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Overall</div>
          <div className="text-2xl font-bold">#{overallRank}</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SignalCard;card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

interface SignalCardProps {
  signalName: string;
}

const SignalCard: React.FC<SignalCardProps> = ({ signalName }) => {
  const { data, error, isLoading } = useSWR<{ rank: number }>(
    '/api/coinbaseRank',
    coinbaseRankFetcher,
    { refreshInterval: 300000 } // Refresh every 5 minutes
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{signalName}</CardTitle>
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
          <CardTitle>{signalName}</CardTitle>
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

  const rank = data?.rank ?? 201;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{signalName}</CardTitle>
        <CardDescription>App Store Finance Category</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          #{rank}
          {rank > 200 && <span className="text-sm text-muted-foreground ml-2">(Not in top 200)</span>}
        </div>
      </CardContent>
    </Card>
  );
};

export default SignalCard;