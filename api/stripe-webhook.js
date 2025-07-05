import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Initialize Supabase client for server-side operations
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // For Vercel, we need to handle the raw body properly
    let body;
    if (typeof req.body === 'string') {
      body = req.body;
    } else {
      body = JSON.stringify(req.body);
    }
    
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error('[Webhook] Signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
  }

  console.log('[Webhook] Received event:', event.type, event.id);

  try {
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      
      case 'checkout.session.expired':
        await handleCheckoutExpired(event.data.object);
        break;
      
      default:
        console.log('[Webhook] Unhandled event type:', event.type);
    }

    res.status(200).json({ received: true, eventType: event.type });
  } catch (error) {
    console.error('[Webhook] Error processing event:', error);
    res.status(500).json({ 
      error: 'Webhook processing failed',
      details: error.message 
    });
  }
}

async function handleCheckoutCompleted(session) {
  console.log('[Webhook] Processing checkout completion:', {
    sessionId: session.id,
    customerEmail: session.customer_email,
    userId: session.client_reference_id,
    amountTotal: session.amount_total,
  });

  const userId = session.client_reference_id;
  const customerEmail = session.customer_email;

  if (!userId) {
    console.error('[Webhook] No user ID found in session');
    throw new Error('No user ID found in checkout session');
  }

  try {
    // Update user metadata to mark as premium
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      {
        user_metadata: {
          is_premium: true,
          stripe_customer_id: session.customer,
          stripe_session_id: session.id,
          premium_activated_at: new Date().toISOString(),
          payment_amount: session.amount_total,
          payment_currency: session.currency,
        }
      }
    );

    if (updateError) {
      console.error('[Webhook] Failed to update user metadata:', updateError);
      throw updateError;
    }

    console.log('[Webhook] User upgraded to premium:', {
      userId,
      email: customerEmail,
      sessionId: session.id,
    });

    // Optional: Create a record in a payments/transactions table
    // This could be useful for billing history, analytics, etc.
    const { error: insertError } = await supabase
      .from('user_transactions') // You'd need to create this table
      .insert({
        user_id: userId,
        stripe_session_id: session.id,
        stripe_customer_id: session.customer,
        amount: session.amount_total,
        currency: session.currency,
        status: 'completed',
        transaction_type: 'premium_upgrade',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    // Don't throw on insert error - user is still upgraded
    if (insertError) {
      console.warn('[Webhook] Failed to record transaction (user still upgraded):', insertError);
    }

  } catch (error) {
    console.error('[Webhook] Error upgrading user to premium:', error);
    throw error;
  }
}

async function handleCheckoutExpired(session) {
  console.log('[Webhook] Checkout session expired:', {
    sessionId: session.id,
    customerEmail: session.customer_email,
    userId: session.client_reference_id,
  });

  // Optional: Log expired sessions for analytics
  // Could track conversion rates, abandoned checkouts, etc.
}

// Disable body parsing for raw webhook body
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}