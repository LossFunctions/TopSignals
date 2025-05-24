// File: components/CoinbaseCard.tsx

import useSWR from 'swr';

// Simple cn utility
const cn = (...classes: (string | boolean | undefined)[]) => 
  classes.filter(Boolean).join(' ');

interface RankApiResponse {
  rank: number | null;
}

const fetcher = async (url: string): Promise<{ rank: number }> => {
  console.log(`[Fetcher] Attempting to fetch from URL: ${url}`); // NEW LOG
  const response = await fetch(url);
  
  console.log(`[Fetcher] Received response from ${url}. Status: ${response.status}, OK: ${response.ok}`); // NEW LOG

  if (!response.ok) {
    let errorMessage = `[Fetcher] Failed to fetch data from ${url}. Status: ${response.status}`;
    let errorResponseBody = null;
    try {
      errorResponseBody = await response.json();
      console.error(`[Fetcher] Backend error response body for ${url}:`, errorResponseBody); // NEW LOG
      if (errorResponseBody && errorResponseBody.error) {
        errorMessage = errorResponseBody.error; 
      }
    } catch (e) {
      console.warn(`[Fetcher] Could not parse error response body as JSON for ${url}. Error:`, e); // NEW LOG
    }
    console.error(`[Fetcher] Throwing error: ${errorMessage}`); // NEW LOG
    throw new Error(errorMessage);
  }

  try {
    const data: RankApiResponse = await response.json();
    console.log(`[Fetcher] Successfully parsed JSON data from ${url}:`, data); // NEW LOG
    
    if (typeof data.rank === 'number' || data.rank === null) {
      return { rank: data.rank !== null ? data.rank : 201 };
    } else {
      console.error(`[Fetcher] Invalid data structure from ${url}. Received:`, data); // NEW LOG
      throw new Error(`Invalid data structure from backend`);
    }
  } catch (e) {
    console.error(`[Fetcher] Failed to parse successful response JSON from ${url}. Error:`, e); // NEW LOG
    throw new Error(`Failed to parse successful response`);
  }
};

// RankBadge component (No changes)
interface RankBadgeProps { rank: number; className?: string; }
function RankBadge({ rank, className }: RankBadgeProps) {
  let badgeText = ''; let badgeClass = '';
  if (rank <= 5) { badgeText = '🔥 Top 5'; badgeClass = 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30'; } 
  else if (rank <= 50) { badgeText = 'In Top 50'; badgeClass = 'bg-amber-500/20 text-amber-500 border-amber-500/30'; } 
  else { badgeText = rank > 200 ? '>100' : `>50`; if (rank >= 201) badgeText = `>100`; badgeClass = 'bg-rose-500/20 text-rose-500 border-rose-500/30'; }
  return ( <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border', badgeClass, className)}>{badgeText}</span> );
}

// CoinbaseCard component (No changes)
export function CoinbaseCard() {
  const { data, error, isLoading } = useSWR<{ rank: number }>( '/api/coinbaseRank', fetcher, { refreshInterval: 300000, revalidateOnFocus: false, shouldRetryOnError: true, errorRetryCount: 2, errorRetryInterval: 5000, } );
  const rank = data?.rank ?? 201; 
  const isLoadingState = isLoading && !data && !error;
  return (
    <div className={cn( 'w-64 p-6 rounded-xl bg-white/5 backdrop-blur-md', 'border border-white/10 transition-all duration-200 ease-out', 'hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/10', 'flex flex-col items-center justify-center', 'h-full min-h-[200px]', 'relative overflow-hidden', 'before:absolute before:inset-0 before:bg-gradient-to-br before:from-emerald-500/5 before:to-transparent before:-z-10', 'after:absolute after:inset-0 after:bg-gradient-to-tl after:from-emerald-500/5 after:to-transparent after:-z-10', 'hover:before:opacity-100 hover:after:opacity-100', 'transition-opacity duration-300' )} >
      <div className="text-center">
        <h3 className="text-sm font-medium text-gray-400 mb-1"> Coinbase Rank </h3>
        {isLoadingState ? ( <div className="h-16 flex items-center justify-center"> <div className="animate-pulse h-4 w-24 bg-gray-700 rounded"></div> </div>
        ) : error ? ( <div className="text-rose-500 text-sm px-2">Error: {error.message}</div>
        ) : ( <> <div className="flex items-baseline justify-center mb-2"> <span className="text-4xl font-bold text-white"> {rank > 200 ? ">100" : rank} </span> <RankBadge rank={rank} className="ml-2 self-center" /> </div> <p className="text-xs text-gray-400 mt-1"> iOS • Finance • US </p> </> )}
      </div>
    </div>
  );
}