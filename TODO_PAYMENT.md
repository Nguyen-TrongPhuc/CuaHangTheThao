# Payment System Enhancement TODO

## Backend - ✅ COMPLETED

- [x] 1. Update config/index.js - Add shipping & payment config
- [x] 2. Create shipping utility (app/utils/shipping.util.js)
- [x] 3. Create VNPAY payment utility (app/utils/vnpay.util.js)
- [x] 4. Update orders.service.js - Add shipping_fee, payment_status fields
- [x] 5. Create payment controller (app/controllers/payment.controller.js)
- [x] 6. Create payment routes (app/routes/payment.route.js)
- [x] 7. Register payment routes in app.js

## Frontend User - ✅ COMPLETED

- [x] 8. Update Checkout.vue - Add shipping fee calculation
- [x] 9. Update Checkout.vue - Add more payment methods (MoMo, Bank Transfer)
- [x] 10. Update Checkout.vue - Handle VNPAY redirect
- [x] 11. Create PaymentResult.vue - Handle payment callback

## Frontend Admin - ✅ COMPLETED

- [x] 12. Update orders.service.js - Add delete method
- [x] 13. Update OrderManager.vue - Show shipping fee, payment method, payment status

## Additional - ✅ COMPLETED

- [x] 14. Update router for new payment result page
- [x] 15. Update User Orders.vue - Show payment info

---

## Features Implemented:

### Shipping:

- Free shipping for orders over 500,000 VND
- Standard shipping fee: 30,000 VND
- Express shipping fee: 50,000 VND

### Payment Methods:

- COD (Cash on Delivery)
- VNPAY (Online payment) ✅ FIXED
- MoMo (Wallet)
- Bank Transfer

### Order Management:

- Shipping fee display in orders
- Payment method display
- Payment status tracking (unpaid/paid/pending/failed)
- Order details modal in admin panel

## 🆕 VNPAY TESTING GUIDE (FIX "timer is not defined" ERROR):

1. **Setup credentials:**

   ```
   cd Backend
   cp .env.example .env
   # Edit .env with your VNPay sandbox TMNCode & HashSecret
   ```

2. **Expose backend publicly (ngrok):**

   ```
   npm install -g ngrok  # or download from ngrok.com
   cd Backend
   npm start             # Backend runs on port 3003
   # New terminal:
   ngrok http 3003
   # Copy ngrok URL: https://abc.ngrok-free.app
   ```

3. **Temporary config update (Backend/app/config/index.js):**

   ```
   vnpay: {
     returnUrl: "https://abc.ngrok-free.app/api/payment/vnpay/callback",
     ...
   }
   ```

4. **Test:**
   - Frontend: http://localhost:5173/checkout
   - Select VNPay → should redirect to sandbox without JS error
   - After payment → auto-redirect to PaymentResult.vue

5. **Production:** Deploy backend to public domain, update returnUrl.

**"timer is not defined" = VNPay sandbox bug + localhost callback. Fixed with public URL!**
