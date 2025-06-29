import useSWR from 'swr';
import { Signal, mockSignals, supabase } from '@/lib/supabaseClient';

const fetcher = async (): Promise<Signal[]> => {
  if (!supabase) {
    console.warn('Supabase client is null, using mock data.');
    return mockSignals;
  }

  try {
    const { data, error } = await supabase
      .from('signals')
      .select('*')
      .order('ts', { ascending: false });

    if (error) {
      console.error('Error fetching signals:', error);
      return mockSignals; // Fallback to mock data
    }

    return data || mockSignals;
  } catch (err) {
    console.error('Failed to fetch signals:', err);
    return mockSignals; // Fallback to mock data
  }
};

export function useSignals() {
  const { data, error, isLoading, mutate } = useSWR<Signal[]>(
    'signals',
    fetcher,
    {
      refreshInterval: 300000, // Refresh every 5 minutes
      revalidateOnFocus: false,
    }
  );

  return {
    signals: data || mockSignals,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}