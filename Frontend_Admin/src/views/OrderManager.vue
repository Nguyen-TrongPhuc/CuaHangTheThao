<template>
  <div class="order-page">
    <div class="header">
      <h1>Quản lý Đơn hàng</h1>
    </div>
    <table class="admin-table">
      <thead>
        <tr>
          <th>Mã đơn</th>
          <th>Ngày đặt</th>
          <th>Tổng tiền</th>
          <th>Trạng thái</th>
          <th>Thanh toán</th>
          <th>Chi tiết</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="order in orders" :key="order._id">
          <td>#{{ order._id.substring(0, 8) }}</td>
          <td>{{ new Date(order.order_date).toLocaleDateString('vi-VN') }}</td>
          <td>{{ formatCurrency(order.total_amount) }}</td>
          <td>
            <select v-model="order.status" @change="updateStatus(order)">
              <option value="pending">Chờ xử lý</option>
              <option value="shipped">Đang giao</option>
              <option value="delivered">Đã giao</option>
            </select>
          </td>
          <td>{{ order.payment_method }}</td>
          <td><button @click="viewDetail(order._id)">Xem</button></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
// Giả định bạn đã tạo OrderService tương tự ProductService
export default {
  data() {
    return {
      orders: []
    }
  },
  methods: {
    formatCurrency(value) {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    }
    // Viết thêm hàm updateStatus để cập nhật trạng thái đơn hàng
  }
}
</script>

<style scoped>
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.admin-table { width: 100%; border-collapse: collapse; background: white; }
.admin-table th, .admin-table td { border: 1px solid #dee2e6; padding: 12px; text-align: left; }
.btn-del { color: #e74c3c; margin-left: 10px; cursor: pointer; border: none; background: none; }
</style>