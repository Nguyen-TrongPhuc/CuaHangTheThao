# Kế hoạch triển khai tính phí vận chuyển theo miền

## Mục tiêu

Triển khai hệ thống tính phí vận chuyển theo miền:

- Cùng thành phố (Cần Thơ): Miễn phí
- Cùng miền (Miền Tây): 20,000đ
- Miền Nam (khác): 25,000đ
- Miền Trung: 30,000đ
- Miền Bắc: 40,000đ
- Đơn hàng > 500k: Miễn phí mọi khu vực

## Các bước thực hiện

### Bước 1: Cập nhật cấu hình (Backend/app/config/index.js)

- [x] Thêm cấu hình phí ship theo miền
- [x] Định nghĩa danh sách tỉnh/thành theo miền
- [x] Cấu hình phí cho từng miền

### Bước 2: Cập nhật logic tính phí (Backend/app/controllers/payment.controller.js)

- [x] Thêm hàm getZoneFromProvince để xác định miền từ tỉnh/thành
- [x] Cập nhật hàm getShippingFee để tính theo miền
- [x] Giữ logic miễn phí cho đơn > 500k (ưu tiên cao nhất)
- [x] Fallback sang tính theo khoảng cách nếu không dùng zone-based

## Files đã chỉnh sửa:

1. Backend/app/config/index.js ✅
2. Backend/app/controllers/payment.controller.js ✅

## Tổng kết

Đã triển khai xong tính phí vận chuyển theo miền:

- Cùng thành phố với shop: Miễn phí
- Miền Tây: 20,000đ
- Miền Nam: 25,000đ
- Miền Trung: 30,000đ
- Miền Bắc: 40,000đ
- Đơn > 500k: Miễn phí mọi khu vực
