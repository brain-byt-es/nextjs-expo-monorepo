# Stripe Webhook Setup Guide

## Overview

The Stripe webhook endpoint at `/api/webhooks/stripe` handles the following events:

- `checkout.session.completed` - User completed a purchase
- `customer.subscription.updated` - Subscription plan changed
- `customer.subscription.deleted` - Subscription canceled
- `invoice.payment_succeeded` - Payment received
- `invoice.payment_failed` - Payment failed

## Prerequisites

1. **Stripe Account** - Create at [stripe.com](https://stripe.com)
2. **Supabase Project** - For storing subscription data
3. **Environment Variables** - Set in `.env.local`

## 1. Environment Setup

Add to `.env.local`:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 2. Create Supabase Tables

Run the migration in Supabase SQL Editor:

```sql
-- From: apps/web/supabase/migrations/001_create_subscription_tables.sql
```

Or run via CLI:

```bash
cd apps/web
supabase db push
```

This creates:
- `user_subscriptions` - Stores subscription data
- `payments` - Stores payment history

## 3. Configure Stripe Webhook

### Local Development (Stripe CLI)

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli

2. Login:
   ```bash
   stripe login
   ```

3. Forward webhooks to local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

4. Copy the signing secret and add to `.env.local`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### Production Deployment

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)

2. Create new endpoint:
   - URL: `https://yourdomain.com/api/webhooks/stripe`
   - Events: Select the events listed below

3. Copy signing secret to production `.env`

### Required Events

Select these events in Stripe Dashboard:

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

## 4. Test Webhook

### With Stripe CLI

```bash
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger invoice.payment_succeeded
```

### Manual Testing

1. Start the app:
   ```bash
   pnpm dev
   ```

2. In another terminal, run Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

3. Create a test payment:
   - Go to `/pricing`
   - Select a plan and click "Subscribe Now"
   - Use test card: `4242 4242 4242 4242`
   - Check logs to see webhook events

## 5. Webhook Event Details

### checkout.session.completed

Triggered when customer completes payment.

**Action:** Creates/updates subscription record in Supabase

```
- stripe_customer_id
- stripe_subscription_id
- status: "active"
- email
```

### customer.subscription.updated

Triggered when subscription plan changes or renews.

**Action:** Updates subscription status

```
- status: updated status (active, past_due, canceled, etc.)
- updated_at: timestamp
```

### customer.subscription.deleted

Triggered when subscription is canceled.

**Action:** Marks subscription as canceled

```
- status: "canceled"
- canceled_at: timestamp
```

### invoice.payment_succeeded

Triggered when invoice is paid.

**Action:** Records payment in database

```
- amount: paid amount
- status: "paid"
- paid_at: timestamp
```

### invoice.payment_failed

Triggered when payment fails.

**Action:** Records failed payment

```
- amount: amount attempted
- status: "failed"
- failed_at: timestamp
```

**TODO:** Send email notification to user

## 6. Common Issues

### "Invalid signature" error

**Solution:** Ensure `STRIPE_WEBHOOK_SECRET` is correct

```bash
stripe listen --print-secret
```

### "webhook handler failed" error

**Solution:** Check Supabase connection

1. Verify environment variables
2. Check Supabase tables exist (run migration)
3. Verify service role key permissions

### Webhook not triggered

**Solution:**

1. Check Stripe Dashboard → Webhooks → Recent Deliveries
2. Verify endpoint URL is correct
3. Ensure firewall allows incoming requests
4. Check logs in Stripe Dashboard

## 7. Database Schema

### user_subscriptions

```sql
id UUID
stripe_customer_id TEXT (unique)
stripe_subscription_id TEXT (unique)
email TEXT
status TEXT
plan_id TEXT
created_at TIMESTAMP
updated_at TIMESTAMP
canceled_at TIMESTAMP
```

### payments

```sql
id UUID
stripe_invoice_id TEXT (unique)
stripe_subscription_id TEXT
amount BIGINT (in cents)
currency TEXT
status TEXT
paid_at TIMESTAMP
failed_at TIMESTAMP
created_at TIMESTAMP
updated_at TIMESTAMP
```

## 8. Query Examples

### Get user's current subscription

```sql
SELECT * FROM user_subscriptions
WHERE stripe_customer_id = 'cus_XXXXX'
ORDER BY created_at DESC
LIMIT 1;
```

### Get payment history

```sql
SELECT * FROM payments
WHERE stripe_subscription_id = 'sub_XXXXX'
ORDER BY created_at DESC;
```

### Get all active subscriptions

```sql
SELECT * FROM user_subscriptions
WHERE status = 'active'
ORDER BY created_at DESC;
```

## 9. Next Steps

1. Test webhook locally with Stripe CLI
2. Deploy to production
3. Update Stripe webhook endpoint to production URL
4. Monitor webhook deliveries in Stripe Dashboard
5. Add email notifications for payment events
6. Implement subscription management features
7. Add retry logic for failed operations

## Resources

- [Stripe Webhooks Docs](https://stripe.com/docs/webhooks)
- [Stripe CLI Docs](https://stripe.com/docs/stripe-cli)
- [Supabase Docs](https://supabase.com/docs)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
