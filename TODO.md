# TODO: Xây dựng hệ thống khách hàng thân thiết (VIP)

## Mốc hạng VIP (dựa totalSpent - tổng doanh thu đơn delivered)

- Thường: 0đ → 0%
- Bạc: 10,000,000đ+ → 5% giảm tất cả sản phẩm
- Vàng: 50,000,000đ+ → 10% giảm tất cả sản phẩm

## Các bước triển khai (✅ hoàn thành đánh dấu)

### 1. Backend Customer (3 files) ✅ [Hoặc pending nếu lỗi]

- [ ] Backend/app/services/customer.service.js: + totalSpent, customerRank; hàm addTotalSpent(), updateRank()
- [ ] Backend/app/controllers/customers.controller.js: + /loyalty GET/PUT
- [ ] Backend/app/routes/customers.route.js: + route /loyalty

### 2. Backend Orders + Products (2 files)

- [ ] Backend/app/services/orders.service.js: update 'delivered' → add totalSpent + updateRank
- [ ] Backend/app/services/products.service.js: + priceVIP dựa rank (API getProducts(?customerId))

### 3. Frontend Admin (2 files)

- [ ] Frontend_Admin/src/services/customer.service.js: + getLoyalty(), updateLoyalty()
- [ ] Frontend_Admin/src/views/CustomerManager.vue: + cột totalSpent/rank, modal edit

### 4. Frontend User (5 files)

- [ ] Frontend_User/src/services/products.service.js: getProductsVIP(customerId)
- [ ] Frontend_User/src/services/customer.service.js: + getLoyalty()
- [ ] Frontend_User/src/views/Profile.vue: + section VIP info
- [ ] Frontend_User/src/views/Cart.vue: Áp giá VIP
- [ ] Frontend_User/src/views/Checkout.vue: Áp giá VIP + subtotalVIP

### 5. Test & Deploy

- [ ] Test flow: Order delivered → totalSpent up → rank → giá VIP frontend
- [ ] Migrate DB: Update customers set totalSpent=0, customerRank='normal'
- [ ] Restart Backend + Frontend
- [ ] ✅ Hoàn thành toàn bộ

**Lưu ý**: Sau mỗi bước lớn, test API bằng Postman/VSCode REST.

**Next**: Bắt đầu Backend customer.service.js
