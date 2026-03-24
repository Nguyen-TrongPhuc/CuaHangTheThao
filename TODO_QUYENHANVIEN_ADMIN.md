# 📋 TODO - DANH SÁCH ĐẦY ĐỦ QUYỀN NHÂN VIÊN VÀ ADMIN (Tiếng Việt)

Dựa trên **toàn bộ codebase** SportStore, đây là **danh sách 100%** quyền quản lý:

## **I. NHÂN VIÊN (Staff) & ADMIN**

**`(isEmployeeOrAdmin)` - 18 modules vận hành + thống kê**

### **1. 🗒️ BẢNG ĐIỀU KHIỂN - THỐNG KÊ CHI TIẾT**

```
✅ Tóm tắt: Doanh thu tháng / Đơn mới hôm nay / Khách mới / Đơn hủy
✅ Biểu đồ: Doanh thu 7 ngày / Tỷ lệ trạng thái đơn (8 loại)
✅ Báo cáo:
   • Doanh số 12 tháng + LỢI NHUẬN gộp
   • Top 10 khách hàng (tên/email/chi tiêu/số đơn)
   • Top 20 sản phẩm bán chạy/tháng (hạng #1 / SL bán)
   • Hàng tồn thấp (≤10): chi tiết size/màu
   • Báo cáo nhập kho (SP/NV/SL/giá/total)
   • Đồng bộ kho tự động
```

### **2. 📦 QUẢN LÝ SẢN PHẨM & CẤU HÌNH** (CRUD)

```
✅ Sản phẩm: Tạo/sửa variants[stock/size/màu]/xóa/tìm kiếm
✅ Danh mục / Môn thể thao / Màu sắc / Kích cỡ / Sân bãi
✅ Voucher: Tạo/sửa/xóa + thống kê sử dụng
```

### **3. 🛒 ĐƠN HÀNG & THANH TOÁN**

```
✅ Đơn hàng: Lọc/trạng thái(pending/giao/hoàn thành...)/thanh toán
✅ Chi tiết đơn: Sửa SL/giá / Lý do trả hàng
✅ Đánh giá: Xem/trả lời review khách
✅ Thanh toán: Kiểm tra VNPay/MoMo
```

### **4. 👥 KHÁCH HÀNG & LIÊN HỆ**

```
✅ Khách: CRUD / Loyalty / Tổng chi tiêu
✅ Liên hệ: Lọc(đọc/chưa)/Trả lời/Đánh dấu đã đọc
```

### **5. 🏪 KHO & HỖ TRỢ**

```
✅ Kho: Xem phiếu nhập / Items / Tổng tiền
✅ Nhà cung cấp: Xem danh sách
✅ Upload ảnh / Shipping info
```

## **II. 🔥 CHỈ ADMIN - ĐỘC QUYỀN**

**`(isAdmin)` - 3 modules quản trị cao cấp**

### **1. 👨‍💼 NHÂN SỰ**

```
✅ Tạo: Tên/mã/password mạnh/SDT/role(staff/admin)
✅ Lọc: Tên/vai trò / Sửa pass / Xóa single/ALL
✅ Đăng nhập JWT (1h)
```

### **2. 🚚 NHÀ CUNG CẤP & KHO**

```
✅ NCC: CRUD đầy đủ
✅ Nhập kho: Tạo phiếu [SP/biến thể/giá/SL/tổng/NV]
```

### **3. ⚡ SIÊU QUYỀN**

```
✅ XÓA TẤT CẢ: SP/khách/đơn/danh mục...
✅ Cấu hình shop/shipping zones
```

## **📱 MENU GIAO DIỆN** (Sidebar)

```
Bảng điều khiển → SP/ĐH/KH → Voucher → Danh mục/Sport/Màu/Size
→ Nhân viên/NCC → Kho/Liên hệ
```

## **🚀 CÁCH TEST**

```
cd Backend && node create_admin.js  # Tạo admin
cd Backend && npm start
cd Frontend_Admin && npm run dev     # localhost:5173 → Đăng nhập → Dashboard
```

**✅ TODO HOÀN THÀNH: Staff vận hành + Admin quản trị + Thống kê full!**
