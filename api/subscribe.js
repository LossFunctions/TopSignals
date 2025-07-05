// API endpoint for handling subscription form submissions
import dotenv from 'dotenv';
import { createServerSupabaseClient } from '../lib/supabaseServer.js';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Basic phone validation function
function validatePhoneNumber(phone) {
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phone.trim());
}

// Format phone to E.164
function formatPhoneNumber(phone) {
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (!cleaned.startsWith('+')) {
    if (cleaned.length === 10) {
      cleaned = '+1' + cleaned;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      cleaned = '+' + cleaned;
    } else if (cleaned.length > 0) {
      cleaned = '+1' + cleaned;
    }
  }
  return cleaned;
}

// Validate subscription request
function validateSubscriptionRequest(data) {
  const errors = [];
  
  if (!data.phone || typeof data.phone !== 'string') {
    errors.push('Phone number is required');
  } else if (!validatePhoneNumber(data.phone)) {
    errors.push('Invalid phone number format. Use format: +1234567890');
  }
  
  if (!data.signals || typeof data.signals !== 'object') {
    errors.push('Signal preferences are required');
  } else {
    const validSignals = ['pi_cycle', 'four_year', 'coinbase_rank', 'monthly_rsi', 'weekly_ema'];
    const providedKeys = Object.keys(data.signals);
    const invalidKeys = providedKeys.filter(key => !validSignals.includes(key));
    
    if (invalidKeys.length > 0) {
      errors.push(`Invalid signal preferences: ${invalidKeys.join(', ')}`);
    }
    
    const enabledSignals = Object.entries(data.signals).filter(([_, enabled]) => enabled);
    if (enabledSignals.length === 0) {
      errors.push('At least one signal must be selected');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    phone: data.phone ? formatPhoneNumber(data.phone) : undefined,
    signals: data.signals
  };
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed. Use POST.' 
    });
  }

  try {
    // Check for authentication token
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required. Please log in to subscribe to alerts.' 
      });
    }

    // Initialize Supabase client for auth verification
    const supabase = createServerSupabaseClient();
    if (!supabase) {
      console.error('[Subscribe] Failed to initialize Supabase client');
      return res.status(500).json({ 
        success: false,
        error: 'Database connection failed' 
      });
    }

    // Verify user authentication and get user data
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('[Subscribe] Auth verification failed:', authError);
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid authentication token. Please log in again.' 
      });
    }

    // Check if user has premium access
    const isPremium = user.user_metadata?.is_premium || user.user_metadata?.is_admin;
    if (!isPremium) {
      return res.status(403).json({ 
        success: false, 
        error: 'Premium membership required for SMS alerts. Please upgrade your account to access this feature.' 
      });
    }

    // Validate request payload
    const validation = validateSubscriptionRequest(req.body);
    if (!validation.isValid) {
      console.log('[Subscribe] Validation failed:', validation.errors);
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed',
        errors: validation.errors 
      });
    }

    // Prepare data for insert/upsert (include user_id to link subscription to user)
    const subscriptionData = {
      user_id: user.id,
      phone_number: validation.phone,
      pi_cycle: validation.signals.pi_cycle || false,
      four_year: validation.signals.four_year || false,
      coinbase_rank: validation.signals.coinbase_rank || false,
      monthly_rsi: validation.signals.monthly_rsi || false,
      weekly_ema: validation.signals.weekly_ema || false,
      updated_at: new Date().toISOString()
    };

    // Insert or update subscription using upsert (one subscription per user)
    const { data, error } = await supabase
      .from('subscriptions')
      .upsert(subscriptionData, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) {
      console.error('[Subscribe] Database error:', error);
      
      // Handle specific error cases
      if (error.code === '23505') {
        // Unique constraint violation (shouldn't happen with upsert, but just in case)
        return res.status(409).json({
          success: false,
          error: 'Phone number already exists'
        });
      }
      
      return res.status(500).json({ 
        success: false,
        error: 'Failed to save subscription. Please try again.' 
      });
    }

    // Log successful subscription
    console.log('[Subscribe] Subscription saved successfully:', {
      id: data.id,
      user_id: user.id,
      user_email: user.email,
      phone: validation.phone,
      signals: Object.entries(validation.signals)
        .filter(([_, enabled]) => enabled)
        .map(([key, _]) => key)
    });

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Subscription saved successfully! You\'ll receive alerts when selected signals trigger.',
      data: {
        id: data.id,
        phone_number: data.phone_number,
        signals: {
          pi_cycle: data.pi_cycle,
          four_year: data.four_year,
          coinbase_rank: data.coinbase_rank,
          monthly_rsi: data.monthly_rsi,
          weekly_ema: data.weekly_ema
        }
      }
    });

  } catch (error) {
    console.error('[Subscribe] Unexpected error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.'
    });
  }
}