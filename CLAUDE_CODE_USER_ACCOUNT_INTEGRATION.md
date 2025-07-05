# Claude Code - User Account Integration

## Overview
Implementing user accounts and a paywall system for TopSignals to differentiate between free and premium users. This includes secure authentication, user profile management, payment processing, and content gating.

## Goal
Add user sign-up/login functionality with Supabase Auth and integrate Stripe for premium subscriptions. Premium users get access to additional market signals, real-time alerts, and exclusive features.

## User Flow
1. **Visitor** → Can see free content, prompted to sign up
2. **Free User** → Logged in but limited content access
3. **Premium User** → Full access after payment via Stripe
4. **Admin** → Full access without payment requirement

## Tech Stack
- **Authentication**: Supabase Auth (email/password, no email verification required)
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Payments**: Stripe (checkout sessions and webhooks)
- **Frontend**: React with existing UI components
- **Backend**: Vercel serverless functions

---

## Step 1: Supabase Schema & Auth Configuration ✅

### Database Changes Made:
1. **User Metadata Setup**:
   ```sql
   -- Added default metadata for existing users
   UPDATE auth.users 
   SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"is_premium": false, "is_admin": false}'::jsonb
   WHERE raw_user_meta_data IS NULL OR NOT (raw_user_meta_data ? 'is_premium');
   ```

2. **Signals Table Enhancement**:
   ```sql
   -- Added premium gating column
   ALTER TABLE public.signals ADD COLUMN premium_only BOOLEAN DEFAULT FALSE;
   ```

3. **User Linking for Subscriptions**:
   ```sql
   -- Link SMS subscriptions to user accounts
   ALTER TABLE public.subscriptions ADD COLUMN user_id UUID REFERENCES auth.users (id);
   ```

4. **Row Level Security (RLS) Implementation**:
   ```sql
   -- Enable RLS on signals table
   ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;
   
   -- Allow free signals to everyone
   CREATE POLICY "Allow free signals" ON public.signals
   FOR SELECT USING (premium_only = FALSE);
   
   -- Allow premium signals to premium users
   CREATE POLICY "Allow premium signals to premium users" ON public.signals
   FOR SELECT USING (
     premium_only = FALSE 
     OR (auth.jwt() -> 'user_metadata' ->> 'is_premium') = 'true' 
     OR (auth.jwt() -> 'user_metadata' ->> 'is_admin') = 'true'
   );
   
   -- Service role can access all signals
   CREATE POLICY "Service role can read all signals" ON public.signals
   FOR SELECT USING (auth.role() = 'service_role');
   
   -- Enable RLS on subscriptions table
   ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
   
   -- Users can only access their own subscriptions
   CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
   FOR SELECT USING (user_id = auth.uid());
   
   CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions
   FOR INSERT WITH CHECK (user_id = auth.uid());
   ```

5. **Admin User Setup**:
   ```sql
   -- Set admin privileges for primary user
   UPDATE auth.users 
   SET raw_user_meta_data = raw_user_meta_data || '{"is_premium": true, "is_admin": true}'::jsonb
   WHERE email = 'umihuss@gmail.com';
   ```

### Results:
- ✅ Database ready for user roles (free/premium/admin)
- ✅ Content gating enforced at database level
- ✅ Admin account configured with full privileges
- ✅ User metadata will be included in JWT tokens automatically

---

## Step 2: Dependencies & Environment Setup ✅

### Dependencies Added:
```json
{
  "stripe": "^18.3.0"  // Already present
  "@supabase/supabase-js": "^2.39.7"  // Already present and up to date
}
```

### Environment Variables Configured:

#### Local Development (.env.local):
```bash
# Existing Supabase config
VITE_SUPABASE_URL="https://gsshmeaavvtwjxmosuwo.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Server-side Supabase access
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"

# Stripe integration
STRIPE_SECRET_KEY="sk_test_..." # Your Stripe test secret key
STRIPE_WEBHOOK_SECRET="YOUR_STRIPE_WEBHOOK_SECRET_HERE"  # Will be set when webhook is created

# Development URLs
SITE_URL="http://localhost:3000"  # For Vercel dev
```

#### Vercel Production:
- ✅ SUPABASE_SERVICE_ROLE_KEY (already configured)
- 🟡 STRIPE_SECRET_KEY (needs to be added)
- 🟡 STRIPE_WEBHOOK_SECRET (will be added later)
- 🟡 SITE_URL (production domain)

### Development Environment:
- ✅ Using `npx vercel dev` for testing (port 3000)
- ✅ Vercel environment variables automatically loaded
- ✅ Ready for API routes and Stripe webhook testing

### Testing Results:
```bash
npx vercel dev
# ✅ Server starts successfully at http://localhost:3000
# ✅ All environment variables loaded
# ✅ Vite build completes without errors
```

---

## Next Steps: Step 3 - Authentication UI Implementation

### Planned Components:
1. **AuthModal** - Sign up/login forms
2. **Header Updates** - Login/logout buttons, user status
3. **Content Gating** - Conditional rendering based on user status
4. **Auth Context** - Global state management for user session

### Planned API Routes:
1. **api/create-checkout-session.js** - Stripe checkout creation
2. **api/stripe-webhook.js** - Payment confirmation handler
3. **api/auth/[...nextauth].js** - Auth session management (if needed)

### Key Features to Implement:
- [ ] User registration (email/password)
- [ ] User login/logout
- [ ] Premium upgrade flow
- [ ] Content filtering based on user status
- [ ] Payment processing with Stripe
- [ ] Webhook handling for subscription updates

---

## Notes
- No email verification required on signup (configured in Supabase)
- Password reset functionality will be implemented
- RLS policies automatically enforce content access
- Admin account bypasses payment requirements
- Using Vercel dev environment for consistent testing