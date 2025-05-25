import React from 'react';
import { usePiCycle } from '@/hooks/usePiCycle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, TrendingUp, Activity } from 'lucide-react';

// Helper function to format time ago
function getTimeAgo(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  
  if (diffHours < 1) {
    return 'just now';
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }
}

// Helper function to format large numbers
function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function PiCycleCard() {
  const { data, error, isLoading } = usePiCycle();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Pi-Cycle Top
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Pi-Cycle Top
          </CardTitle>
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

  if (!data) {
    return null;
  }

  const { crossed, distancePct, sma111, sma350x2, time } = data;
  const timeAgo = getTimeAgo(time);
  
  // Determine status color and message
  const getStatusColor = () => {
    if (crossed) return 'text-green-600';
    if (distancePct > -10 && distancePct <= 0) return 'text-orange-600';
    return 'text-gray-600';
  };

  const getStatusMessage = () => {
    if (crossed) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-green-600">✅ Triggered</span>
          <span className="text-sm text-gray-500">{timeAgo}</span>
        </div>
      );
    }
    
    const percentageText = Math.abs(distancePct).toFixed(1);
    return (
      <div className={getStatusColor()}>
        Still {percentageText}% below trigger
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Pi-Cycle Top
        </CardTitle>
        <CardDescription>Bitcoin Market Cycle Indicator</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-lg font-semibold">
          {getStatusMessage()}
        </div>
        
        <div className="space-y-1 text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>111-day SMA:</span>
            <span className="font-mono">{formatNumber(sma111)}</span>
          </div>
          <div className="flex justify-between">
            <span>350-day SMA × 2:</span>
            <span className="font-mono">{formatNumber(sma350x2)}</span>
          </div>
        </div>
        
        {crossed && (
          <div className="flex items-center gap-1 text-xs text-green-600">
            <TrendingUp className="w-4 h-4" />
            <span>Historically indicates market cycle top</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}