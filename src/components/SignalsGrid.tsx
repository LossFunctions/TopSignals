import SignalCard from '@/components/SignalCard';
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

  return (
    <div 
      id="signals-grid" 
      className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8"
    >
      {signals
        .filter(signal => signal.name === 'Coinbase App Rank')
        .map((signal) => (
        <SignalCard key={signal.id} signalName={signal.name} />
      ))}
    </div>
  );
}