// File: TOPSIGNALS/app/src/components/CoinbaseCard.tsx (or similar path)
import useSWR from 'swr';

// Simple cn utility (already present)
const cn = (...classes: (string | boolean | undefined)[]) => 
  classes.filter(Boolean).join(' ');

// Define the expected shape of the API response from /api/coinbaseRank
interface RankApiResponse {
  rank: number | null; // Rank can be null if not found in top N
}

// Updated fetcher for the new API response
const fetcher = async (url: string): Promise<{ rank: number }> => {
  const response = await fetch(url);
  if (!response.ok) {
    let errorMessage = `Failed to fetch Coinbase rank: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage; // Use error message from API if available
    } catch (e) {
      // Could not parse error JSON, stick with the status code
    }
    throw new Error(errorMessage);
  }
  const data: RankApiResponse = await response.json();
  // If rank is null (Coinbase not in top N), default to 201.
  // SWR expects the fetcher to return the data type specified in useSWR<{ rank: number }>.
  return { rank: data.rank !== null ? data.rank : 201 };
};

// RankBadge component (already present and seems fine)
interface RankBadgeProps {
  rank: number;
  className?: string;
}

function RankBadge({ rank, className }: RankBadgeProps) {
  let badgeText = '';
  let badgeClass = '';

  if (rank <= 5) {
    badgeText = '🔥 Top 5';
    badgeClass = 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30';
  } else if (rank <= 50) {
    badgeText = 'In Top 50';
    badgeClass = 'bg-amber-500/20 text-amber-500 border-amber-500/30';
  } else { // Covers rank > 50 and the default 201 if not found
    badgeText = rank > 200 ? '>100' : `>50`; // Or simply '>50' or adjust based on num
    if (rank >= 201) badgeText = `>100`; // If using num=100 and not found
    badgeClass = 'bg-rose-500/20 text-rose-500 border-rose-500/30';
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        badgeClass,
        className
      )}
    >
      {badgeText}
    </span>
  );
}

export function CoinbaseCard() {
  const { data, error, isLoading } = useSWR<{ rank: number }>( // SWR expects { rank: number }
    '/api/coinbaseRank',
    fetcher,
    { 
      refreshInterval: 300000, // 5 minutes
      revalidateOnFocus: false,
      shouldRetryOnError: true, // Be cautious with retries on 401/auth errors
      errorRetryCount: 2,     // Reduce retry count for faster feedback on persistent errors
      errorRetryInterval: 5000,
    }
  );

  // The fetcher now ensures data.rank is a number (201 if null from API)
  // So, `data?.rank` will be a number if data is available.
  // The `?? 201` handles the initial `isLoading` state where `data` is undefined.
  const rank = data?.rank ?? 201; 
  const isLoadingState = isLoading && !data && !error; // More precise loading state

  return (
    <div
      className={cn(
        'w-64 p-6 rounded-xl bg-white/5 backdrop-blur-md',
        'border border-white/10 transition-all duration-200 ease-out',
        'hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/10',
        'flex flex-col items-center justify-center',
        'h-full min-h-[200px]',
        'relative overflow-hidden',
        'before:absolute before:inset-0 before:bg-gradient-to-br before:from-emerald-500/5 before:to-transparent before:-z-10',
        'after:absolute after:inset-0 after:bg-gradient-to-tl after:from-emerald-500/5 after:to-transparent after:-z-10',
        'hover:before:opacity-100 hover:after:opacity-100',
        'transition-opacity duration-300'
      )}
    >
      <div className="text-center">
        <h3 className="text-sm font-medium text-gray-400 mb-1">
          Coinbase Rank
        </h3>
        
        {isLoadingState ? (
          <div className="h-16 flex items-center justify-center">
            <div className="animate-pulse h-4 w-24 bg-gray-700 rounded"></div>
          </div>
        ) : error ? (
          // Display the error message from the fetcher
          <div className="text-rose-500 text-sm px-2">Error: {error.message}</div>
        ) : (
          <>
            <div className="flex items-baseline justify-center mb-2">
              <span className="text-4xl font-bold text-white">
                {/* If rank is 201 (our default for not found), display appropriately */}
                {rank > 200 ? ">100" : rank}
              </span>
              <RankBadge 
                rank={rank} 
                className="ml-2 self-center" 
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              iOS • Finance • US
            </p>
          </>
        )}
      </div>
    </div>
  );
}