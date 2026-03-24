# TODO_FUNCTIONS.md - CHỨC NĂNG THEO ROLE NHÂN VIÊN (Staff) VÀ QUẢN LÝ (Admin)

## ✅ CHỨC NĂNG CỦA NHÂN VIÊN (Staff) - Quyền `isEmployeeOrAdmin`

### 1. Dashboard (Thống kê Cơ bản)

- Tóm tắt trạng thái đơn hàng (Đơn mới, Đơn hủy), Khách hàng mới.
- Sản phẩm bán chạy (Top products), Cảnh báo sắp hết hàng (Low stock).

### 2. Sản phẩm & Config (CRUD)

- Sản phẩm (variants), Danh mục, Thể thao, Màu sắc, Size, Fields.

### 3. Đơn hàng & TT

- Xem/filter/update status/payment đơn hàng (không xóa all).
- Order details (update SL/giá), Reviews (xem/reply), Payment (check).

### 4. Khách & Liên hệ

- CRUD khách (loyalty/totalSpent), Liên hệ (filter/read/reply).

### 5. Kho, Voucher & Khác

- Xem phiếu nhập kho (không hiển thị giá vốn), GET NCC, Xem Voucher, Upload, Shipping GET.

## ✅ CHỨC NĂNG CỦA QUẢN LÝ/ADMIN - Quyền `isAdmin` + Tất cả Staff

### 1. Nhân sự (Độc quyền)

- CRUD nhân viên đầy đủ (tạo admin_code/pass, filter role/name, xóa all).

### 2. Nhà cung cấp & Kho (Nâng cao)

- CRUD NCC đầy đủ.
- Import kho (WarehouseImport), CRUD warehouse.

### 3. Dashboard Nâng cao (Bảo mật kinh doanh)

- Xem Doanh thu tổng (ngày/tháng/năm), Lợi nhuận gộp (Profit).
- Báo cáo nhập kho chi tiết (kèm giá vốn/import price).

### 4. Thêm quyền

- Xóa all ở hầu hết modules (orders, customers, products...).
- Update shop config/shipping đầy đủ.

**Tổng**: Staff ~18 modules vận hành, Admin +3 độc quyền (HR/NCC/Import). File tại `TODO_FUNCTIONS.md`. Test: `node Backend/create_admin.js` → login Admin panel.

Task hoàn thành với TODO được update chia rõ role.
