// api/check-signals.js
import { createServerSupabaseClient } from '../lib/supabaseServer.js';
import twilio from 'twilio';

// Embedded Twilio functionality to avoid import issues
const isSandbox = process.env.NODE_ENV !== 'production' || process.env.FORCE_TWILIO_SANDBOX === 'true';
const accountSid = isSandbox ? process.env.TWILIO_TEST_ACCOUNT_SID : process.env.TWILIO_ACCOUNT_SID;
const authToken = isSandbox ? process.env.TWILIO_TEST_AUTH_TOKEN : process.env.TWILIO_AUTH_TOKEN;
const twilioFrom = isSandbox ? (process.env.TWILIO_TEST_FROM || '+15005550006') : process.env.TWILIO_LIVE_FROM;

console.log('🔧 [Twilio Config] Sandbox mode:', isSandbox);
console.log('🔧 [Twilio Config] Account SID:', accountSid ? accountSid.substring(0, 10) + '...' : 'MISSING');
console.log('🔧 [Twilio Config] From number:', twilioFrom || 'MISSING');

const twilioClient = twilio(accountSid, authToken);

async function sendAlert(to, body) {
  return twilioClient.messages.create({
    body,
    from: twilioFrom,
    to
  });
}

// Signal state tracking to prevent duplicate alerts
let signalStates = {
  piCycleTriggered: false,
  rsiExtreme: false,
  broke200w: false,
  coinbaseTop10: false,
  lastHalvingCheck: null
};

// Halving dates (approximate - for testing/demo purposes)
const HALVING_DATES = [
  '2024-04-20', // Most recent halving
  '2028-04-20', // Next projected halving
];

export default async function handler(req, res) {
  console.log('🔄 [CheckSignals] Starting signal check process...');
  
  // Only allow POST requests or GET for testing
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check for force_test parameter (for testing only)
  const forceTest = req.query.force_test;
  if (forceTest) {
    console.log(`⚠️  [CheckSignals] FORCE TEST MODE: ${forceTest}`);
  }

  // Dry run mode (default: true for safety)
  // Force live mode if forceTest is set and includes 'live'
  const isDryRun = forceTest?.includes('live') ? false : process.env.SEND_SMS !== 'true';
  console.log(`🧪 [CheckSignals] Mode: ${isDryRun ? 'DRY RUN' : 'LIVE SMS'}`);
  console.log(`   SEND_SMS env var: "${process.env.SEND_SMS}" (type: ${typeof process.env.SEND_SMS})`);
  if (forceTest?.includes('live')) {
    console.log(`   ⚠️  FORCING LIVE MODE FOR TEST`);
  }

  const supabase = createServerSupabaseClient();
  const alertsToSend = [];
  const results = {
    mode: isDryRun ? 'dry_run' : 'live',
    signals_checked: {},
    alerts_triggered: [],
    subscribers_notified: 0,
    errors: []
  };

  try {
    // 1. Check Pi-Cycle Signal
    console.log('📊 [CheckSignals] Checking Pi-Cycle signal...');
    try {
      const piCycleResponse = await fetch('http://localhost:3000/api/piCycle');
      const piCycleData = await piCycleResponse.json();
      
      results.signals_checked.pi_cycle = {
        sma111: piCycleData.sma111,
        sma350x2: piCycleData.sma350x2,
        crossed: piCycleData.crossed,
        distancePct: piCycleData.distancePct
      };

      if (piCycleData.crossed && !signalStates.piCycleTriggered) {
        alertsToSend.push({
          signal: 'pi_cycle',
          message: '🚨 Pi-Cycle Top indicator just triggered! Historic cycle peak signal detected.',
          priority: 'HIGH'
        });
        signalStates.piCycleTriggered = true;
        console.log('⚠️ [CheckSignals] Pi-Cycle TRIGGERED!');
      } else if (!piCycleData.crossed) {
        signalStates.piCycleTriggered = false; // Reset when condition is no longer met
      }
    } catch (error) {
      console.error('❌ [CheckSignals] Pi-Cycle check failed:', error.message);
      results.errors.push(`Pi-Cycle check failed: ${error.message}`);
    }

    // 2. Check Four-Year Cycle (Halving Events)
    console.log('📅 [CheckSignals] Checking Four-Year Cycle signal...');
    try {
      const today = new Date().toISOString().split('T')[0];
      const isHalvingDay = HALVING_DATES.includes(today);
      
      results.signals_checked.four_year = {
        today,
        next_halving: HALVING_DATES.find(date => date > today),
        is_halving_day: isHalvingDay
      };

      if (isHalvingDay && signalStates.lastHalvingCheck !== today) {
        alertsToSend.push({
          signal: 'four_year',
          message: '🎉 Bitcoin Halving occurred today! Historic 4-year cycle milestone reached.',
          priority: 'HIGH'
        });
        signalStates.lastHalvingCheck = today;
        console.log('⚠️ [CheckSignals] Halving Day TRIGGERED!');
      }
    } catch (error) {
      console.error('❌ [CheckSignals] Four-Year Cycle check failed:', error.message);
      results.errors.push(`Four-Year Cycle check failed: ${error.message}`);
    }

    // 3. Check Coinbase App Rank
    console.log('📱 [CheckSignals] Checking Coinbase App Rank signal...');
    try {
      const coinbaseResponse = await fetch('http://localhost:3000/api/coinbaseRank');
      const coinbaseData = await coinbaseResponse.json();
      
      const currentRank = coinbaseData.overallRank;
      const prevRank = coinbaseData.prevOverallRank;
      
      results.signals_checked.coinbase_rank = {
        current_rank: currentRank,
        previous_rank: prevRank,
        direction: coinbaseData.direction,
        finance_rank: coinbaseData.financeRank
      };

      // Trigger if entering top 10 (rank ≤ 10 from rank > 10)
      const enteredTop10 = currentRank <= 10 && prevRank && prevRank > 10;
      
      if (enteredTop10 && !signalStates.coinbaseTop10) {
        alertsToSend.push({
          signal: 'coinbase_rank',
          message: `🚀 Coinbase app climbed to #${currentRank} on App Store! Major market interest signal.`,
          priority: 'MEDIUM'
        });
        signalStates.coinbaseTop10 = true;
        console.log(`⚠️ [CheckSignals] Coinbase Top 10 TRIGGERED! Rank: ${currentRank}`);
      } else if (currentRank > 10) {
        signalStates.coinbaseTop10 = false; // Reset when out of top 10
      }
    } catch (error) {
      console.error('❌ [CheckSignals] Coinbase Rank check failed:', error.message);
      results.errors.push(`Coinbase Rank check failed: ${error.message}`);
    }

    // 4. Check Monthly RSI
    console.log('📈 [CheckSignals] Checking Monthly RSI signal...');
    try {
      const indicatorsResponse = await fetch('http://localhost:3000/api/btcIndicators');
      const indicatorsData = await indicatorsResponse.json();
      
      results.signals_checked.monthly_rsi = {
        current_rsi: indicatorsData.monthlyRsi,
        status: indicatorsData.status,
        rsi_danger: indicatorsData.rsiDanger
      };

      // Force test mode override
      const shouldTriggerRSI = (forceTest === 'monthly_rsi' || forceTest === 'monthly_rsi_live') || (indicatorsData.rsiDanger && !signalStates.rsiExtreme);
      
      if (shouldTriggerRSI) {
        const testRSI = (forceTest === 'monthly_rsi' || forceTest === 'monthly_rsi_live') ? 85.5 : indicatorsData.monthlyRsi;
        alertsToSend.push({
          signal: 'monthly_rsi',
          message: `📊 BTC Monthly RSI hit ${testRSI?.toFixed(1)} - Extreme overbought zone (≥80)!`,
          priority: 'HIGH'
        });
        signalStates.rsiExtreme = true;
        console.log('⚠️ [CheckSignals] Monthly RSI Extreme TRIGGERED!' + (forceTest ? ' (FORCED TEST)' : ''));
      } else if (!indicatorsData.rsiDanger && forceTest !== 'monthly_rsi') {
        signalStates.rsiExtreme = false; // Reset when RSI drops below 80
      }
    } catch (error) {
      console.error('❌ [CheckSignals] Monthly RSI check failed:', error.message);
      results.errors.push(`Monthly RSI check failed: ${error.message}`);
    }

    // 5. Check Weekly EMA
    console.log('📉 [CheckSignals] Checking Weekly EMA signal...');
    try {
      // Use the same indicators data from above
      const indicatorsResponse = await fetch('http://localhost:3000/api/btcIndicators');
      const indicatorsData = await indicatorsResponse.json();
      
      results.signals_checked.weekly_ema = {
        current_price: indicatorsData.currentPrice,
        weekly_ema_200: indicatorsData.weeklyEma200,
        break_ema_200: indicatorsData.breakEma200,
        weekly_ema_50: indicatorsData.weeklyEma50,
        break_ema_50: indicatorsData.breakEma50
      };

      if (indicatorsData.breakEma200 && !signalStates.broke200w) {
        alertsToSend.push({
          signal: 'weekly_ema',
          message: `⬇️ Bitcoin broke below 200-week EMA ($${indicatorsData.weeklyEma200?.toFixed(0)}) - Major support level lost!`,
          priority: 'HIGH'
        });
        signalStates.broke200w = true;
        console.log('⚠️ [CheckSignals] 200-Week EMA Break TRIGGERED!');
      } else if (!indicatorsData.breakEma200) {
        signalStates.broke200w = false; // Reset when back above 200W EMA
      }
    } catch (error) {
      console.error('❌ [CheckSignals] Weekly EMA check failed:', error.message);
      results.errors.push(`Weekly EMA check failed: ${error.message}`);
    }

    // 6. Send Alerts
    console.log(`📤 [CheckSignals] Processing ${alertsToSend.length} triggered alerts...`);
    
    for (const alert of alertsToSend) {
      const signalKey = alert.signal;
      const messageText = alert.message;
      
      console.log(`🎯 [CheckSignals] Processing ${signalKey} alert...`);
      
      try {
        // Query subscribers for this signal
        let subscribers = null;
        let error = null;
        
        // For testing when Supabase is not properly configured
        if ((forceTest === 'monthly_rsi' || forceTest === 'monthly_rsi_live') && signalKey === 'monthly_rsi') {
          console.log('📱 [CheckSignals] Using test subscriber for forced test');
          subscribers = [{ phone_number: '+13474292996', last_notified_at: null }];
        } else {
          const result = await supabase
            .from('subscriptions')
            .select('phone_number, last_notified_at')
            .eq(signalKey, true);
          subscribers = result.data;
          error = result.error;
        }
        
        if (error) {
          console.error(`❌ [CheckSignals] Supabase query error for ${signalKey}:`, error);
          results.errors.push(`Supabase query error for ${signalKey}: ${error.message}`);
          continue;
        }

        console.log(`📋 [CheckSignals] Found ${subscribers?.length || 0} subscribers for ${signalKey}`);
        
        if (subscribers && subscribers.length > 0) {
          for (const subscriber of subscribers) {
            const phoneNumber = subscriber.phone_number;
            
            if (isDryRun) {
              console.log(`[DRY RUN] Would send ${signalKey} alert to ${phoneNumber}: "${messageText}"`);
            } else {
              try {
                const message = await sendAlert(phoneNumber, messageText + ' - TopSignals');
                console.log(`✅ [CheckSignals] SMS sent to ${phoneNumber}, SID: ${message.sid}`);
                
                // Update last_notified_at timestamp
                await supabase
                  .from('subscriptions')
                  .update({ last_notified_at: new Date().toISOString() })
                  .eq('phone_number', phoneNumber);
                  
              } catch (smsError) {
                console.error(`❌ [CheckSignals] SMS failed for ${phoneNumber}:`, smsError.message);
                results.errors.push(`SMS failed for ${phoneNumber}: ${smsError.message}`);
              }
            }
          }
          
          results.subscribers_notified += subscribers.length;
        }
        
        results.alerts_triggered.push({
          signal: signalKey,
          message: messageText,
          subscriber_count: subscribers?.length || 0,
          priority: alert.priority
        });
        
      } catch (error) {
        console.error(`❌ [CheckSignals] Error processing ${signalKey} alert:`, error);
        results.errors.push(`Error processing ${signalKey} alert: ${error.message}`);
      }
    }

    // 7. Log Summary
    console.log(`✅ [CheckSignals] Check completed:`);
    console.log(`   - Mode: ${isDryRun ? 'DRY RUN' : 'LIVE SMS'}`);
    console.log(`   - Alerts triggered: ${alertsToSend.length}`);
    console.log(`   - Subscribers notified: ${results.subscribers_notified}`);
    console.log(`   - Errors: ${results.errors.length}`);

    results.success = true;
    results.timestamp = new Date().toISOString();
    
    return res.status(200).json(results);

  } catch (error) {
    console.error('💥 [CheckSignals] Fatal error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      mode: isDryRun ? 'dry_run' : 'live'
    });
  }
}