// src/components/PiCycleCard.tsx
import { usePiCycle } from '@/hooks/usePiCycle';
import { Card, CardContent } from '@/components/ui/neon-glass-card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, TrendingUp, Info } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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

        {/* Info Box */}
        <div className="bg-white/5 p-3 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 text-[#A1A1AA]" />
            <p className="text-sm text-[#A1A1AA]">
              The Pi-Cycle Top fires when the 111-day MA crosses above the
              350-day MA × 2. It has called the 2013, 2017 and 2021 peaks
              within days.
            </p>
          </div>
        </div>

        {/* Historical signals */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="history">
            <AccordionTrigger className="text-sm font-medium">
              Past Cycle Signals
            </AccordionTrigger>
            <AccordionContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-2 font-medium text-[#F5F5F7]">
                        Cycle
                      </th>
                      <th className="text-left py-2 font-medium text-[#F5F5F7]">
                        Signal Price
                      </th>
                      <th className="text-left py-2 font-medium text-[#F5F5F7]">
                        Peak Price (Days)
                      </th>
                      <th className="text-left py-2 font-medium text-[#F5F5F7]">
                        Drop After
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-white/10">
                      <td className="py-2 text-[#A1A1AA]">2013</td>
                      <td className="py-2 text-[#A1A1AA]">$142</td>
                      <td className="py-2 text-[#A1A1AA]">$230 (4d)</td>
                      <td className="py-2 text-[#A1A1AA]">-65%</td>
                    </tr>
                    <tr className="border-b border-white/10">
                      <td className="py-2 text-[#A1A1AA]">2017</td>
                      <td className="py-2 text-[#A1A1AA]">$16,341</td>
                      <td className="py-2 text-[#A1A1AA]">$19,927 (3d)</td>
                      <td className="py-2 text-[#A1A1AA]">-84%</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-[#A1A1AA]">2021</td>
                      <td className="py-2 text-[#A1A1AA]">$58,931</td>
                      <td className="py-2 text-[#A1A1AA]">$64,816 (11d)</td>
                      <td className="py-2 text-[#A1A1AA]">-53%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}

export default PiCycleCard;
