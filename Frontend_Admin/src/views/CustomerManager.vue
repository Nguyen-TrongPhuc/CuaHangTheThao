<template>
  <div class="customer-page">
    <div class="header">
      <h1>Quản lý Khách hàng</h1>
    </div>

    <table class="admin-table">
      <thead>
        <tr>
          <th>Họ tên</th>
          <th>Email</th>
          <th>Số điện thoại</th>
          <th>Địa chỉ</th>
          <th>Hạng VIP</th>
          <th>Tổng chi</th>
          <th>Lịch sử</th>
          <th v-if="userRole === 'admin'">Thao tác</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="customer in customers" :key="customer._id">
          <td>{{ customer.last_name }} {{ customer.first_name }}</td>
          <td>{{ customer.email }}</td>
          <td>{{ customer.phone }}</td>
          <td>{{ customer.address }}</td>
          <td>
            <span class="rank-badge" :class="getRankClass(customer)">
              {{ getRankLabel(customer) }}
            </span>
          </td>
          <td>
            <span class="spent">{{ formatMoney(customer.totalSpent || 0) }}</span>
          </td>
          <td>
            <button class="btn-history" @click="viewHistory(customer)">Xem</button>
          </td>
          <td v-if="userRole === 'admin'">
            <button class="btn-edit" @click="editLoyalty(customer._id)">Chỉnh</button>
            <button class="btn-del" @click="deleteCustomer(customer._id)">Xóa</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Modal Lịch sử mua sắm -->
    <div v-if="showHistoryModal" class="modal-overlay" @click.self="closeHistoryModal">
      <div class="modal-content history-modal">
        <div class="modal-header">
          <h3>Lịch sử mua sắm - {{ selectedCustomer?.last_name }} {{ selectedCustomer?.first_name }}</h3>
          <button class="close-btn" @click="closeHistoryModal">&times;</button>
        </div>
        <div class="modal-body">
          <div v-if="isLoadingHistory" style="text-align: center; padding: 20px;">Đang tải dữ liệu...</div>
          <table v-else-if="customerOrders.length > 0" class="admin-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Ngày đặt</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="o in customerOrders" :key="o._id">
                <td>#{{ o._id.slice(-6).toUpperCase() }}</td>
                <td>{{ new Date(o.createdAt).toLocaleString('vi-VN') }}</td>
                <td style="color: #e74c3c; font-weight: bold;">{{ formatMoney(o.total_amount) }}</td>
                <td>{{ getOrderStatus(o.status) }}</td>
              </tr>
            </tbody>
          </table>
          <div v-else style="text-align: center; padding: 20px; color: #777;">Khách hàng chưa có đơn hàng nào.</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import CustomerService from "@/services/customer.service";
import OrderService from "@/services/orders.service";
import { showToast } from "@/utils/toast";

export default {
  data() {
    return {
      userRole: localStorage.getItem("user_role") || "staff",
      customers: [],
      showHistoryModal: false,
      selectedCustomer: null,
      customerOrders: [],
      isLoadingHistory: false
    };
  },
  methods: {
    formatMoney(amount) {
      return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
    },
    getRankLabel(customer) {
      const rank = customer.customerRank || 'normal';
      const labels = { normal: 'Thường', silver: 'Bạc', gold: 'Vàng' };
      return labels[rank] || 'Thường';
    },
    getRankClass(customer) {
      const rank = customer.customerRank || 'normal';
      return `rank-${rank}`;
    },
    getOrderStatus(status) {
      const map = {
        'pending': 'Chờ xử lý',
        'shipping': 'Đang giao',
        'delivered': 'Đã giao',
        'completed': 'Hoàn thành',
        'cancelled': 'Đã hủy',
        'return_requested': 'Yêu cầu trả hàng',
        'return_accepted': 'Đồng ý trả hàng',
        'returned': 'Đã trả hàng'
      };
      return map[status] || status;
    },
    async loadLoyaltyInfo() {
      for (let customer of this.customers) {
        try {
          const loyalty = await CustomerService.getLoyalty(customer._id);
          customer.totalSpent = loyalty.totalSpent;
          customer.customerRank = loyalty.customerRank;
        } catch (e) {
          customer.totalSpent = 0;
          customer.customerRank = 'normal';
        }
      }
    },
    async editLoyalty(id) {
      const totalSpent = prompt('Nhập tổng chi tiêu mới (đ):', '');
      if (totalSpent === null) return;
      
      const amount = parseFloat(totalSpent.replace(/,/g, ''));
      if (isNaN(amount) || amount < 0) {
        showToast('Số tiền không hợp lệ!', 'error');
        return;
      }
      
      try {
        await CustomerService.updateLoyalty(id, { totalSpent: amount });
        await this.retrieveCustomers();
        await this.loadLoyaltyInfo();
        showToast('Cập nhật thành công!', 'success');
      } catch (error) {
        showToast('Cập nhật thất bại!', 'error');
      }
    },
    async retrieveCustomers() {
      try {
        this.customers = await CustomerService.getAll();
        await this.loadLoyaltyInfo();
      } catch (error) {
        console.log(error);
      }
    },
    async deleteCustomer(id) {
      if (confirm("Bạn muốn xóa khách hàng này?")) {
        try {
          await CustomerService.delete(id);
          await this.retrieveCustomers();
          showToast("Xóa thành công!", "success");
        } catch (error) {
          console.log(error);
          showToast("Xóa thất bại!", "error");
        }
      }
    },
    async viewHistory(customer) {
      this.selectedCustomer = customer;
      this.showHistoryModal = true;
      this.isLoadingHistory = true;
      try {
        const allOrders = await OrderService.getAll();
        this.customerOrders = allOrders.filter(o => String(o.customer_id) === String(customer._id));
      } catch (error) {
        showToast("Lỗi tải lịch sử đơn hàng", "error");
      } finally {
        this.isLoadingHistory = false;
      }
    },
    closeHistoryModal() {
      this.showHistoryModal = false;
      this.selectedCustomer = null;
      this.customerOrders = [];
    }
  },
  mounted() {
    this.retrieveCustomers();
  },
};
</script>

<style scoped>
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.admin-table { width: 100%; border-collapse: collapse; background: white; }
.admin-table th, .admin-table td { border: 1px solid #dee2e6; padding: 12px; text-align: left; }
.btn-del { color: #e74c3c; margin-left: 10px; cursor: pointer; border: none; background: none; }

.rank-badge { padding: 4px 8px; border-radius: 12px; font-size: 0.85em; font-weight: bold; }
.rank-normal { background: #f0f0f0; color: #666; }
.rank-silver { background: linear-gradient(135deg, #c0c0c0, #e0e0e0); color: #333; }
.rank-gold { background: linear-gradient(135deg, #ffd700, #ffed4a); color: #b8860b; box-shadow: 0 2px 4px rgba(255,215,0,0.3); }
.spent { font-family: monospace; color: #27ae60; }
.btn-edit { color: #3498db; cursor: pointer; border: none; background: none; margin-right: 5px; }
.btn-history { background: #f0f2f5; color: #3498db; border: 1px solid #ddd; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.85em; transition: 0.2s; font-weight: bold; }
.btn-history:hover { background: #3498db; color: white; border-color: #3498db; }

/* Modal Styles */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
.modal-content { background: white; border-radius: 8px; width: 700px; max-width: 90%; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 4px 15px rgba(0,0,0,0.2); animation: slideIn 0.3s; }
.history-modal { max-width: 800px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; border-bottom: 1px solid #eee; }
.modal-header h3 { margin: 0; color: #2c3e50; }
.close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #999; }
.close-btn:hover { color: #333; }
.modal-body { padding: 20px; overflow-y: auto; flex: 1; }
@keyframes slideIn { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
</style>
