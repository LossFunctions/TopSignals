-- Create subscriptions table for SMS alert notifications
-- This table stores phone numbers and their signal preferences

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone_number TEXT NOT NULL UNIQUE,
    
    -- Signal preferences (boolean columns for each signal type)
    pi_cycle BOOLEAN DEFAULT FALSE,
    four_year BOOLEAN DEFAULT FALSE, 
    coinbase_rank BOOLEAN DEFAULT FALSE,
    monthly_rsi BOOLEAN DEFAULT FALSE,
    weekly_ema BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_notified_at TIMESTAMPTZ NULL,
    
    -- Constraints
    CONSTRAINT valid_phone_format CHECK (phone_number ~ '^\+[1-9]\d{1,14}$')
);

-- Create index on phone_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_phone ON public.subscriptions(phone_number);

-- Create index on signal preferences for efficient querying
CREATE INDEX IF NOT EXISTS idx_subscriptions_pi_cycle ON public.subscriptions(pi_cycle) WHERE pi_cycle = TRUE;
CREATE INDEX IF NOT EXISTS idx_subscriptions_four_year ON public.subscriptions(four_year) WHERE four_year = TRUE;  
CREATE INDEX IF NOT EXISTS idx_subscriptions_coinbase_rank ON public.subscriptions(coinbase_rank) WHERE coinbase_rank = TRUE;
CREATE INDEX IF NOT EXISTS idx_subscriptions_monthly_rsi ON public.subscriptions(monthly_rsi) WHERE monthly_rsi = TRUE;
CREATE INDEX IF NOT EXISTS idx_subscriptions_weekly_ema ON public.subscriptions(weekly_ema) WHERE weekly_ema = TRUE;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at column
CREATE TRIGGER update_subscriptions_updated_at 
    BEFORE UPDATE ON public.subscriptions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create signal_states table to track global signal trigger states
-- This prevents duplicate notifications for the same signal event
CREATE TABLE IF NOT EXISTS public.signal_states (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    signal_name TEXT NOT NULL UNIQUE,
    last_state BOOLEAN DEFAULT FALSE,
    last_triggered_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial signal states
INSERT INTO public.signal_states (signal_name, last_state) VALUES
('pi_cycle_triggered', FALSE),
('halving_notified', FALSE), 
('rsi_extreme', FALSE),
('broke_200w', FALSE)
ON CONFLICT (signal_name) DO NOTHING;

-- Create trigger for signal_states updated_at
CREATE TRIGGER update_signal_states_updated_at 
    BEFORE UPDATE ON public.signal_states 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) for security
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signal_states ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role full access (for backend operations)
CREATE POLICY "Service role can manage subscriptions" ON public.subscriptions
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage signal states" ON public.signal_states  
    FOR ALL USING (auth.role() = 'service_role');

-- Create policy to block anonymous users from direct access
CREATE POLICY "Block anonymous access to subscriptions" ON public.subscriptions
    FOR ALL USING (FALSE);

CREATE POLICY "Block anonymous access to signal_states" ON public.signal_states
    FOR ALL USING (FALSE);

-- Add helpful comments
COMMENT ON TABLE public.subscriptions IS 'Stores phone number subscriptions for SMS alert notifications';
COMMENT ON COLUMN public.subscriptions.phone_number IS 'Phone number in E.164 format (e.g., +15551234567)';
COMMENT ON COLUMN public.subscriptions.pi_cycle IS 'Subscribe to Pi-Cycle Top indicator alerts';
COMMENT ON COLUMN public.subscriptions.four_year IS 'Subscribe to Four-Year Cycle (halving) alerts';
COMMENT ON COLUMN public.subscriptions.coinbase_rank IS 'Subscribe to Coinbase App Rank alerts';
COMMENT ON COLUMN public.subscriptions.monthly_rsi IS 'Subscribe to Monthly RSI extreme alerts';
COMMENT ON COLUMN public.subscriptions.weekly_ema IS 'Subscribe to Weekly EMA break alerts';

COMMENT ON TABLE public.signal_states IS 'Tracks global signal trigger states to prevent duplicate notifications';
COMMENT ON COLUMN public.signal_states.signal_name IS 'Unique identifier for the signal type';
COMMENT ON COLUMN public.signal_states.last_state IS 'Last known state of the signal trigger';
COMMENT ON COLUMN public.signal_states.last_triggered_at IS 'Timestamp when the signal last triggered';