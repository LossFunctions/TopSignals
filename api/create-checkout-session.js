import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize Supabase client for server-side operations
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userEmail, userId } = req.body;

    // Validate required fields
    if (!userEmail || !userId) {
      return res.status(400).json({ 
        error: 'Missing required fields: userEmail and userId' 
      });
    }

    // Verify the user exists in Supabase
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError || !user) {
      console.error('[Checkout] User verification failed:', userError);
      return res.status(401).json({ error: 'Invalid user' });
    }

    // Check if user is already premium
    const isAlreadyPremium = user.user_metadata?.is_premium || user.user_metadata?.is_admin;
    if (isAlreadyPremium) {
      return res.status(400).json({ 
        error: 'User already has premium access' 
      });
    }

    // Get base URL for redirects
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://topsignals.vercel.app';
    
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment', // One-time payment
      customer_email: userEmail,
      client_reference_id: userId, // Link to our user
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID, // Your price ID from Stripe
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/?checkout=cancel`,
      metadata: {
        user_id: userId,
        user_email: userEmail,
        product: 'TopSignals Premium',
      },
    });

    console.log('[Checkout] Session created:', {
      sessionId: session.id,
      userId,
      userEmail,
      amount: session.amount_total,
    });

    res.status(200).json({
      sessionId: session.id,
      url: session.url,
    });

  } catch (error) {
    console.error('[Checkout] Error creating session:', error);
    
    // Handle specific Stripe errors
    if (error.type === 'StripeCardError') {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      details: error.message 
    });
  }
}