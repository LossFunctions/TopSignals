# Stripe Setup Guide for TopSignals Premium

This guide walks through the manual setup required in the Stripe Dashboard to enable one-time premium payments for TopSignals.

## Prerequisites
- Stripe account (test mode for development, live mode for production)
- Access to Stripe Dashboard
- Vercel deployment URL (or localhost for testing)

## Step 1: Create the Premium Product

1. **Log in to Stripe Dashboard**
   - Navigate to https://dashboard.stripe.com
   - Ensure you're in the correct mode (Test/Live)

2. **Create Product**
   - Go to **Products** → **Add product**
   - Product information:
     - **Name**: TopSignals Premium
     - **Description**: Lifetime access to all premium signals and features
     - **Image**: (optional) Upload a logo or icon

3. **Set Pricing**
   - **Pricing model**: One-time
   - **Price**: Set your desired amount (e.g., $49.99)
   - **Currency**: USD (or your preferred currency)
   - Click **Save product**

4. **Copy the Price ID**
   - After creation, you'll see a Price ID (format: `price_1234567890abcdef`)
   - **Save this ID** - you'll need it for the code

## Step 2: Configure Webhook Endpoint

1. **Navigate to Webhooks**
   - Go to **Developers** → **Webhooks**
   - Click **Add endpoint**

2. **Endpoint Configuration**
   - **Endpoint URL**: 
     - Production: `https://your-app.vercel.app/api/stripe-webhook`
     - Local testing: Use Stripe CLI (see below)
   - **Events to send**: Select these events:
     - `checkout.session.completed` (required)
     - `checkout.session.expired` (optional)
     - `payment_intent.succeeded` (optional backup)

3. **Save and Get Signing Secret**
   - Click **Add endpoint**
   - Copy the **Signing secret** (format: `whsec_xxx...`)
   - **Save this secret** - needed for webhook verification

## Step 3: Configure Checkout Settings (Optional)

1. **Checkout Branding**
   - Go to **Settings** → **Checkout and Payment Links**
   - Customize appearance to match your brand
   - Set up customer portal settings

2. **Domain Configuration**
   - Add your domain to allowed redirect URLs (if required)
   - Usually automatic for standard checkouts

## Step 4: Local Testing with Stripe CLI

For local development:

1. **Install Stripe CLI**
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe
   
   # or download from https://stripe.com/docs/stripe-cli
   ```

2. **Login to Stripe CLI**
   ```bash
   stripe login
   ```

3. **Forward Webhooks to Localhost**
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe-webhook
   ```
   - This will show a webhook signing secret for local testing
   - Use this instead of the dashboard secret for local dev

## Step 5: Environment Variables

Add these to your `.env.local` and Vercel environment:

```env
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_... # Your secret key from Stripe Dashboard
STRIPE_PUBLISHABLE_KEY=pk_test_... # Your publishable key (optional, for client-side)

# Stripe Product/Price
STRIPE_PRICE_ID=price_... # The Price ID from Step 1

# Stripe Webhook
STRIPE_WEBHOOK_SECRET=whsec_... # The signing secret from Step 2

# URLs for Checkout (configure based on your domain)
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app # Your app's base URL
```

## Step 6: Testing the Setup

1. **Test Mode First**
   - Always test with Stripe test mode keys first
   - Use test card numbers: `4242 4242 4242 4242`

2. **Verify Webhook Connection**
   - Stripe Dashboard → Developers → Webhooks → Your endpoint
   - Check for successful webhook attempts after test payments

3. **Monitor Events**
   - Use Stripe Dashboard → Developers → Events
   - Watch for checkout and payment events

## URLs for Checkout Redirect

Configure these in your checkout session code:

- **Success URL**: `https://your-app.vercel.app/?checkout=success`
- **Cancel URL**: `https://your-app.vercel.app/?checkout=cancel`

## Important Notes

- **One-Time Payment**: This setup is for lifetime access, not subscriptions
- **User Linking**: We'll use `client_reference_id` to link Stripe customers to Supabase users
- **Security**: Never expose your secret key or webhook secret client-side
- **Testing**: Always test the full flow in test mode before going live

## Next Steps

After completing this setup:
1. Note your Price ID and Webhook Secret
2. Add them to your environment variables
3. Proceed to implement the API routes for checkout and webhooks