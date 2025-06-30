# Enable Live SMS Sending - Safety Checklist

## ⚠️ IMPORTANT: Test with ONE phone number first!

### Step 1: Add Test Subscriber
Before enabling live SMS, add your own phone number to test:
```sql
-- Connect to Supabase and run:
INSERT INTO subscriptions (phone_number, pi_cycle, monthly_rsi) 
VALUES ('+1YOURNUMBER', true, true);
```

### Step 2: Enable Live SMS Mode
In `.env.local`, change:
```bash
# Change this:
SEND_SMS=false

# To this:
SEND_SMS=true
```

### Step 3: Test Live SMS (CAREFULLY)
```bash
# Restart the server
pkill -f "vercel dev"
vercel dev --listen 3000

# Call the endpoint
curl http://localhost:3000/api/check-signals
```

### Step 4: Force a Test Alert (Optional)
To test SMS sending, temporarily modify the check-signals.js file:
```javascript
// Around line 70, force a trigger for testing:
if (piCycleData.crossed && !signalStates.piCycleTriggered) {
    // Change to:
if (true) { // FORCE TRIGGER FOR TESTING
```

### Step 5: Production Deployment
Once testing is successful:
1. Set environment variables in Vercel dashboard:
   - `SEND_SMS=true`
   - All Twilio credentials
2. Deploy: `git push` 
3. Set up scheduled trigger (Step 6 - next phase)

## 🚨 Safety Controls Built-In:
- ✅ Dry run mode by default (`SEND_SMS=false`)
- ✅ Duplicate alert prevention (state tracking)
- ✅ Subscriber-specific querying (only opted-in numbers)
- ✅ Error handling per SMS attempt
- ✅ Comprehensive logging
- ✅ Twilio sandbox mode for development

## Current Signal Thresholds:
- **Pi-Cycle**: SMA111 > SMA350×2 (currently 96k vs 170k - not triggered)
- **Coinbase Rank**: Overall rank ≤ 10 (currently not in top 100 - not triggered)  
- **Monthly RSI**: ≥ 80 (currently 70.16 - not triggered)
- **Weekly EMA**: Price < 200W EMA (currently 108k > 57k - not triggered)
- **Four-Year Cycle**: Halving dates (next: 2028-04-20 - not triggered)

The system is production-ready! 🎉