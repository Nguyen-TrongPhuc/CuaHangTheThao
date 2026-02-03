<template>
  <div class="page-container">
    <div class="header">
      <h1>Quản lý Đơn hàng</h1>
    </div>

    <table class="admin-table">
      <thead>
        <tr>
          <th>Mã đơn</th>
          <th>Khách hàng</th>
          <th>Tổng tiền</th>
          <th>Ngày tạo</th>
          <th>Trạng thái</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="orders.length === 0"><td colspan="6" style="text-align: center;">Chưa có đơn hàng nào</td></tr>
        <tr v-for="order in orders" :key="order._id">
          <td>{{ order._id }}</td>
          <td>{{ order.customer_id || 'Khách vãng lai' }}</td>
          <td>{{ order.total_amount?.toLocaleString() }} đ</td>
          <td>{{ new Date(order.createdAt).toLocaleString() }}</td>
          <td>
            <select :value="order.status" @change="updateStatus(order._id, $event)">
                <option value="pending">Chờ xử lý</option>
                <option value="shipping">Đang giao</option>
                <option value="completed">Hoàn thành</option>
                <option value="cancelled">Đã hủy</option>
            </select>
          </td>
          <td>
            <button class="btn-del" @click="remove(order._id)">Xóa</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import OrderService from "@/services/orders.service";
import { showToast } from "@/utils/toast";

export default {
  data() { return { orders: [] }; },
  methods: {
    async loadData() {
      this.orders = await OrderService.getAll();
    },
    async updateStatus(id, event) {
        try {
            const newStatus = event.target.value;
            await OrderService.updateStatus(id, newStatus);
            showToast("Cập nhật trạng thái thành công!", "success");
            await this.loadData(); // Tải lại để đồng bộ dữ liệu
        } catch (error) {
            showToast("Lỗi cập nhật trạng thái", "error");
        }
    },
    async remove(id) {
      if (confirm("Bạn có chắc muốn xóa đơn hàng này?")) {
        try {
          await OrderService.delete(id);
          await this.loadData(); // Đợi tải xong dữ liệu mới
          showToast("Xóa thành công!", "success");
        } catch (e) { showToast("Xóa thất bại!", "error"); }
      }
    }
  },
  mounted() { this.loadData(); }
};
</script>

<style scoped>
.header { margin-bottom: 20px; }
.admin-table { width: 100%; border-collapse: collapse; background: white; }
.admin-table th, .admin-table td { border: 1px solid #dee2e6; padding: 12px; text-align: left; }
.btn-del { color: #e74c3c; cursor: pointer; border: none; background: none; }
select { padding: 5px; border-radius: 4px; border: 1px solid #ccc; }
</style>