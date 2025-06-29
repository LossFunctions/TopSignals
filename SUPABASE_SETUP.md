# Supabase Database Setup for SMS Notifications

This document outlines how to set up the database tables required for the SMS notification feature.

## Prerequisites

1. A Supabase project set up
2. Access to the Supabase SQL Editor or PostgreSQL client
3. Environment variables configured:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

## Database Setup

### Step 1: Run the SQL Script

Execute the SQL script `supabase-subscriptions-table.sql` in your Supabase SQL Editor:

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase-subscriptions-table.sql`
4. Click **Run**

### Step 2: Verify Table Creation

After running the script, verify the following tables were created:

#### `subscriptions` table
- Stores phone numbers and signal preferences
- Has proper indexes for efficient queries
- Includes Row Level Security (RLS) policies

#### `signal_states` table  
- Tracks global signal trigger states
- Prevents duplicate notifications
- Used by the notification scheduler

### Step 3: Environment Variables

Ensure these environment variables are set in your Vercel deployment:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Twilio Configuration (to be added later)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_FROM_NUMBER=your_twilio_phone_number
```

## Table Structure

### `subscriptions` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `phone_number` | TEXT | Phone number in E.164 format (+15551234567) |
| `pi_cycle` | BOOLEAN | Subscribe to Pi-Cycle alerts |
| `four_year` | BOOLEAN | Subscribe to Four-Year Cycle alerts |
| `coinbase_rank` | BOOLEAN | Subscribe to Coinbase App Rank alerts |
| `monthly_rsi` | BOOLEAN | Subscribe to Monthly RSI alerts |
| `weekly_ema` | BOOLEAN | Subscribe to Weekly EMA alerts |
| `created_at` | TIMESTAMPTZ | When subscription was created |
| `updated_at` | TIMESTAMPTZ | When subscription was last updated |
| `last_notified_at` | TIMESTAMPTZ | When last notification was sent |

### `signal_states` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `signal_name` | TEXT | Signal identifier (e.g., 'pi_cycle_triggered') |
| `last_state` | BOOLEAN | Last known state of the signal |
| `last_triggered_at` | TIMESTAMPTZ | When signal last triggered |
| `created_at` | TIMESTAMPTZ | When record was created |
| `updated_at` | TIMESTAMPTZ | When record was last updated |

## Security

- Both tables have Row Level Security (RLS) enabled
- Only the service role can access these tables
- Anonymous users are blocked from direct access
- All operations must go through backend API endpoints

## Next Steps

1. ✅ Database tables are now set up
2. ⏳ Create subscription form UI
3. ⏳ Build backend API endpoint
4. ⏳ Configure Twilio integration
5. ⏳ Implement notification logic

## Testing

You can test the table setup by running a simple query in the Supabase SQL Editor:

```sql
-- Test insert (using service role)
INSERT INTO public.subscriptions (phone_number, pi_cycle, coinbase_rank) 
VALUES ('+15551234567', true, true);

-- Test query
SELECT * FROM public.subscriptions;

-- Test signal states
SELECT * FROM public.signal_states;
```

## Troubleshooting

If you encounter issues:

1. **Permission Denied**: Make sure you're using the service role key for backend operations
2. **Invalid Phone Format**: Phone numbers must be in E.164 format (+15551234567)
3. **RLS Blocking Access**: Verify your policies allow the service role to access the tables

For more help, check the Supabase documentation or the project's GitHub issues.