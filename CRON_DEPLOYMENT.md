# Cron Job Deployment Instructions for TopSignals

## Overview
The automated signal checking system is now configured to run every hour on Vercel using cron jobs. This ensures users receive timely SMS alerts when market signals are triggered.

## Configuration Details

### Cron Schedule
- **File**: `vercel.json`
- **Schedule**: `0 * * * *` (runs at the top of every hour)
- **Endpoint**: `/api/check-signals`

### What the Cron Job Does
Every hour, the system automatically:
1. Checks all 5 market signals:
   - Pi-Cycle Top indicator
   - Four-Year Cycle (Bitcoin halvings)
   - Coinbase App Store ranking
   - Monthly RSI extremes
   - Weekly EMA breaks
2. Compares current values against threshold conditions
3. Sends SMS alerts to subscribed users when triggers are met
4. Tracks state to prevent duplicate notifications

## Deployment Steps

### 1. Verify Environment Variables
Before deploying, ensure all required environment variables are set in Vercel:

**Production Environment Variables:**
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_LIVE_FROM=your_twilio_phone_number
SEND_SMS=true  # Set to 'true' for live SMS, 'false' for dry-run mode
```

**Testing/Sandbox Variables (optional):**
```
TWILIO_TEST_ACCOUNT_SID=your_test_account_sid
TWILIO_TEST_AUTH_TOKEN=your_test_auth_token
TWILIO_TEST_FROM=+15005550006  # Twilio test number
FORCE_TWILIO_SANDBOX=true  # Forces sandbox mode for testing
```

### 2. Deploy to Vercel
Deploy the application with the new cron configuration:

```bash
# If using Vercel CLI
vercel --prod

# Or push to your connected Git repository
git add vercel.json CRON_DEPLOYMENT.md
git commit -m "feat: add hourly cron job for automated signal checks"
git push
```

### 3. Verify Cron Job Registration
After deployment:
1. Log into your Vercel dashboard
2. Navigate to your project
3. Go to the "Functions" tab
4. Click on "Cron Jobs"
5. You should see the `/api/check-signals` job listed with schedule "0 * * * *"

### 4. Test the Cron Job
You can test the cron job in several ways:

**Option A: Manual Trigger from Vercel Dashboard**
1. In the Cron Jobs section, find your job
2. Click the "Run" button to trigger it manually
3. Check the function logs to see the output

**Option B: Direct API Test**
```bash
# Dry run test (no SMS sent)
curl https://your-app.vercel.app/api/check-signals

# Force test a specific signal (dry run)
curl https://your-app.vercel.app/api/check-signals?force_test=monthly_rsi

# Force test with LIVE SMS (use cautiously!)
curl https://your-app.vercel.app/api/check-signals?force_test=monthly_rsi_live
```

### 5. Monitor Logs
Monitor the cron job execution:
1. Go to Vercel Dashboard → Functions → Logs
2. Filter by `/api/check-signals`
3. Look for:
   - Successful executions (200 status)
   - Any errors or failed SMS sends
   - Number of alerts triggered
   - Number of subscribers notified

## Testing Recommendations

### Initial Deployment (Dry Run)
1. Deploy with `SEND_SMS=false` initially
2. Let the cron run for a few cycles
3. Check logs for "[DRY RUN]" entries
4. Verify signal checks are working correctly

### Switching to Live Mode
1. Once confident, set `SEND_SMS=true` in Vercel environment
2. Redeploy or wait for environment variable to propagate
3. Monitor first few live runs closely
4. Verify SMS delivery in Twilio dashboard

### Frequency Adjustment
If you need to adjust the checking frequency:

- **Every 6 hours**: `0 */6 * * *`
- **Every 3 hours**: `0 */3 * * *`
- **Daily at 9 AM UTC**: `0 9 * * *`
- **Every 15 minutes** (for testing): `*/15 * * * *`

Update the schedule in `vercel.json` and redeploy.

## Troubleshooting

### Common Issues

1. **Cron job not appearing in Vercel**
   - Ensure `vercel.json` is in the root directory
   - Check JSON syntax is valid
   - Redeploy the application

2. **Function timing out**
   - Check API endpoints are responding
   - Verify external APIs (Twilio, Supabase) are accessible
   - Consider increasing function timeout if needed

3. **No SMS being sent**
   - Verify `SEND_SMS=true` in production
   - Check Twilio credentials are correct
   - Review function logs for errors
   - Ensure subscribers exist in the database

4. **Duplicate alerts**
   - The system tracks state to prevent duplicates
   - If duplicates occur, check the state tracking logic
   - Ensure cron isn't running more frequently than expected

## Cost Considerations

- **Vercel**: Cron jobs count against your function invocations
- **Twilio**: Each SMS sent incurs a cost (~$0.0079 per SMS in US)
- **Monitoring**: With hourly checks and rare triggers, costs should be minimal

## Future Enhancements

Consider these improvements:
1. Add webhook endpoint for Twilio STOP handling
2. Implement rate limiting per subscriber
3. Add admin dashboard for monitoring alerts
4. Set up error alerting for failed cron runs
5. Add metrics tracking for alert effectiveness

---

Last updated: 2025-07-01