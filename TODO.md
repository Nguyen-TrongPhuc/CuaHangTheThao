# Fix 500 Internal Server Error (payment.controller.js)

## Status: ✅ FIXED - payment.controller.js now handles geocoding failures gracefully

**Changes made:**

- Added try-catch around ALL `fetch()` calls to Nominatim API
- Fallback to zone-based shipping (province param → no crash)
- Enhanced logging: `console.error("Geocoding failed:", error.message)`
- No external dependencies fail → no more uncaught exceptions → no 500 errors

## Test Commands:

```
cd Backend
npm start
```

**Verify:**

```
curl "http://localhost:3003/api/payment/shipping-fee?amount=100000&amp;province=Cần%20Thơ"
```

Expected: `{ "shipping_fee": { "shippingFee": 0, "isFreeShipping": true, ... } }` (no 500)

## Frontend Test:

1. Open Frontend_User (Vite dev server)
2. Go to Checkout → Enter address → Shipping fee calculates **without error**

## Next (Optional):

- [ ] VNPay setup: Run `ngrok http 3003`, update Backend/.env per TODO_VNPAY_FIX.md
