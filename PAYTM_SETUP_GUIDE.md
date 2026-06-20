# PayTM Payment Setup Guide - BlockStop

## 🎯 Quick Overview

Your personal PayTM wallet is connected to BlockStop for **fully automated payment verification**:

```
User scans QR → Pays ₹299 → PayTM notifies BlockStop → JWT token issued → User gets access ✅
```

No manual verification needed!

---

## 📋 Prerequisites

You already have:
- ✅ Personal PayTM account/wallet
- ✅ Bank account linked to PayTM

You need to get:
- ⏳ PayTM Merchant Key (for webhook verification)
- ⏳ Configure webhook URL in PayTM

---

## 🔧 Step 1: Get PayTM Merchant Credentials

### From PayTM App:

1. Open **PayTM App**
2. Tap **Profile** → **Settings** → **Developer/API**
3. Look for **Merchant ID** and **API Key**
4. Copy both values

### Store in `.env.local`:

```bash
PAYTM_MERCHANT_ID=your_merchant_id_here
PAYTM_MERCHANT_KEY=your_api_key_here
```

---

## 🔗 Step 2: Configure Webhook URL in PayTM

### In PayTM Dashboard/App:

1. Go to **Settings** → **Webhooks** or **Notifications**
2. Add webhook URL:
   ```
   https://your-blockstop-domain.com/api/webhooks/paytm
   ```
3. Select events: **Payment Success**, **Payment Failed**
4. **Save**

### Testing Webhook (Optional):

```bash
# Send test webhook to verify setup
curl -X POST https://your-domain.com/api/webhooks/paytm \
  -H "Content-Type: application/json" \
  -d '{
    "TXNID": "test123",
    "ORDERID": "user1_pro_1234567890",
    "EMAIL": "user@example.com",
    "TXNAMOUNT": "299",
    "STATUS": "TXN_SUCCESS",
    "CHECKSUMHASH": "..."
  }'
```

---

## 🎟️ Step 3: Get Your PayTM QR Code

### From PayTM App:

1. Open **PayTM App**
2. Tap **Request Money** or **My QR Code**
3. Select **Dynamic QR** (for variable amounts)
4. **Screenshot** the QR code
5. Save as `HelloQR.jpg`

This is the QR code users will scan to pay! 

---

## 💳 Step 4: How Payment Flow Works

### User Journey:

```
1. User clicks "Upgrade" on BlockStop
2. Selects plan (NEO: ₹99, PRO: ₹299, etc.)
3. Clicks "Proceed to Payment"
4. QR code modal appears
5. User opens PayTM app
6. User scans QR code
7. Enters amount (₹299, ₹99, etc.)
8. Taps "Pay"
9. Payment successful ✅

Behind the scenes:
10. PayTM sends webhook to BlockStop
11. BlockStop verifies signature
12. BlockStop verifies amount
13. BlockStop creates subscription
14. BlockStop issues JWT token
15. User auto-logged in with access ✅
```

### System Flow:

```
PayTM Webhook
    ↓
POST /api/webhooks/paytm
    ↓
PayTMWebhookHandler.handleWebhook()
    ↓
1. Verify HMAC-SHA256 signature
2. Check TXN_SUCCESS status
3. Parse order ID → get userId + tier
4. Verify amount matches tier price
5. Create subscription in DB
6. Issue JWT token
7. Return token
    ↓
User gets instant access ✅
```

---

## 🔐 Security Features

✅ **HMAC-SHA256 Signature Verification**
- PayTM signs webhook with your API key
- BlockStop verifies signature
- Prevents spoofed payments

✅ **Amount Verification**
- Checks payment matches tier price
- Prevents payment tampering

✅ **Order ID Parsing**
- Extracts userId & tier from order ID
- Links payment to correct user

✅ **Subscription Status Tracking**
- Tracks payment in database
- Renewal reminders possible
- Cancellation handling

---

## 📊 Tier Pricing Configuration

Configure in `lib/billing/paytm-webhook.ts`:

```typescript
const tierPrices: Record<string, number> = {
  neo: 99,        // ₹99/month
  pro: 299,       // ₹299/month
  office: 499,    // ₹499/month
  health: 599,    // ₹599/month
  max: 299,       // ₹299/month
};
```

Adjust amounts as needed!

---

## 🛠️ Troubleshooting

### "Webhook not being received"
- [ ] Check webhook URL is correct in PayTM settings
- [ ] Verify your domain is publicly accessible
- [ ] Check firewall allows POST requests
- [ ] Test endpoint: `GET /api/webhooks/paytm`

### "Signature verification failed"
- [ ] Verify PAYTM_MERCHANT_KEY in .env.local
- [ ] Ensure no extra spaces in key
- [ ] Key must match exactly from PayTM app

### "Amount mismatch error"
- [ ] Check tier prices in paytm-webhook.ts
- [ ] Verify user selected correct plan
- [ ] QR code should show correct amount before payment

### "Payment marked but no access granted"
- [ ] Check database subscription record created
- [ ] Verify JWT token issued
- [ ] Check token sent with API requests

---

## 📝 Monitoring & Logging

### Check Webhook Events:

```bash
# View recent webhook logs
tail -f /var/log/blockstop/webhooks.log

# Search for specific user
grep "user@example.com" /var/log/blockstop/webhooks.log

# Check for errors
grep "ERROR\|❌" /var/log/blockstop/webhooks.log
```

### Sample Log Output:

```
📥 PayTM Webhook received: TXN: TXN123456, ORDER: user1_pro_1234567890, AMOUNT: ₹299
✅ Payment verified successfully
✅ JWT Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🚀 Going Live

When ready to launch:

1. **Test with real payment** (use test amount like ₹1)
2. **Verify JWT token issued**
3. **Verify user has access to features**
4. **Monitor webhook logs** for first 24 hours
5. **Have support contact ready** for issues

---

## 💰 Payment Settlement

PayTM auto-deposits to your bank:

- **Frequency**: Daily (default) or Weekly
- **Schedule**: Usually by 2 PM next day
- **No action needed**: Fully automatic

### View in PayTM App:

1. PayTM App → Profile
2. Tap "Earnings" or "Payouts"
3. See payment history
4. See settlement schedule

---

## 📞 Support

**If webhook not working:**

1. Check firewall/proxy logs
2. Verify PAYTM_MERCHANT_KEY
3. Test endpoint manually with curl
4. Check application error logs

**PayTM Support:**
- Website: paytm.com/support
- Email: support@paytm.com
- Phone: 1860-888-0092

---

## ✅ Checklist

Before going live:

- [ ] PAYTM_MERCHANT_KEY in .env.local
- [ ] Webhook URL configured in PayTM
- [ ] PayTM QR code saved as HelloQR.jpg
- [ ] Test payment processed successfully
- [ ] JWT token received and verified
- [ ] User gained access to features
- [ ] Logs show successful payment + token
- [ ] Database subscription record created

**All set!** 🚀

---

**Status**: Ready for automated payment verification
**Last updated**: 2026-06-20
**Version**: 1.0.0

