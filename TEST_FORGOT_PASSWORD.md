# 🧪 Hướng dẫn Test: Quên Mật Khẩu (OTP)

## 📋 Quy trình:

```
1️⃣  Nhập đúng EMAIL
        ↓
   Hệ thống kiểm tra email tồn tại?
        ↓
   ✅ CÓ → Tạo OTP (6 số), lưu vào DB
        ↓
   📧 Gửi OTP qua Email
        ↓
2️⃣  Người dùng nhận được OTP
        ↓
   Nhập OTP vào form
        ↓
3️⃣  Kiểm tra OTP:
        ✅ OTP đúng + Chưa hết hạn (5 phút)
        ↓
   → Cho phép nhập mật khẩu mới
        ↓
   → Lưu mật khẩu mới, xóa OTP
        ↓
   → Đăng nhập với mật khẩu mới ✅
```

---

## 🔍 Các Test Case:

### Test 1: Email không tồn tại

```
📧 Email: nonexistent@gmail.com
❌ Kết quả mong đợi: "Email không tồn tại trong hệ thống"
Backend console: "Email không tồn tại: nonexistent@gmail.com"
```

### Test 2: Email tồn tại, gửi OTP thành công

```
📧 Email: customer@gmail.com (account đã đăng ký)
✅ Kết quả mong đợi: "Mã OTP đã được gửi thành công!"

🔍 Kiểm tra Backend Console:
✅ "📧 Tạo OTP cho customer@gmail.com: 123456"
✅ "⏰ OTP hết hạn lúc: [time]"
✅ "✅ OTP gửi thành công tới customer@gmail.com"

📧 Kiểm tra Email Inbox: Nên nhận được email với mã OTP
```

### Test 3: Nhập sai OTP

```
🔑 OTP từ email: 123456
Nhập: 654321 (sai)

❌ Kết quả mong đợi: "❌ Mã OTP không chính xác"

🔍 Backend Console:
"❌ OTP sai! Nhập: 654321, Đúng: 123456"
```

### Test 4: OTP hết hạn (> 5 phút)

```
⏰ Gửi OTP lúc: 10:00:00
⏰ Thử nhập lúc: 10:05:01 (hơn 5 phút)

❌ Kết quả mong đợi: "❌ Mã OTP đã hết hạn (5 phút)"

🔍 Backend Console:
"❌ OTP đã hết hạn"
```

### Test 5: Nhập đúng OTP, đổi mật khẩu thành công

```
🔑 OTP từ email: 123456
Nhập: 123456 ✅

🔒 Mật khẩu mới: Password@123
Xác nhận: Password@123

✅ Kết quả mong đợi:
- "✅ Đặt lại mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới."
- Tự động đi tới trang login
- Có thể đăng nhập với mật khẩu mới

🔍 Backend Console:
✅ "🔍 Kiểm tra reset password cho email: customer@gmail.com"
✅ "OTP nhập vào: 123456, OTP lưu: 123456"
✅ "✅ OTP chính xác, tiếp tục đổi mật khẩu"
✅ "✅ Đổi mật khẩu thành công cho email: customer@gmail.com"
```

### Test 6: Mật khẩu mới yếu

```
🔒 Mật khẩu mới: 123456 (yếu)

⚠️ Kết quả mong đợi:
"⚠️ Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt."

✅ Mật khẩu hợp lệ: Password@123
```

### Test 7: Mật khẩu xác nhận không khớp

```
🔒 Mật khẩu mới: Password@123
Xác nhận: Password@124 (không khớp)

❌ Kết quả mong đợi: "❌ Mật khẩu xác nhận không khớp!"
```

---

## 🛠️ Cách Debug:

### Cách 1: Xem Backend Console

```bash
1. Mở Terminal Backend (npm start)
2. Khi gửi OTP: Nên thấy log chi tiết
   ✅ "📧 Tạo OTP cho email@gmail.com: 123456"
   ✅ "✅ OTP gửi thành công tới email@gmail.com"
3. Khi submit reset password:
   ✅ "🔍 Kiểm tra reset password cho email: email@gmail.com"
   ✅ "OTP nhập vào: 123456, OTP lưu: 123456"
   ✅ "✅ OTP chính xác, tiếp tục đổi mật khẩu"
   ✅ "✅ Đổi mật khẩu thành công cho email: email@gmail.com"
```

### Cách 2: Xem Frontend Console (F12)

```javascript
1. Bước 1: Nhập email → Click "Gửi mã OTP"
   Nên thấy: "📧 Gửi OTP tới: email@gmail.com"
   Nên thấy: "✅ Chuyển sang bước 2"

2. Bước 2: Nhập OTP + Mật khẩu → Click "Đổi mật khẩu"
   Nên thấy: "🔐 Bắt đầu reset password"
   Nên thấy: "📡 Gửi request reset password..."
   Nên thấy: "✅ Chuyển hướng sang trang login"
```

### Cách 3: Kiểm tra MongoDB

```bash
# Sau khi gửi OTP, kiểm tra document customer:
db.customers.findOne({ email: "customer@gmail.com" })

# Nên thấy:
{
  email: "customer@gmail.com",
  otp: "123456",              ← Mã OTP 6 số
  otp_expiry: ISODate("..."), ← Thời gian hết hạn
  ...
}

# Sau khi đổi mật khẩu thành công, nên thấy:
{
  email: "customer@gmail.com",
  otp: null,          ← Xóa OTP
  otp_expiry: null,   ← Xóa thời gian hết hạn
  ...
}
```

---

## 📌 Checklist:

- [ ] ✅ Email tồn tại → Gửi OTP thành công
- [ ] ❌ Email không tồn tại → Báo lỗi
- [ ] ✅ OTP đúng + Chưa hết hạn → Cho phép đổi mật khẩu
- [ ] ❌ OTP sai → Báo lỗi
- [ ] ❌ OTP hết hạn → Báo lỗi
- [ ] ✅ Mật khẩu mới hợp lệ → Đổi thành công
- [ ] ❌ Mật khẩu yếu → Báo lỗi
- [ ] ❌ Mật khẩu không khớp → Báo lỗi
- [ ] ✅ Có thể đăng nhập với mật khẩu mới

---

## 🎯 Tóm tắt lôgic:

1. **forgotPassword** (gửi OTP):
   - Kiểm tra email tồn tại
   - Tạo OTP (6 số)
   - Lưu OTP + thời gian hết hạn vào DB
   - Gửi OTP qua email

2. **resetPassword** (xác thực OTP):
   - Kiểm tra email tồn tại
   - **Kiểm tra OTP nhập vào = OTP lưu**
   - **Kiểm tra OTP chưa hết hạn**
   - Cập nhật mật khẩu mới
   - Xóa OTP khỏi DB
   - Cho phép đăng nhập với mật khẩu mới

---

**Nếu có vấn đề, hãy cung cấp:**

1. Thông báo lỗi từ Frontend
2. Log từ Backend Console
3. Tên email test
