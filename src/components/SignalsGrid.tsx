// src/components/SignalsGrid.tsx
import FourYearCycleCard from './FourYearCycleCard';
import SignalCard from '@/components/SignalCard';
import PiCycleCard from '@/components/PiCycleCard';
import MonthlyRsiCard from '@/components/MonthlyRsiCard';
import WeeklyEmaCard from '@/components/WeeklyEmaCard';
import { DebugPanel } from '@/components/DebugPanel';
import { useSignals } from '@/hooks/useSignals';
import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function SignalsGrid() {
  const { signals, isLoading, isError } = useSignals();
  const [showDebug, setShowDebug] = useState(false);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="animate-pulse text-gray-400">Loading signals...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-center items-center min-h-[300px] text-rose-500 space-y-4">
          <AlertTriangle className="h-8 w-8" />
          <p>Failed to load signals</p>
          <Button 
            onClick={() => setShowDebug(!showDebug)}
            variant="outline"
            size="sm"
          >
            {showDebug ? 'Hide' : 'Show'} Debug Info
          </Button>
        </div>
        
        {showDebug && <DebugPanel />}
      </div>
    );
  }

  // Define which signals from the database to show
  const databaseSignalsToShow = ['Coinbase App Rank'];
  
  // Define custom indicator components to include
  const customIndicators = [
    { id: 'pi-cycle', component: <PiCycleCard />, row: 1 },
    { id: 'monthly-rsi', component: <MonthlyRsiCard />, row: 2 },
    { id: 'weekly-ema', component: <WeeklyEmaCard />, row: 2 },
    { id: 'four-year-cycle', component: <FourYearCycleCard />, span: 'full' },
  ];

  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Debug toggle for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="flex justify-center">
          <Button 
            onClick={() => setShowDebug(!showDebug)}
            variant="outline"
            size="sm"
          >
            {showDebug ? 'Hide' : 'Show'} Debug Panel
          </Button>
        </div>
      )}
      
      {showDebug && <DebugPanel />}
      
      {/* First row - Equal height cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6" style={{ gridAutoRows: '1fr' }}>
        {/* Database-driven signals */}
        {signals
          .filter(signal => databaseSignalsToShow.includes(signal.name))
          .map((signal) => (
            <SignalCard key={signal.id} signalName={signal.name} />
          ))}
        
        {/* Pi-Cycle card */}
        {customIndicators
          .filter(({ row }) => row === 1)
          .map(({ id, component }) => (
            <div key={id}>
              {component}
            </div>
          ))}
      </div>
      
      {/* Second row - Equal height cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6" style={{ gridAutoRows: '1fr' }}>
        {customIndicators
          .filter(({ row }) => row === 2)
          .map(({ id, component }) => (
            <div key={id}>
              {component}
            </div>
          ))}
      </div>
      
      {/* Full width cards */}
      {customIndicators
        .filter(({ span }) => span === 'full')
        .map(({ id, component }) => (
          <div key={id}>
            {component}
          </div>
        ))}
    </div>
  );
}

// Add default export as well
export default SignalsGrid;