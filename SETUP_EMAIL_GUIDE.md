# 📧 Hướng dẫn cấu hình Email Gmail để quên mật khẩu

## ❌ Lỗi hiện tại

```
534-5.7.9 Application-specific password required
```

## ✅ Cách khắc phục

### 1️⃣ Bật 2-Step Verification (nếu chưa bật)

- Truy cập: https://myaccount.google.com/security
- Tìm mục **"2-Step Verification"** → Click **"Enable"**
- Làm theo hướng dẫn của Google

### 2️⃣ Tạo App Password

- Truy cập: https://myaccount.google.com/apppasswords
- Chọn **App**: `Mail`
- Chọn **Device**: `Windows Computer` (hoặc loại máy bạn dùng)
- Google sẽ cấp mật khẩu 16 ký tự (không có dấu cách)
- **Copy mật khẩu này**

### 3️⃣ Cập nhật `.env`

```env
MAIL_USER=SportStore1508@gmail.com
MAIL_PASSWORD=xxxx xxxx xxxx xxxx
```

- Thay `xxxx xxxx xxxx xxxx` bằng mật khẩu ứng dụng vừa lấy được
- Xóa tất cả dấu cách: `xxxxxxxxxxxxxx`

### 4️⃣ Khởi động lại Backend

```bash
npm start
```

### 5️⃣ Test quên mật khẩu

- Vào trang Login
- Click "Quên mật khẩu"
- Nhập email → Click "Gửi"
- Kiểm tra Terminal Backend xem có ✅ "Gửi email thành công" không
- Check email Inbox để xác nhận

---

## 🔐 Lưu ý bảo mật

- **Không commit `.env` lên GitHub** (đã có trong `.gitignore`)
- App Password chỉ dùng riêng cho ứng dụng này
- Nếu bị lộ, hãy xóa App Password trong Google Account Security

## 📞 Nếu vẫn lỗi

- Kiểm tra lại MAIL_USER có đúng email không
- Verify transporter có thành công không (xem Terminal)
- Kiểm tra firewall/antivirus có chặn SMTP không (port 587)
