import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client with environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create client if environment variables are available, otherwise null
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Warn if Supabase client is not initialized
if (!supabase) {
  console.warn(
    'Supabase client not initialized. Missing environment variables. Running in mock data mode.'
  );
}

export type Signal = {
  id: number;
  name: string;
  value: number;
  previous_value?: number;
  ts: string;
  description?: string;
  // For Coinbase App Rank
  finance_rank?: number;
  previous_finance_rank?: number;
};

// Mock data for development (until Supabase is connected)
export const mockSignals: Signal[] = [
  {
    id: 1,
    name: 'Coinbase App Rank',
    value: 4, // Overall rank
    previous_value: 7, // Previous overall rank
    finance_rank: 2, // Finance section rank
    previous_finance_rank: 3, // Previous finance section rank
    ts: new Date().toISOString(),
    description: 'iOS App Store Rankings'
  },
  {
    id: 2,
    name: 'Pi-Cycle Top',
    value: 0,
    ts: new Date().toISOString(),
    description: 'Bitcoin market cycle indicator'
  }
];