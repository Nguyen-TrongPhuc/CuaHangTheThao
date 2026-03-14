# HƯỚNG DẪN FIX VNPAY - SportStore

## ✅ CẤU HÌNH VNPAY SANDBOX (ĐÃ CÓ)

```
TMN_CODE: 0NT9SYND
HASH_SECRET: UHJ4LWPL4I33HFOYXLXHQTJFCQI6VCPF
URL: https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
```

## 🚀 BƯỚC 1: CÀI NGROK (URL CÔNG KHAI)

```
npm install -g ngrok
ngrok http 3003
```

**Copy URL ngrok** (ví dụ: `https://abc123.ngrok-free.app`)

## 📝 BƯỚC 2: TẠO Backend/.env

```
# Copy nội dung này vào Backend/.env (thay YOUR_NGROK bằng URL thật)
PORT=3003
BASE_URL=https://YOUR_NGROK.ngrok-free.app
VNPAY_TMNCODE=0NT9SYND
VNPAY_HASHSECRET=UHJ4LWPL4I33HFOYXLXHQTJFCQI6VCPF
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=https://YOUR_NGROK.ngrok-free.app/payment-result

# Các biến khác (giữ nguyên)
MONGODB_URI=mongodb://127.0.0.1:27017/SportStore
JWT_SECRET=sportstore_secret_key
# ... (copy từ .env.example)
```

## 🔗 BƯỚC 3: ĐĂNG KÝ VỚI VNPAY

1. https://sandbox.vnpayment.vn/merchantv2/
2. Login: sportstore1508@gmail.com
3. **Website Management** → Thêm:
   - Website URL: `https://YOUR_NGROK.ngrok-free.app`
   - Callback URL: `https://YOUR_NGROK.ngrok-free.app/api/payment/vnpay/callback`

## ▶️ BƯỚC 4: TEST

```
cd Backend
npm start  # Backend port 3003
```

Frontend → Checkout → Chọn VNPAY → **KHÔNG CÒN LỖI**

## ✅ KẾT QUẢ MONG ĐỢI

- Thanh toán VNPAY hoạt động
- Callback tự động cập nhật đơn hàng `payment_status: 'paid'`
- Hệ thống loyalty (total_spent) hoạt động

**GỬI NGROK URL ĐỂ TÔI HOÀN THIỆN .env!**
