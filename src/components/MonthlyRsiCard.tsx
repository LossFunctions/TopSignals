// src/components/MonthlyRsiCard.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertCircle, TrendingUp, Info } from 'lucide-react';
import { useBTCIndicators, MonthlyRsiData } from '@/hooks/useBTCIndicators';
import { format, differenceInDays, parseISO } from 'date-fns';
import { useState, useEffect } from 'react';

export function MonthlyRsiCard() {
  const { data, error, isLoading } = useBTCIndicators();
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on a mobile device
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

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
  
  // New data for cycle peaks
  const cycleHigh = data?.cycleHigh;
  const cycleHighIsCurrentMonth = data?.cycleHighIsCurrentMonth || false;
  const historicalCycleHighs = data?.historicalCycleHighs || [];
  const status = data?.status || 'Normal';

  // Calculate if current RSI is close to cycle high (within 5 points)
  const isCloseToHigh = cycleHigh && rsiValue && (cycleHigh.value - rsiValue <= 5);
  
  // Check if current RSI equals cycle high (rounded to 0.1)
  const isAtCycleHigh = cycleHigh && rsiValue && 
    (Math.abs(cycleHigh.value - rsiValue) < 0.1);

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
              {rsiValue != null ? rsiValue.toFixed(2) : 'N/A'}
            </span>
            <Badge variant={status === 'Extreme' ? 'destructive' : status === 'Warning' ? 'outline' : 'secondary'}>
              {status}
            </Badge>
          </div>

          {/* Cycle-high row */}
          {cycleHigh && (
            <div className="mt-2 flex items-center text-sm text-zinc-400">
              <span className="mr-1">Cycle high:</span> 
              <Badge>
                {cycleHigh.value.toFixed(2)}
              </Badge> 
              <span className="ml-1 text-zinc-500">
                ({format(parseISO(cycleHigh.date), 'MMM yyyy')})
              </span> 
              {cycleHighIsCurrentMonth && (
                <Badge className="ml-2 bg-lime-500/10 text-lime-400">
                  NEW
                </Badge>
              )}
            </div>
          )}

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
                Monthly RSI ≥ 80 has historically occurred near Bitcoin market-cycle tops:&nbsp;
                {historicalCycleHighs.length > 0 ? (
                  <>
                    {historicalCycleHighs.map((peak, i) => (
                      <span key={peak.cycle}>
                        {Math.round(peak.value)} ({peak.cycle})
                        {i < historicalCycleHighs.length - 1 ? ', ' : '.'}
                      </span>
                    ))}
                  </> 
                ) : '91 (2013), 90 (2017), 88 (2021).'}
                {cycleHigh && (
                  isAtCycleHigh
                    ? ` We are at the highest RSI of the cycle (${cycleHigh.value.toFixed(1)}).`
                    : ` Current cycle high is ${cycleHigh.value.toFixed(1)}.`
                )} This is a warning signal, not a guarantee of reversal.
              </p>
            </div>
          </div>

          {/* Mobile Summary (when accordion is hidden) */}
          {isMobile && historicalCycleHighs.length > 0 && (
            <div className="text-sm text-muted-foreground mt-2">
              Past-cycle RSI peaks: {historicalCycleHighs.map(peak => Math.round(peak.value)).join(', ')}
            </div>
          )}

          {/* Historical Peaks Accordion (desktop only) */}
          {!isMobile && historicalCycleHighs.length > 0 && (
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="historical-peaks">
                <AccordionTrigger className="text-sm font-medium">
                  Historical Peaks
                </AccordionTrigger>
                <AccordionContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-muted">
                          <th className="text-left py-2 font-medium">Cycle</th>
                          <th className="text-left py-2 font-medium">Peak RSI</th>
                          <th className="text-left py-2 font-medium">Month</th>
                          <th className="text-left py-2 font-medium">Days from Peak→Bottom</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historicalCycleHighs.map((peak, index) => {
                          // Find the next bottom date after this peak
                          const cycleBottoms = [
                            { cycle: '2013', date: '2015-01-14' },
                            { cycle: '2017', date: '2018-12-15' },
                            { cycle: '2021', date: '2022-11-09' }
                          ];
                          
                          const bottomDate = cycleBottoms.find(b => b.cycle === peak.cycle)?.date;
                          const daysToBottom = bottomDate ? 
                            differenceInDays(new Date(bottomDate), new Date(peak.date)) : null;
                          
                          return (
                            <tr key={peak.cycle} className="border-b border-muted">
                              <td className="py-2">{peak.cycle}</td>
                              <td className="py-2">{peak.value.toFixed(1)}</td>
                              <td className="py-2">{format(parseISO(peak.date), 'MMM-yyyy')}</td>
                              <td className="py-2">{daysToBottom || '—'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}

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
