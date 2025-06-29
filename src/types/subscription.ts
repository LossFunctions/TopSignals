// TypeScript interfaces for subscription feature

export interface Subscription {
  id: string;
  phone_number: string;
  pi_cycle: boolean;
  four_year: boolean;
  coinbase_rank: boolean;
  monthly_rsi: boolean;
  weekly_ema: boolean;
  created_at: string;
  updated_at: string;
  last_notified_at?: string | null;
}

export interface SignalState {
  id: string;
  signal_name: string;
  last_state: boolean;
  last_triggered_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionRequest {
  phone: string;
  signals: {
    pi_cycle: boolean;
    four_year: boolean;
    coinbase_rank: boolean;
    monthly_rsi: boolean;
    weekly_ema: boolean;
  };
}

export interface SubscriptionResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// Signal configuration for easy management
export const SIGNAL_CONFIG = {
  pi_cycle: {
    key: 'pi_cycle',
    name: 'Pi-Cycle Top Trigger',
    description: 'Get alerted when the Pi-Cycle indicator fires (111-day MA crosses above 350-day MA×2)'
  },
  four_year: {
    key: 'four_year', 
    name: 'Four-Year Cycle',
    description: 'Get alerted for Bitcoin nears significant events, cycle milestones and projected top'
  },
  coinbase_rank: {
    key: 'coinbase_rank',
    name: 'Coinbase App Rank',
    description: 'Get alerted when Coinbase app enters Top 10 on App Store'
  },
  monthly_rsi: {
    key: 'monthly_rsi',
    name: 'Monthly RSI Extreme',
    description: 'Get alerted when Bitcoin monthly RSI hits extreme levels (≥80)'
  },
  weekly_ema: {
    key: 'weekly_ema',
    name: 'Weekly EMA Break',
    description: 'Get alerted when Bitcoin breaks below key weekly moving averages (200W)'
  }
} as const;

export type SignalKey = keyof typeof SIGNAL_CONFIG;