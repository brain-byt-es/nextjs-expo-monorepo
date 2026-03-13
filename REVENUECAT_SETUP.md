# RevenueCat Setup Guide

RevenueCat handles in-app purchases for iOS and Android, as well as Stripe integration.

## Overview

RevenueCat provides:
- **Apple StoreKit** support for iOS subscriptions
- **Google Play Billing** support for Android subscriptions
- **Stripe** integration for web payments
- Unified webhook system
- Analytics and subscription management

## Prerequisites

1. **RevenueCat Account** - Sign up at [revenuecat.com](https://www.revenuecat.com)
2. **Apple Developer Account** - For iOS apps
3. **Google Play Console** - For Android apps
4. **Expo Project** - This template includes it

## 1. Create RevenueCat Project

1. Go to [RevenueCat Dashboard](https://app.revenuecat.com)
2. Create a new project (or app)
3. Set platform to **iOS and Android**
4. Copy your **Public API Key** to `.env.local`:
   ```
   EXPO_PUBLIC_REVENUECAT_API_KEY=appl_YourKeyHere
   ```

## 2. Configure Products/Packages

### Create Entitlements

Entitlements represent access levels (like "pro" or "premium"):

1. Go to **Products → Entitlements**
2. Create entitlements:
   - `pro` - Professional plan
   - `premium` - Premium plan
   - `lifetime` - Lifetime access

### Create Products

Products are the actual subscription offers:

1. Go to **Products → Products**
2. Create for each platform:

   **iOS (App Store)**:
   - Create products in App Store Connect first
   - Link them in RevenueCat
   - Example IDs: `monthly_pro`, `annual_pro`

   **Android (Google Play)**:
   - Create products in Google Play Console first
   - Link them in RevenueCat
   - Example IDs: `monthly_pro`, `annual_pro`

### Create Packages

Packages bundle products into offerings:

1. Go to **Products → Packages**
2. Create packages:
   - `monthly` - Maps to monthly product
   - `annual` - Maps to annual product
   - `lifetime` - Maps to lifetime product

## 3. Configure App Stores

### iOS Setup

1. In RevenueCat: **Settings → Apps → iOS**
2. Set **App Bundle ID** (e.g., `com.myapp.mobile`)
3. Get **Shared Secret** from App Store Connect:
   - App Store Connect → Apps → Your App → In-App Purchases → View Shared Secret
4. Paste shared secret in RevenueCat

### Android Setup

1. In RevenueCat: **Settings → Apps → Android**
2. Set **Package Name** (e.g., `com.myapp.mobile`)
3. Get **Google Play Billing Key** from Google Play Console:
   - Google Play Console → Settings → API Access → Create Service Account
   - Download JSON key file
4. Upload in RevenueCat

## 4. SDK Integration

### Installation

```bash
cd apps/mobile
pnpm add @revenuecat/react-native-purchases
```

### Initialize in App

```tsx
import { useEffect } from 'react'
import { initializeRevenueCat, setUserID } from '@/lib/revenue-cat'
import { useSession } from '@/lib/auth-client'

export default function App() {
  const { data: session } = useSession()

  useEffect(() => {
    // Initialize RevenueCat on app start
    initializeRevenueCat()
  }, [])

  useEffect(() => {
    // Set user ID when authenticated
    if (session?.user?.id) {
      setUserID(session.user.id)
    }
  }, [session])

  return (
    // Your app...
  )
}
```

### Show Paywall

```tsx
import { getOfferings, purchasePackage } from '@/lib/revenue-cat'

export function UpgradeScreen() {
  const [offerings, setOfferings] = useState(null)

  useEffect(() => {
    const loadOfferings = async () => {
      const data = await getOfferings()
      setOfferings(data)
    }
    loadOfferings()
  }, [])

  const handlePurchase = async (packageId: string) => {
    try {
      await purchasePackage(packageId)
      // Success! Refresh subscription status
    } catch (error) {
      console.error('Purchase failed:', error)
    }
  }

  return (
    <View>
      {offerings?.current?.availablePackages.map(pkg => (
        <Button
          key={pkg.identifier}
          onPress={() => handlePurchase(pkg.identifier)}
        >
          {pkg.product.title}
        </Button>
      ))}
    </View>
  )
}
```

## 5. Webhook Setup

### Configure Webhook

1. In RevenueCat: **Settings → Integrations → Webhooks**
2. Create new webhook:
   - URL: `https://yourdomain.com/api/webhooks/revenuecat`
   - Select events to listen to

### Webhook Events

The SDK handles these events:

- `INITIAL_PURCHASE` - First subscription purchase
- `RENEWAL` - Subscription renewal
- `CANCELLATION` - User canceled subscription
- `BILLING_ISSUE` - Payment failed
- `PRODUCT_CHANGE` - User upgraded/downgraded plan
- `TRANSFER` - Subscription transferred between stores

Each event updates the `mobile_subscriptions` table in Supabase.

## 6. Testing

### Using Sandbox Accounts

**iOS**:
```bash
# In Xcode, set Sandbox mode
# Add test user in App Store Connect
# Log in with test account on device
```

**Android**:
```bash
# Add test account in Google Play Console
# Account Settings → License Testing
# Add your Google account as test user
```

### Test Purchase Flow

```tsx
import { purchasePackage } from '@/lib/revenue-cat'

// Simulate purchase
const result = await purchasePackage('monthly')
console.log('Purchase successful:', result)
```

## 7. Database Schema

### mobile_subscriptions

```
id: UUID
revenuecat_user_id: TEXT (unique)
product_id: TEXT
store: TEXT (apple, google, stripe)
status: TEXT (active, canceled, payment_failed)
auto_resume_date: TIMESTAMP
expiration_date: TIMESTAMP
purchase_date: TIMESTAMP
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

### mobile_payments

```
id: UUID
revenuecat_user_id: TEXT
transaction_id: TEXT
product_id: TEXT
amount: BIGINT (cents)
currency: TEXT
store: TEXT
status: TEXT
receipt_data: JSONB
```

## 8. Common Issues

### "RevenueCat API key not set"

**Solution**: Add `EXPO_PUBLIC_REVENUECAT_API_KEY` to `.env.local`

### Purchases not syncing

**Solution**:
1. Check webhook configuration
2. Verify Supabase tables created (run migrations)
3. Check RevenueCat dashboard for webhook errors

### Sandbox vs Production

**For Testing**:
- Use sandbox accounts
- Products won't charge real money
- Webhooks still fire

**For Production**:
- Remove debug logging
- Set proper entitlement IDs
- Test with real test accounts first

## 9. Stripe Integration with RevenueCat

RevenueCat can also integrate with Stripe for web payments:

1. In RevenueCat: **Settings → Integrations → Stripe**
2. Connect your Stripe account
3. RevenueCat will sync web/mobile subscriptions

This creates a unified subscription system across all platforms!

## 10. Query Examples

```sql
-- Get active mobile subscriptions
SELECT * FROM mobile_subscriptions
WHERE status = 'active'
ORDER BY updated_at DESC;

-- Get payment history
SELECT * FROM mobile_payments
WHERE revenuecat_user_id = 'user_123'
ORDER BY purchased_at DESC;

-- Get failing subscriptions
SELECT * FROM mobile_subscriptions
WHERE status = 'payment_failed';
```

## 11. Next Steps

1. Create RevenueCat account and configure products
2. Set iOS/Android up in app stores
3. Test with sandbox accounts
4. Deploy webhooks to production
5. Monitor subscriptions in RevenueCat dashboard
6. Optional: Integrate Stripe for web-mobile parity

## Resources

- [RevenueCat Docs](https://docs.revenuecat.com)
- [React Native SDK](https://docs.revenuecat.com/docs/react-native)
- [Webhooks](https://docs.revenuecat.com/docs/webhooks)
- [Analytics](https://docs.revenuecat.com/docs/analytics)
- [Best Practices](https://docs.revenuecat.com/docs/best-practices)
