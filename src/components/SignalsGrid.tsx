// src/components/SignalsGrid.tsx
import { FourYearCycleCard } from './FourYearCycleCard';
import SignalCard from '@/components/SignalCard';
import { PiCycleCard } from '@/components/PiCycleCard';
import { MonthlyRsiCard } from '@/components/MonthlyRsiCard';
import { WeeklyEmaCard } from '@/components/WeeklyEmaCard';
import { useSignals } from '@/hooks/useSignals';
import { AlertTriangle } from 'lucide-react';

export function SignalsGrid() {
  const { signals, isLoading, isError } = useSignals();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="animate-pulse text-gray-400">Loading signals...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[300px] text-rose-500 space-y-2">
        <AlertTriangle className="h-8 w-8" />
        <p>Failed to load signals</p>
      </div>
    );
  }

  // Define which signals from the database to show
  const databaseSignalsToShow = ['Coinbase App Rank'];
  
  // Define custom indicator components to include
  const customIndicators = [
    { id: 'pi-cycle', component: <PiCycleCard /> },
    { id: 'monthly-rsi', component: <MonthlyRsiCard /> },
    { id: 'weekly-ema', component: <WeeklyEmaCard /> },
    { id: 'four-year-cycle', component: <FourYearCycleCard />, span: 2 },
    // Add more custom indicators here in the future:
    // { id: 'fear-greed', component: <FearGreedCard /> },
  ];

  return (
    <div 
      id="signals-grid" 
      className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8"
    >
      {/* Database-driven signals */}
      {signals
        .filter(signal => databaseSignalsToShow.includes(signal.name))
        .map((signal) => (
          <SignalCard key={signal.id} signalName={signal.name} />
        ))}
      
      {/* Custom indicator components */}
      {customIndicators.map(({ id, component, span = 1 }) => (
        <div key={id} className={span === 2 ? 'sm:col-span-2' : ''}>
          {component}
        </div>
      ))}
    </div>
  );
}