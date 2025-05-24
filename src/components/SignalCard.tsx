import { useEffect, useState } from 'react';
import useSWR from 'swr';

// Define a type for the app objects we expect from SearchApi.io top_charts
interface SearchApiChartApp {
  position: number;
  title: string;
  bundle_id: string; // Key for identifying Coinbase
  id?: string | number; // Optional, for logging if available
  // Add other potentially useful fields if needed for logging/debugging
  link?: string;
  developer?: {
    name?: string;
  };
}

const fetchFinanceData = async (apiUrl: string): Promise<number | string> => {
  console.log(`Attempting to fetch from SearchApi.io proxy ${apiUrl}`);
  const response = await fetch(apiUrl);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      `Failed to fetch from SearchApi.io proxy ${apiUrl}: ${response.status} ${response.statusText}`,
      errorText
    );
    throw new Error(`Failed to fetch finance rank from SearchApi.io: ${response.status}`);
  }
  const data = await response.json();

  if (data.error) {
    console.error(`SearchApi.io returned an error for ${apiUrl}:`, data.error);
    throw new Error(`SearchApi.io error: ${data.error}`);
  }

  console.log(
    `SearchApi.io response from ${apiUrl}:`,
    JSON.parse(JSON.stringify(data)) // Deep copy for logging
  );

  if (!data.top_charts || !Array.isArray(data.top_charts)) {
    console.warn('SearchApi.io response did not contain valid top_charts array.');
    throw new Error('Invalid data structure from SearchApi.io (top_charts missing or not an array)');
  }

  const apps: SearchApiChartApp[] = data.top_charts;

  if (apps.length > 0) {
    const top5Log = apps
      .slice(0, 5)
      .map((app: SearchApiChartApp) => `${app.position}. ${app.title} (Bundle: ${app.bundle_id})`);
    console.log('First 5 apps from SearchApi.io (Top Charts - Finance):', top5Log);
  }

  const targetBundleId = 'com.coinbase.Coinbase';
  const coinbaseApp = apps.find((app: SearchApiChartApp) => app.bundle_id === targetBundleId);

  if (coinbaseApp) {
    console.log(
      `Coinbase found by Bundle ID (${targetBundleId}): Position ${coinbaseApp.position}, Title: ${coinbaseApp.title}, Bundle: ${coinbaseApp.bundle_id}`
    );
    return coinbaseApp.position; // Return the rank
  } else {
    console.warn(`Coinbase app (Bundle ID: ${targetBundleId}) not found in SearchApi.io top_charts results.`);
    // Log any app that contains 'coinbase' in title for debugging if the target isn't found
    const anyCoinbase = apps.filter((app: SearchApiChartApp) => app.title?.toLowerCase().includes('coinbase'));
    if (anyCoinbase.length > 0) {
      console.log('Other Coinbase-related apps found in chart (for debugging):', JSON.stringify(anyCoinbase, null, 2));
    }
    return '>200'; // Return '>200' if not found
  }
};

interface SignalCardProps {
  signalName: string;
}

const SignalCard: React.FC<SignalCardProps> = ({ signalName }) => {
  const [financeRank, setFinanceRank] = useState<number | string | null>(null);

  const { data: fetchedRank, error: swrError, isLoading: swrIsLoading } = useSWR<number | string>(
    signalName === 'Coinbase App Rank' ? '/api/coinbaseRank' : null,
    fetchFinanceData,
    {
      shouldRetryOnError: false,
    }
  );

  useEffect(() => {
    if (fetchedRank !== undefined) {
      setFinanceRank(fetchedRank);
    }
  }, [fetchedRank]);

  const isLoading = swrIsLoading;
  const error = swrError;

  if (signalName !== 'Coinbase App Rank') {
    return null;
  }

  if (isLoading) {
    return (
      <div className="bg-white shadow-lg rounded-lg p-6 m-4 w-full md:w-1/2 lg:w-1/3">
        <h2 className="text-xl font-semibold mb-2">{signalName}</h2>
        <p className="text-center p-4">Loading finance rank...</p>
      </div>
    );
  }

  if (error) {
    console.error('Error displaying finance rank (SWR):', error);
    return (
      <div className="bg-white shadow-lg rounded-lg p-6 m-4 w-full md:w-1/2 lg:w-1/3">
        <h2 className="text-xl font-semibold mb-2">{signalName}</h2>
        <p className="text-center p-4 text-red-500">Error: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 m-4 w-full md:w-1/2 lg:w-1/3">
      <h2 className="text-xl font-semibold mb-2">{signalName}</h2>
      {financeRank !== null ? (
        <p className="text-3xl font-bold text-blue-600">
          {typeof financeRank === 'number' ? `#${financeRank}` : financeRank}
          <span className="text-sm text-gray-500 ml-2">in Finance Category (US App Store)</span>
        </p>
      ) : (
        <p className="text-gray-500">Rank data not available.</p>
      )}
      <p className="text-xs text-gray-400 mt-4">Source: SearchApi.io (Apple Top Charts)</p>
    </div>
  );
};

export default SignalCard;