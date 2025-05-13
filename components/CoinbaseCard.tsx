import useSWR from 'swr';

interface AppInfo {
  id: string;
  name: string;
  // Add other properties as needed
}

interface FeedResponse {
  feed: {
    results: AppInfo[];
  };
}

// Simple cn utility since @/lib/utils isn't available
const cn = (...classes: (string | boolean | undefined)[]) => 
  classes.filter(Boolean).join(' ');

const COINBASE_APP_ID = '886427730';

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch Coinbase rank');
  }
  const data = await response.json();
  const responseData = data as FeedResponse;
  const coinbaseApp = responseData.feed.results.find(
    (app) => app.id === COINBASE_APP_ID
  );
  return {
    rank: coinbaseApp ? responseData.feed.results.indexOf(coinbaseApp) + 1 : 201
  };
};

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
  } else {
    badgeText = '>50';
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
  const { data, error, isLoading } = useSWR<{ rank: number }>(
    '/api/coinbaseRank',
    fetcher,
    { 
      refreshInterval: 300000, // 5 minutes
      revalidateOnFocus: false,
      shouldRetryOnError: true,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    }
  );

  const rank = data?.rank ?? 201; // Default to 201 if not found
  const isLoadingState = isLoading || !data;

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
          <div className="text-rose-500 text-sm">Error loading rank</div>
        ) : (
          <>
            <div className="flex items-baseline justify-center mb-2">
              <span className="text-4xl font-bold text-white">
                {rank}
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
