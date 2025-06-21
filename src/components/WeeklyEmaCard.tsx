// src/components/WeeklyEmaCard.tsx
import { Card, CardContent } from '@/components/ui/neon-glass-card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Info } from 'lucide-react';
import { useBTCIndicators } from '@/hooks/useBTCIndicators';
import SignalCard from '@/components/SignalCard';

export function WeeklyEmaCard() {
  const { data, error, isLoading } = useBTCIndicators();

  if (isLoading) {
    return (
      <Card className="h-full">
        <SignalCard.Header 
          title="Weekly EMA Breaks"
          subtitle="BTC vs 50 & 200 week exponential moving averages"
          align="center"
        />
        <CardContent>
          <div className="animate-pulse">
            <div className="h-8 bg-white/10 rounded w-full mb-2"></div>
            <div className="h-8 bg-white/10 rounded w-full mb-2"></div>
            <div className="h-4 bg-white/10 rounded w-48"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full">
        <SignalCard.Header 
          title="Weekly EMA Breaks"
          subtitle="BTC vs 50 & 200 week exponential moving averages"
          align="center"
        />
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to load EMA data: {error.message}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const currentPrice = data?.currentPrice;
  const ema50 = data?.weeklyEma50;
  const ema200 = data?.weeklyEma200;
  const breakEma50 = data?.breakEma50;
  const breakEma200 = data?.breakEma200;
  const lastUpdated = data?.lastUpdated ? new Date(data.lastUpdated) : null;

  const hasBreak = breakEma50 || breakEma200;

  return (
    <Card className={`h-full flex flex-col ${hasBreak ? 'border-neon-orange' : ''}`}>
      <SignalCard.Header 
        title={
          <div className="flex items-center gap-2">
            Weekly EMA Breaks
            {hasBreak && <AlertTriangle className="h-5 w-5 text-neon-orange" />}
          </div>
        }
        subtitle="BTC vs 50 & 200 week exponential moving averages"
        align="center"
      />
      <CardContent className="flex-1 flex flex-col">
        <div className="space-y-4">
          {/* Current Price */}
          {currentPrice != null && (
            <div className="pb-2 border-b border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#A1A1AA]">Current BTC Price</span>
                <span className="font-mono font-semibold text-[#F5F5F7]">
                  ${currentPrice != null ? currentPrice.toLocaleString(undefined, { maximumFractionDigits: 0 }) : 'N/A'}
                </span>
              </div>
            </div>
          )}

          {/* EMA 50 Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[#F5F5F7]">50 Week EMA</span>
              {breakEma50 !== null && (
                <Badge variant={breakEma50 ? 'destructive' : 'default'} className="text-xs">
                  {breakEma50 ? 'Below' : 'Above'}
                </Badge>
              )}
            </div>
            <span className="text-sm text-[#A1A1AA] font-mono">
              ${ema50 != null ? ema50.toLocaleString(undefined, { maximumFractionDigits: 0 }) : 'N/A'}
            </span>
          </div>

          {/* EMA 200 Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[#F5F5F7]">200 Week EMA</span>
              {breakEma200 !== null && (
                <Badge variant={breakEma200 ? 'destructive' : 'default'} className="text-xs">
                  {breakEma200 ? 'Below' : 'Above'}
                </Badge>
              )}
            </div>
            <span className="text-sm text-[#A1A1AA] font-mono">
              ${ema200 != null ? ema200.toLocaleString(undefined, { maximumFractionDigits: 0 }) : 'N/A'}
            </span>
          </div>

          {/* Info Box */}
          <div className="bg-white/5 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 mt-0.5 text-[#A1A1AA]" />
              <p className="text-sm text-[#A1A1AA]">
                Breaking below key EMAs can signal bearish market structure. The 200-week EMA 
                has historically acted as strong support during bull markets.
              </p>
            </div>
          </div>

          {/* Break Alert - Moved inside the main space-y-4 div */}
          {hasBreak && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                BTC has broken below the {breakEma50 && breakEma200 ? '50 & 200' : breakEma50 ? '50' : '200'} week EMA
              </AlertDescription>
            </Alert>
          )}

          {/* Last Updated */}
          {lastUpdated && (
            <p className="text-xs text-[#A1A1AA] mt-auto pt-2">
              Last updated: {lastUpdated.toLocaleString()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default WeeklyEmaCard;