// src/components/PiCycleCard.tsx
import { usePiCycle } from '@/hooks/usePiCycle';
import { Card, CardContent } from '@/components/ui/neon-glass-card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, TrendingUp } from 'lucide-react';
import SignalCard from '@/components/SignalCard';

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
      <Card className="h-full">
        <SignalCard.Header 
          title="Pi-Cycle Top"
          align="center"
        />
        <CardContent>
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full">
        <SignalCard.Header 
          title="Pi-Cycle Top"
          align="center"
        />
        <CardContent>
          <div className="flex items-center text-neon-red">
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
    if (crossed) return 'text-neon-green';
    if (distancePct > -10 && distancePct <= 0) return 'text-neon-orange';
    return 'text-[#A1A1AA]';
  };

  const getStatusMessage = () => {
    if (crossed) {
      return (
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-neon-green/10 text-neon-green rounded-full text-sm font-medium">
            ✅ Triggered
          </span>
          <span className="text-sm text-[#A1A1AA]">{timeAgo}</span>
        </div>
      );
    }
    
    const percentageText = Math.abs(distancePct).toFixed(1);
    return (
      <div className={`flex items-center gap-2 ${getStatusColor()}`}>
        <span className={`px-3 py-1 ${distancePct > -10 ? 'bg-neon-orange/10' : 'bg-white/5'} rounded-full text-sm font-medium`}>
          Still {percentageText}% below trigger
        </span>
      </div>
    );
  };

  return (
    <Card className="h-full flex flex-col">
      <SignalCard.Header 
        title="Pi-Cycle Top"
        subtitle="Bitcoin Market Cycle Indicator"
        align="center"
      />
      <CardContent className="flex-1 flex flex-col justify-center space-y-4">
        <div className="text-lg font-semibold">
          {getStatusMessage()}
        </div>
        
        <div className="space-y-2 text-sm text-[#A1A1AA]">
          <div className="flex justify-between">
            <span>111-day SMA:</span>
            <span className="font-mono text-[#F5F5F7]">{formatNumber(sma111)}</span>
          </div>
          <div className="flex justify-between">
            <span>350-day SMA × 2:</span>
            <span className="font-mono text-[#F5F5F7]">{formatNumber(sma350x2)}</span>
          </div>
        </div>
        
        {crossed && (
          <div className="flex items-center gap-1 text-xs text-neon-green mt-2">
            <TrendingUp className="w-4 h-4" />
            <span>Historically indicates market cycle top</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PiCycleCard;