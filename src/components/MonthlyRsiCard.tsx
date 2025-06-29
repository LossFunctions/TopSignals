// src/components/MonthlyRsiCard.tsx
import { Card, CardContent } from '@/components/ui/neon-glass-card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AlertCircle, Info } from 'lucide-react';
import { useBTCIndicators } from '@/hooks/useBTCIndicators';
import { format, differenceInDays, parseISO } from 'date-fns';
import { useState, useEffect } from 'react';
import SignalCard from '@/components/SignalCard';

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
      <Card className="h-full">
        <SignalCard.Header 
          title="Monthly RSI"
          subtitle="Bitcoin 14-period RSI on monthly candles"
          align="center"
        />
        <CardContent>
          <div className="animate-pulse">
            <div className="h-8 bg-white/10 rounded w-32 mb-2"></div>
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
          title="Monthly RSI"
          subtitle="Bitcoin 14-period RSI on monthly candles"
          align="center"
        />
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
  
  // Check if current RSI equals cycle high (rounded to 0.1)
  const isAtCycleHigh = cycleHigh && rsiValue && 
    (Math.abs(cycleHigh.value - rsiValue) < 0.1);

  // Show temporary unavailable state if RSI specifically failed but other data loaded
  if (hasRsiError && data) {
    return (
      <Card className="h-full">
        <SignalCard.Header 
          title="Monthly RSI"
          subtitle="Bitcoin 14-period RSI on monthly candles"
          align="center"
        />
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-[#A1A1AA]">--</span>
              <Badge variant="secondary">Temporarily Unavailable</Badge>
            </div>
            
            <div className="bg-white/5 p-3 rounded-lg">
              <p className="text-sm text-[#A1A1AA]">
                RSI data is temporarily unavailable. Please check back later.
              </p>
            </div>
            
            {lastUpdated && (
              <p className="text-xs text-[#A1A1AA]">
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
    <Card className={`h-full flex flex-col ${isDanger ? 'border-neon-red' : ''}`}>
      <SignalCard.Header 
        title={
          <div className="flex items-center gap-2">
            Monthly RSI
            {isDanger && <AlertCircle className="h-5 w-5 text-neon-red" />}
          </div>
        }
        subtitle="Bitcoin 14-period RSI on monthly candles"
        align="center"
      />
      <CardContent className="flex-1 flex flex-col">
        <div className="space-y-4">
          {/* RSI Value Display */}
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-[#F5F5F7]">
              {rsiValue != null ? rsiValue.toFixed(2) : 'N/A'}
            </span>
            <Badge variant={status === 'Extreme' ? 'destructive' : status === 'Warning' ? 'outline' : 'secondary'}>
              {status}
            </Badge>
          </div>

          {/* Cycle-high row */}
          {cycleHigh && (
            <div className="flex items-center text-sm text-[#A1A1AA]">
              <span className="mr-1">Cycle high:</span> 
              <Badge>
                {cycleHigh.value.toFixed(2)}
              </Badge> 
              <span className="ml-1 text-[#71717A]">
                ({format(parseISO(cycleHigh.date), 'MMM yyyy')})
              </span> 
              {cycleHighIsCurrentMonth && (
                <Badge className="ml-2 bg-neon-green/10 text-neon-green">
                  NEW
                </Badge>
              )}
            </div>
          )}

          {/* Info Box */}
          <div className="bg-white/5 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 mt-0.5 text-[#A1A1AA]" />
              <p className="text-sm text-[#A1A1AA]">
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
            <div className="text-sm text-[#A1A1AA] mt-2">
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
                        <tr className="border-b border-white/10">
                          <th className="text-left py-2 font-medium text-[#F5F5F7]">Cycle</th>
                          <th className="text-left py-2 font-medium text-[#F5F5F7]">Peak RSI</th>
                          <th className="text-left py-2 font-medium text-[#F5F5F7]">Month</th>
                          <th className="text-left py-2 font-medium text-[#F5F5F7]">Days from Peak→Bottom</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historicalCycleHighs.map((peak, _index) => {
                          // Find the next bottom date after this peak
                          const cycleBottoms = [
                            { cycle: '2013', date: '2015-01-14' },
                            { cycle: '2017', date: '2018-12-15' },
                            { cycle: '2021', date: '2022-11-21' }
                          ];
                          
                          const bottomDate = cycleBottoms.find(b => b.cycle === peak.cycle)?.date;
                          const daysToBottom = bottomDate ? 
                            differenceInDays(new Date(bottomDate), new Date(peak.date)) : null;
                          
                          return (
                            <tr key={peak.cycle} className="border-b border-white/10">
                              <td className="py-2 text-[#A1A1AA]">{peak.cycle}</td>
                              <td className="py-2 text-[#A1A1AA]">{peak.value.toFixed(1)}</td>
                              <td className="py-2 text-[#A1A1AA]">{format(parseISO(peak.date), 'MMM-yyyy')}</td>
                              <td className="py-2 text-[#A1A1AA]">{daysToBottom || '—'}</td>
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

          {/* Danger Alert - Moved inside the main space-y-4 div */}
          {isDanger && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                RSI above 80 - Historical cycle top danger zone
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

export default MonthlyRsiCard;