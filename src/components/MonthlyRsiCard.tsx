// src/components/MonthlyRsiCard.tsx
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, TrendingUp, Info } from 'lucide-react';
import { useBTCIndicators } from '@/hooks/useBTCIndicators';

export function MonthlyRsiCard() {
  const { data, error, isLoading } = useBTCIndicators();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly RSI</CardTitle>
          <CardDescription>Bitcoin 14-period RSI on monthly candles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-48"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly RSI</CardTitle>
          <CardDescription>Bitcoin 14-period RSI on monthly candles</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load RSI data: {error.message}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const rsiValue = data?.monthlyRsi;
  const isDanger = data?.rsiDanger || false;
  const lastUpdated = data?.lastUpdated ? new Date(data.lastUpdated) : null;
  const hasRsiError = data?.errors?.rsi;

  // Show temporary unavailable state if RSI specifically failed but other data loaded
  if (hasRsiError && data) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Monthly RSI
              </CardTitle>
              <CardDescription>Bitcoin 14-period RSI on monthly candles</CardDescription>
            </div>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-muted-foreground">--</span>
              <Badge variant="secondary">Temporarily Unavailable</Badge>
            </div>
            
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                RSI data is temporarily unavailable. Please check back later.
              </p>
            </div>
            
            {lastUpdated && (
              <p className="text-xs text-muted-foreground">
                Last attempt: {lastUpdated.toLocaleString()}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Normal case - RSI data is available
  return (
    <Card className={isDanger ? 'border-red-500' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Monthly RSI
              {isDanger && <AlertCircle className="h-5 w-5 text-red-500" />}
            </CardTitle>
            <CardDescription>Bitcoin 14-period RSI on monthly candles</CardDescription>
          </div>
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* RSI Value Display */}
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">
              {rsiValue !== null ? rsiValue.toFixed(2) : 'N/A'}
            </span>
            <Badge variant={isDanger ? 'destructive' : 'secondary'}>
              {isDanger ? 'Danger Zone' : 'Normal'}
            </Badge>
          </div>

          {/* Danger Alert */}
          {isDanger && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                RSI above 80 - Historical cycle top danger zone
              </AlertDescription>
            </Alert>
          )}

          {/* Info Box */}
          <div className="bg-muted p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                RSI ≥ 80 has historically coincided with Bitcoin market cycle tops. 
                This is a warning signal, not a guarantee of an immediate reversal.
              </p>
            </div>
          </div>

          {/* Last Updated */}
          {lastUpdated && (
            <p className="text-xs text-muted-foreground">
              Last updated: {lastUpdated.toLocaleString()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}