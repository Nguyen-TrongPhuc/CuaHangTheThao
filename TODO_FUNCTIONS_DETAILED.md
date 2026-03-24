# TODO_FUNCTIONS_DETAILED.md - CHỨC NĂNG ĐẦY ĐỦ NHÂN VIÊN VÀ ADMIN (Kể cả THỐNG KÊ Chi Tiết)

## **I. NHÂN VIÊN (Staff - role "staff") - Tất cả quyền isEmployeeOrAdmin**

### **1. Dashboard - THỐNG KÊ CƠ BẢN** (api/dashboard/\*):

1. **Tóm tắt chính**:
   - Số đơn mới hôm nay (count orders createdAt today).
   - User mới tháng (count customers createdAt month).
   - Đơn hủy tháng (count status='cancelled').

2. **Biểu đồ**:
   - Doughnut trạng thái đơn (% pending/shipping/delivered/completed/cancelled/return_requested/return_accepted/returned).

3. **Báo cáo nâng cao**:
   - **Top khách** (getTopCustomers(start/end, limit=10)): Tên/email/phone, totalSpent, orderCount (aggregate orders).
   - **Top sản phẩm** (getTopProductsByMonth(year/month/limit)): Hạng #1-#20, tên/hình, totalSold (đơn), totalQuantity (SL bán) từ order_items.
   - **Low stock** (getLowStockProducts(threshold=10)): Sản phẩm tồn ≤10 (sum variants.stock), chi tiết variant (size_name/color_name/stock).
   - **Sync stock**: Fix lệch stock vs sum variants.stock (set min 0).

### **2. Quản lý dữ liệu CRUD**:

- **Sản phẩm** (ProductManager): Tạo/sửa (name/price/images/variants[stock/size/color])/xóa/filter/đếm số sản phẩm.
- Categories, Sports, Colors, Sizes, Fields: Tạo/sửa/xóa/danh sách đầy đủ.

### **3. Đơn hàng**:

- **Đơn hàng** (OrderManager): Xem all/filter payment_status, **update status** (pending/shipping/delivered/completed...), **payment_status** (unpaid/paid/pending/failed/refunded), xem chi tiết (subtotal/ship_fee/total_amount/return_reason/payment_method), **không xóa all**.
- OrderDetails: Xem/update quantity/price trong đơn.
- Reviews: Xem tất/reply reviews (/my-reviews cho user).
- Payment: Tạo VNPay/Momo URL, check status/orderId.

### **4. Khách & Liên hệ**:

- **Khách hàng** (CustomerManager): CRUD, xem/edit totalSpent/customerRank (normal/gold...), **không xóa all**.
- **Liên hệ** (ContactManager): Filter all/unread/replied, markAsRead (unread → read), reply message, đếm unreadCount.

### **5. Kho & Hỗ trợ**:

- Kho (WarehouseManager): Xem receipts/items/total_amount/createdAt.
- Voucher: CRUD, stats sử dụng.
- Upload files.
- Shipping: GET shop info.
- Suppliers: Chỉ xem danh sách.

## **II. ADMIN (role "admin") - Tất cả Staff + ĐỘC QUYỀN**

### **1. Nhân sự** (EmployeeManager/EmployeeForm):

- CRUD đầy đủ: Tạo (full_name/admin_code/password mạnh: 8+ upper/lower/digit/special, hash bcrypt), filter name/role, update (đổi pass), **xóa all**, login (JWT 1h).

### **2. Nhà cung cấp & Kho**:

- **Suppliers**: CRUD đầy đủ (staff chỉ GET).
- **Warehouse**: **Import phiếu** (items[product_name/variant_desc/import_price/quantity], staff_name/total_amount), CRUD warehouse (staff chỉ xem).

### **3. Thống kê Kinh doanh Nâng cao (Dashboard_Advanced)**:

- **Doanh số & Lợi nhuận** (getMonthlySales(year)): Xem biểu đồ doanh thu, vốn nhập hàng và lợi nhuận gộp từng tháng.
- **Doanh thu ngắn hạn**: Xem tổng doanh thu tháng hiện tại, biểu đồ Line Chart doanh thu 7 ngày qua.
- **Báo cáo nhập kho** (getImportReport(start/end)): Xem chi tiết phiếu nhập kèm **giá nhập (vốn)** và tổng chi phí nhập hàng.

### **4. Quyền nâng cao**:

- **Xóa all** toàn bộ modules (products/categories/customers/orders...).
- Update shop config/shipping đầy đủ (staff ?).

**Sidebar menu đầy đủ cho cả 2 role**. **Test**: Backend `node create_admin.js`, run `npm start`, Frontend_Admin `npm run dev`, login localhost:5173.

File **TODO_FUNCTIONS_DETAILED.md** mới tạo với danh sách **siêu chi tiết từng chức năng + stats**. Hoàn thành 100%!
