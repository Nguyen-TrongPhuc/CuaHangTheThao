# TODO - Tính tiền ship theo khoảng cách

## Plan:

1. [x] Đọc và phân tích các file liên quan
2. [x] Cập nhật Backend payment.controller.js - Thêm geocoding API
3. [x] Cập nhật Frontend payment.service.js - Thêm parameters cho address
4. [x] Cập nhật Frontend Checkout.vue - Gửi địa chỉ đầy đủ
5. [ ] Test và kiểm tra

## Chi tiết:

- Tích hợp Nominatim (OpenStreetMap) API cho geocoding miễn phí
- Tính khoảng cách bằng Haversine formula
- Cấu hình shop: Cần Thơ (lat: 10.0299337, lng: 105.7706153)
- Phí ship: 20,000đ base + 2,000đ/km
- Miễn phí trong 5km hoặc đơn >500k

## Cách hoạt động:

1. Frontend gửi: province, district, ward, street lên Backend
2. Backend gọi Nominatim API để geocode địa chỉ -> lấy tọa độ
3. Backend tính khoảng cách từ shop đến địa chỉ khách hàng
4. Backend tính phí ship: baseShippingFee + (distance \* perKmFee)
5. Trả về kết quả bao gồm: shippingFee, distance, message, estimatedTime
