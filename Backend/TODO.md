# VNPay Fix Plan - SportStore

## ✅ Step 1: Backend Setup (Complete)
- [x] Create Backend/.env with VNPay config
- [x] Update Backend/app/config/index.js 
- [x] Backend payment.controller.js & vnpay.util.js OK

## 🔄 Step 2: Ngrok Setup (User Action Required)
```
1. Download ngrok: https://ngrok.com/download
2. Terminal: ngrok http 3003
3. Copy URL: https://abc.ngrok-free.app → Update .env VNPAY_RETURN_URL
```

## 🔧 Step 3: Frontend Fix (AI will do)
- [ ] Frontend_User/src/views/PaymentResult.vue - Add DB status check
- [ ] Frontend_User/src/router/index.js - Payment result route

## 🧪 Step 4: Test Flow
1. Backend running (npm start)
2. Frontend Vite running
3. Checkout → VNPay → Success ✓ payment_status='paid'
4. Frontend shows \"Thanh toán thành công\"

## 📝 Current Status: Waiting ngrok URL from user
