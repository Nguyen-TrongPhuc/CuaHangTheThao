<template>
  <div class="page-container">
    <div class="header">
      <h1>Quản lý Đơn hàng</h1>
      <button class="btn-export" @click="handleExport" style="background: #217346; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.2); transition: 0.3s;">
        <i class="fa-solid fa-file-excel"></i> Xuất Excel
      </button>
    </div>

    <div class="toolbar">
      <select v-model="filterPaymentStatus" class="filter-select">
        <option value="">Tất cả trạng thái thanh toán</option>
        <option value="paid">Đã thanh toán</option>
        <option value="unpaid">Chưa thanh toán (Online)</option>
        <option value="pending">Chờ thanh toán (COD)</option>
        <option value="failed">Thất bại</option>
      </select>
      <input type="date" v-model="filterStartDate" class="filter-date" title="Từ ngày" />
      <input type="date" v-model="filterEndDate" class="filter-date" title="Đến ngày" />
    </div>

    <table class="admin-table">
      <thead>
        <tr>
          <th>Mã đơn</th>
          <th>Khách hàng</th>
          <th>Tổng tiền</th>
          <th>Phí vận chuyển</th>
          <th>Phương thức TT</th>
          <th>Trạng thái TT</th>
          <th>Ngày tạo</th>
          <th>Trạng thái đơn</th>
          <th>Người duyệt</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="filteredOrders.length === 0"><td colspan="9" style="text-align: center;">Không tìm thấy đơn hàng nào</td></tr>
        <tr v-for="order in filteredOrders" :key="order._id">
          <td class="order-id">{{ order._id }}</td>
          <td>
            <div class="customer-info">
              <strong>{{ order.name }}</strong>
              <span>{{ order.phone }}</span>
              <span class="address">{{ order.address }}</span>
            </div>
          </td>
          <td class="amount">{{ formatPrice(order.total_amount) }}đ</td>
          <td>{{ formatPrice(order.shipping_fee || 0) }}đ</td>
          <td>
            <span class="payment-method" :class="order.payment_method">
              {{ getPaymentMethodName(order.payment_method) }}
            </span>
          </td>
          <td>
            <select :value="order.payment_status" @change="updatePaymentStatus(order._id, $event)" class="status-select" :class="order.payment_status" :disabled="['paid', 'failed', 'refunded'].includes(order.payment_status) || ['cancelled', 'returned'].includes(order.status)" :title="(['paid', 'failed', 'refunded'].includes(order.payment_status) || ['cancelled', 'returned'].includes(order.status)) ? 'Trạng thái thanh toán ở mức cuối không thể thay đổi' : ''">
                <option value="unpaid">Chưa thanh toán</option>
                <option value="paid">Đã thanh toán</option>
                <option value="pending">Chờ thanh toán</option>
                <option value="failed">Thất bại</option>
                <option value="refunded">Đã hoàn tiền</option>
            </select>
          </td>
          <td>{{ new Date(order.createdAt).toLocaleString() }}</td>
          <td>
            <select :value="order.status" @change="updateStatus(order._id, $event)" class="status-select" :disabled="['completed', 'cancelled', 'returned'].includes(order.status)" :title="['completed', 'cancelled', 'returned'].includes(order.status) ? 'Đơn hàng ở trạng thái cuối không thể thay đổi' : ''">
                <option value="pending">Chờ xử lý</option>
                <option value="shipping">Đang giao</option>
                <option value="delivered">Đã giao</option>
                <option value="completed">Hoàn thành</option>
                <option value="cancelled">Đã hủy</option>
                <option value="return_requested">Yêu cầu trả hàng</option>
                <option value="return_accepted">Chấp nhận trả hàng</option>
                <option value="returned">Đã trả hàng</option>
            </select>
            <div v-if="order.status === 'return_requested' && order.return_reason" class="return-reason">
               Lý do: {{ order.return_reason }}
            </div>
          </td>
          <td>
            <span class="employee-name" v-if="order.employee?.full_name">{{ order.employee.full_name }}</span>
            <span style="color: #999; font-size: 0.85em;" v-else>Hệ thống</span>
          </td>
          <td>
            <button class="btn-view" @click="viewOrderDetails(order)" title="Xem chi tiết">
              <i class="fa-solid fa-eye"></i>
            </button>
            <button class="btn-del" @click="confirmRemove(order._id)">Xóa</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Order Details Modal -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Chi tiết đơn hàng</h3>
          <div class="modal-actions" style="display: flex; align-items: center; gap: 15px;">
            <button class="btn-export-modal" @click="exportSingleOrder(selectedOrder)"><i class="fa-solid fa-file-excel"></i> Xuất Excel</button>
            <button class="btn-close" @click="closeModal">&times;</button>
          </div>
        </div>
        <div class="modal-body" v-if="selectedOrder">
          <div class="order-detail-grid">
            <div class="detail-section">
              <h4>Thông tin khách hàng</h4>
              <p><strong>Tên:</strong> {{ selectedOrder.name }}</p>
              <p><strong>Điện thoại:</strong> {{ selectedOrder.phone }}</p>
              <p><strong>Địa chỉ:</strong> {{ selectedOrder.address }}</p>
              <p v-if="selectedOrder.note"><strong>Ghi chú:</strong> {{ selectedOrder.note }}</p>
            </div>
            <div class="detail-section">
              <h4>Thanh toán</h4>
              <p><strong>Phương thức:</strong> {{ getPaymentMethodName(selectedOrder.payment_method) }}</p>
              <p><strong>Trạng thái TT:</strong> {{ getPaymentStatusName(selectedOrder.payment_status) }}</p>
              <p><strong>Tạm tính:</strong> {{ formatPrice(selectedOrder.subtotal || (selectedOrder.total_amount - (selectedOrder.shipping_fee || 0) + (selectedOrder.discount_amount || 0) + (selectedOrder.wallet_discount || 0))) }}đ</p>
              <p><strong>Phí vận chuyển:</strong> {{ formatPrice(selectedOrder.shipping_fee || 0) }}đ</p>
              <p v-if="selectedOrder.discount_amount > 0"><strong>Voucher giảm:</strong> -{{ formatPrice(selectedOrder.discount_amount) }}đ</p>
              <p v-if="selectedOrder.wallet_discount > 0"><strong>Ví tích lũy:</strong> -{{ formatPrice(selectedOrder.wallet_discount) }}đ</p>
              <p><strong>Tổng cộng:</strong> <span class="total">{{ formatPrice(selectedOrder.total_amount) }}đ</span></p>
            </div>
          </div>
          <div class="detail-section">
            <h4>Sản phẩm</h4>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Giá</th>
                  <th>Số lượng</th>
                  <th>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in selectedOrder.items" :key="idx">
                  <td>
                    <div class="item-name">{{ item.product_name }}</div>
                  </td>
                  <td>{{ formatPrice(item.unit_price) }}đ</td>
                  <td>{{ item.quantity }}</td>
                  <td>{{ formatPrice(item.unit_price * item.quantity) }}đ</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirm Delete Modal -->
    <div v-if="deleteConfirmId" class="modal-overlay" @click.self="deleteConfirmId = null">
      <div class="confirm-dialog">
        <div class="confirm-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
        <h3>Xác nhận xóa</h3>
        <p>Bạn có chắc chắn muốn xóa đơn hàng này? Hành động này không thể hoàn tác.</p>
        <div class="confirm-actions">
          <button class="btn-cancel-modal" @click="deleteConfirmId = null">Hủy</button>
          <button class="btn-confirm-delete" @click="executeDelete">Xóa</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import OrderService from "@/services/orders.service";
import { showToast } from "@/utils/toast";
import { exportOrdersToExcel } from "@/utils/excel";

export default {
  data() { 
    return { 
      orders: [],
      showModal: false,
      selectedOrder: null,
      filterPaymentStatus: "",
      filterStartDate: "",
      filterEndDate: "",
      deleteConfirmId: null
    }; 
  },
  computed: {
    filteredOrders() {
      let result = this.orders;
      
      if (this.filterPaymentStatus) {
        result = result.filter(order => order.payment_status === this.filterPaymentStatus);
      }
      
      if (this.filterStartDate) {
        const start = new Date(this.filterStartDate).setHours(0, 0, 0, 0);
        result = result.filter(order => new Date(order.createdAt).getTime() >= start);
      }
      
      if (this.filterEndDate) {
        const end = new Date(this.filterEndDate).setHours(23, 59, 59, 999);
        result = result.filter(order => new Date(order.createdAt).getTime() <= end);
      }
      
      return result;
    }
  },
  methods: {
    getEmployeeId() {
        try {
            const token = localStorage.getItem("admin_token");
            if (token) {
                const decoded = JSON.parse(atob(token.split('.')[1]));
                return decoded.userId || decoded.id || decoded._id;
            }
        } catch (e) {
            console.error("Lỗi lấy ID nhân viên:", e);
        }
        return null;
    },
    async loadData() {
      this.orders = await OrderService.getAll();
    },
    async updateStatus(id, event) {
            const newStatus = event.target.value;
            const order = this.orders.find(o => o._id === id);
            if (!order) return;
            
            const originalStatus = order.status;
            
            // Chặn việc chọn lùi trạng thái ngay tại Frontend để không gọi API
            if (['shipping', 'delivered', 'completed'].includes(originalStatus) && newStatus === 'pending') {
                showToast("Không thể lùi trạng thái đơn hàng đã xuất kho về Chờ xử lý.", "warning");
                event.target.value = originalStatus; // Tự động búng thanh Select về trạng thái cũ
                return;
            }

            try {
            const updatedOrder = await OrderService.update(id, { 
                status: newStatus, 
                payment_status: order.payment_status || 'paid',
                employee_id: this.getEmployeeId()
            });
            showToast("Cập nhật trạng thái thành công!", "success");
            // Tải lại dữ liệu để lấy tên người duyệt mới nhất
            await this.loadData();
        } catch (error) {
            const msg = error.response?.data?.message || "Lỗi cập nhật trạng thái";
            showToast(msg, "error");
            event.target.value = originalStatus; // Phục hồi giao diện hiển thị cũ nếu có lỗi mạng
        }
    },
    confirmRemove(id) {
        this.deleteConfirmId = id;
    },
    async executeDelete() {
        if (!this.deleteConfirmId) return;
        try {
          await OrderService.delete(this.deleteConfirmId);
          await this.loadData();
          showToast("Xóa thành công!", "success");
        } catch (e) { showToast("Xóa thất bại!", "error"); }
        finally { this.deleteConfirmId = null; }
    },
    formatPrice(value) {
        return new Intl.NumberFormat('vi-VN').format(value || 0);
    },
    getPaymentMethodName(method) {
        const methods = {
            'cod': 'COD',
            'vnpay': 'VNPAY',
            'momo': 'MoMo',
            'bank_transfer': 'Chuyển khoản'
        };
        return methods[method] || method || 'COD';
    },
    getPaymentStatusName(status) {
        const statuses = {
            'unpaid': 'Chưa thanh toán',
            'paid': 'Đã thanh toán',
            'pending': 'Chờ thanh toán',
            'failed': 'Thất bại',
            'refunded': 'Đã hoàn tiền'
        };
        return statuses[status] || status || 'Chưa thanh toán';
    },
    viewOrderDetails(order) {
        this.selectedOrder = order;
        this.showModal = true;
    },
    closeModal() {
        this.showModal = false;
        this.selectedOrder = null;
    },
    async updatePaymentStatus(id, event) {
            const newStatus = event.target.value;
            const order = this.orders.find(o => o._id === id);
            if (!order) return;
            const originalPaymentStatus = order.payment_status;
            try {
            const updatedOrder = await OrderService.update(id, { 
                payment_status: newStatus,
                status: order.status || 'delivered',
                employee_id: this.getEmployeeId()
            });
            showToast("Cập nhật trạng thái thanh toán thành công!", "success");
            // Tải lại dữ liệu để lấy tên người duyệt mới nhất
            await this.loadData();
        } catch (error) {
            showToast("Lỗi cập nhật trạng thái thanh toán", "error");
            event.target.value = originalPaymentStatus; // Phục hồi giao diện hiển thị cũ nếu có lỗi mạng
        }
    },
    handleExport() {
      if (this.filteredOrders.length === 0) {
        showToast("Không có dữ liệu để xuất!", "error");
        return;
      }
      exportOrdersToExcel(this.filteredOrders);
    },
    exportSingleOrder(order) {
      if (!order) return;
      exportOrdersToExcel([order]);
    }
  },
  mounted() { this.loadData(); }
};
</script>

<style scoped>
.page-container { padding: 20px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.header h1 { margin: 0; color: #2c3e50; }
.btn-export:hover { background: #1e6b3e !important; transform: translateY(-1px); box-shadow: 0 4px 10px rgba(0,0,0,0.3); }

.admin-table { width: 100%; border-collapse: collapse; background: white; }
.admin-table th, .admin-table td { border: 1px solid #dee2e6; padding: 12px; text-align: left; vertical-align: top; }
.admin-table th { background: #f8f9fa; font-weight: 600; }
.order-id { font-size: 0.85em; max-width: 120px; word-break: break-all; }

.customer-info { display: flex; flex-direction: column; }
.customer-info strong { color: #333; }
.customer-info span { font-size: 0.85rem; color: #666; }
.customer-info .address { font-size: 0.8rem; color: #888; margin-top: 3px; }

.amount { font-weight: bold; color: #e74c3c; }

.payment-method { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 0.85rem; }
.payment-method.cod { background: #e3f2fd; color: #1976d2; }
.payment-method.vnpay { background: #fce4ec; color: #c2185b; }
.payment-method.momo { background: #f3e5f5; color: #7b1fa2; }
.payment-method.bank_transfer { background: #e8f5e9; color: #388e3c; }

.payment-status { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 0.85rem; }
.payment-status.unpaid { background: #fff3e0; color: #f57c00; }
.payment-status.paid { background: #e8f5e9; color: #388e3c; }
.payment-status.pending { background: #e3f2fd; color: #1976d2; }
.payment-status.failed { background: #ffebee; color: #d32f2f; }

.status-select { padding: 5px; border-radius: 4px; border: 1px solid #ccc; font-weight: 500; }
/* Thêm màu cho select payment status */
.status-select.unpaid { background: #fff3e0; color: #f57c00; }
.status-select.paid { background: #e8f5e9; color: #388e3c; }
.status-select.pending { background: #e3f2fd; color: #1976d2; }
.status-select.failed { background: #ffebee; color: #d32f2f; }
.status-select.refunded { background: #fbe9e7; color: #d84315; }

.employee-name { background: #e8f4f8; color: #2980b9; padding: 4px 8px; border-radius: 4px; font-size: 0.85em; font-weight: bold; white-space: nowrap; }

.return-reason { font-size: 0.85em; color: #d35400; margin-top: 5px; font-style: italic; }

.btn-view { color: #1976d2; cursor: pointer; border: none; background: none; margin-right: 10px; font-size: 1.1rem; }
.btn-del { color: #e74c3c; cursor: pointer; border: none; background: none; }

/* Modal styles */
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-content { background: white; border-radius: 8px; max-width: 800px; width: 90%; max-height: 90vh; overflow-y: auto; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px; border-bottom: 1px solid #eee; }
.modal-header h3 { margin: 0; }
.btn-export-modal { background: #217346; color: white; padding: 8px 12px; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9rem; transition: 0.2s; display: flex; align-items: center; gap: 6px; }
.btn-export-modal:hover { background: #1e6b3e; }
.btn-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; }
.modal-body { padding: 20px; }

.order-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
.detail-section { background: #f8f9fa; padding: 15px; border-radius: 6px; }
.detail-section h4 { margin: 0 0 10px; color: #333; }
.detail-section p { margin: 5px 0; color: #555; }
.detail-section .total { font-weight: bold; color: #e74c3c; font-size: 1.1rem; }

.items-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
.items-table th, .items-table td { border: 1px solid #dee2e6; padding: 10px; text-align: left; }
.items-table th { background: #f8f9fa; }
.item-name { font-weight: 500; }

.toolbar { margin-bottom: 20px; }
.filter-select { padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; min-width: 250px; font-size: 1rem; }
.filter-date { padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem; margin-left: 10px; cursor: pointer; }

/* Confirm Modal */
.confirm-dialog { background: white; padding: 30px; border-radius: 12px; width: 400px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.2); animation: modalFadeIn 0.3s ease; }
@keyframes modalFadeIn { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
.confirm-icon { font-size: 3.5rem; color: #e74c3c; margin-bottom: 15px; }
.confirm-dialog h3 { margin-top: 0; color: #2c3e50; font-size: 1.5rem; }
.confirm-dialog p { color: #666; margin-bottom: 25px; line-height: 1.5; font-size: 1.05rem;}
.confirm-actions { display: flex; justify-content: center; gap: 15px; }
.confirm-actions button { padding: 12px 25px; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; transition: 0.2s; font-size: 1rem; }
.btn-cancel-modal { background: #f1f3f5; color: #495057; border: 1px solid #ddd; }
.btn-cancel-modal:hover { background: #e2e6ea; }
.btn-confirm-delete { background: #e74c3c; color: white; }
.btn-confirm-delete:hover { background: #c0392b; transform: translateY(-2px); box-shadow: 0 4px 10px rgba(231, 76, 60, 0.3);}
</style>
