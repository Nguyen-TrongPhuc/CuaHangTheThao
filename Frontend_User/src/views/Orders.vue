<template>
  <div class="page-wrapper">
    <AppHeader />
    <div class="container">
      <h1 class="page-title">Lịch sử đơn hàng</h1>

      <div v-if="isLoading" class="loading">Đang tải...</div>

      <div v-else-if="orders.length > 0" class="orders-list">
        <div v-for="order in orders" :key="order._id" class="order-card">
          <div class="order-header">
            <span class="order-id">Mã đơn: #{{ order._id.slice(-6).toUpperCase() }}</span>
            <span :class="['order-status', getStatusClass(order.status)]">
              {{ getStatusText(order.status) }}
            </span>
          </div>
          
          <!-- Danh sách sản phẩm trong đơn -->
          <div class="order-items-list">
            <div v-for="item in order.items" :key="item._id" class="order-item-row">
                <img :src="item.product_image || 'https://via.placeholder.com/60'" class="item-thumb" @click="goToProduct(item.product_id)" />
                <div class="item-details">
                    <div class="item-name" @click="goToProduct(item.product_id)">{{ item.product_name }}</div>
                    <div class="item-meta">
                        <span v-if="item.variant_size_id">Size: {{ getSizeName(item.variant_size_id) }}</span>
                        <span v-if="item.variant_size_id && item.variant_color_id"> - </span>
                        <span v-if="item.variant_color_id">Màu: {{ getColorName(item.variant_color_id) }}</span>
                    </div>
                    <div class="item-qty">x{{ item.quantity }}</div>
                </div>
                <div class="item-price-col">
                    <div class="item-unit-price">{{ formatPrice(item.unit_price) }}đ</div>
                </div>
                <div v-if="order.status === 'completed'" class="item-action">
                    <button class="btn-buy-again" @click.stop="goToProduct(item.product_id)">Mua lại</button>
                    <button v-if="!item.is_reviewed" class="btn-review" @click="openReviewModal(item, order)">Đánh giá</button>
                    <span v-else class="text-reviewed" style="display:inline-flex;align-items:center;gap:4px;">
                      <Check :size="14" /> Đã đánh giá
                    </span>
                </div>
            </div>
          </div>

          <div class="order-body">
            <p class="order-date">Ngày đặt: {{ formatDate(order.createdAt) }}</p>
            <p class="order-subtotal">Tổng tiền hàng: {{ formatPrice(order.subtotal) }}đ</p>
            <p class="order-shipping">Phí vận chuyển: {{ formatPrice(order.shipping_fee) }}đ</p>
            <p class="order-discount" v-if="order.discount_amount > 0">Giảm giá: <span class="discount-value">-{{ formatPrice(order.discount_amount) }}đ</span></p>
            <p class="order-payment">
              <span>Thanh toán: <strong>{{ getPaymentMethodName(order.payment_method) }}</strong></span>
              <span :class="['payment-status', order.payment_status]">{{ getPaymentStatusName(order.payment_status) }}</span>
            </p>
            <p class="order-info" v-if="order.name">Người nhận: {{ order.name }} ({{ order.phone }})</p>
            <p class="order-address">Địa chỉ: {{ order.address || 'Chưa cập nhật (Đơn hàng cũ)' }}</p>
          </div>

          <div class="order-total-row">
              Thành tiền: <span class="total-price">{{ formatPrice(order.total_amount) }}đ</span>
          </div>

          <div class="order-footer">
             <!-- Có thể thêm nút Xem chi tiết tại đây -->
             <span class="note" v-if="order.note">Ghi chú: {{ order.note }}</span>
             
             <div class="action-right">
                <button v-if="['vnpay', 'momo'].includes(order.payment_method) && order.payment_status === 'unpaid' && order.status === 'pending'" class="btn-pay-now" @click="retryPayment(order)">Thanh toán ngay</button>
                <button v-if="order.status === 'pending'" class="btn-cancel" @click="confirmCancel(order)">Hủy đơn</button>
                <button v-if="order.status === 'delivered'" class="btn-return" @click="openReturnModal(order)">Trả hàng</button>
                <button v-if="order.status === 'delivered'" class="btn-confirm-received" @click="confirmReceive(order)">Đã nhận hàng</button>
                <span v-if="order.status === 'return_requested'" class="text-warning">Đang chờ duyệt trả hàng...</span>
                <span v-if="order.status === 'return_accepted'" class="text-info">Đã đồng ý trả hàng. Vui lòng gửi hàng về shop.</span>
             </div>
          </div>
        </div>
      </div>

      <div v-else class="no-orders">
        <p>Bạn chưa có đơn hàng nào.</p>
        <router-link to="/" class="btn-shop">Mua sắm ngay</router-link>
      </div>
    </div>

    <!-- Modal Trả hàng -->
    <ReturnRequestModal 
      :isVisible="showReturnModal" 
      :orderId="selectedOrder?._id"
      @close="showReturnModal = false"
      @submit="handleReturnSubmit"
    />

    <!-- Modal Đánh giá -->
    <ReviewModal
      :isVisible="showReviewModal"
      :product="selectedProductForReview"
      :orderId="selectedOrderForReview?._id"
      @close="showReviewModal = false"
      @submit="handleReviewSubmit"
    />

    <!-- Action Confirm Modal -->
    <div v-if="confirmAction.show" class="modal-overlay" @click.self="closeConfirmModal">
      <div class="confirm-dialog">
        <div class="confirm-icon"><AlertCircle :size="48" :color="confirmAction.type === 'cancel' ? '#e74c3c' : '#27ae60'" /></div>
        <h3>{{ confirmAction.title }}</h3>
        <p>{{ confirmAction.message }}</p>
        <div class="confirm-actions">
          <button class="btn-cancel-modal" @click="closeConfirmModal">Hủy bỏ</button>
          <button :class="confirmAction.type === 'cancel' ? 'btn-confirm-danger' : 'btn-confirm-success'" @click="executeAction">Xác nhận</button>
        </div>
      </div>
    </div>
    <AppFooter />
  </div>
</template>

<script>
import OrderService from "@/services/orders.service";
import SizesService from "@/services/sizes.service";
import ColorsService from "@/services/colors.service";
import AppHeader from "@/components/AppHeader.vue";
import AppFooter from "@/components/AppFooter.vue";
import ReturnRequestModal from "@/components/ReturnRequestModal.vue";
import ReviewModal from "@/components/ReviewModal.vue";
import ReviewsService from "@/services/reviews.service";
import PaymentService from "@/services/payment.service";
import { showToast } from "@/utils/toast";
import { Check, AlertCircle } from "lucide-vue-next";

export default {
  components: { AppHeader, AppFooter, ReturnRequestModal, ReviewModal, Check, AlertCircle },
  data() {
    return {
      orders: [],
      sizes: [],
      colors: [],
      isLoading: true,
      showReturnModal: false,
      selectedOrder: null,
      showReviewModal: false,
      selectedProductForReview: null,
      selectedOrderForReview: null,
      confirmAction: {
        show: false,
        type: '', // 'receive' or 'cancel'
        order: null,
        title: '',
        message: ''
      }
    };
  },
  methods: {
    async fetchOrders() {
      try {
        // Tải dữ liệu đơn hàng và metadata (size, color) song song
        const [ordersData, sizesData, colorsData, reviewsData] = await Promise.all([
            OrderService.getHistory(),
            SizesService.getAll(),
            ColorsService.getAll(),
            ReviewsService.getMyReviews().catch(() => []) // Lấy danh sách đánh giá của user để kiểm tra
        ]);
        
        const reviews = Array.isArray(reviewsData) ? reviewsData : (reviewsData.data || []);

        // Map trạng thái đã đánh giá vào đơn hàng
        this.orders = ordersData.map(order => {
            if (order.items) {
                order.items.forEach(item => {
                    // Kiểm tra xem có đánh giá nào khớp với order_id và product_id không
                    const productId = item.product_id || item._id;
                    const isReviewed = reviews.some(r => 
                        String(r.order_id) === String(order._id) && 
                        String(r.product_id) === String(productId)
                    );
                    if (isReviewed) item.is_reviewed = true;
                });
            }
            return order;
        });

        this.sizes = sizesData;
        this.colors = colorsData;
      } catch (error) {
        console.error("Lỗi tải đơn hàng:", error);
        if (error.response && error.response.status === 401) {
          showToast("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", "error");
          this.$router.push("/login");
        }
      } finally {
        this.isLoading = false;
      }
    },
    formatPrice(value) {
      const num = Number(value);
      return new Intl.NumberFormat('vi-VN').format(isNaN(num) ? 0 : num);
    },
    formatDate(dateString) {
      return new Date(dateString).toLocaleString('vi-VN');
    },
    getStatusText(status) {
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
    getStatusClass(status) {
      const map = {
        'pending': 'status-pending',
        'shipping': 'status-shipped',
        'delivered': 'status-delivered',
        'completed': 'status-delivered',
        'cancelled': 'status-cancelled',
        'return_requested': 'status-pending',
        'return_accepted': 'status-delivered',
        'returned': 'status-returned'
      };
      return map[status] || '';
    },
    getSizeName(id) {
        const s = this.sizes.find(x => String(x._id) === String(id));
        return s ? s.name : '';
    },
    getColorName(id) {
        const c = this.colors.find(x => String(x._id) === String(id));
        return c ? c.name : '';
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
    confirmReceive(order) {
      this.confirmAction = {
        show: true,
        type: 'receive',
        order: order,
        title: 'Xác nhận nhận hàng',
        message: 'Bạn xác nhận đã nhận được hàng và muốn hoàn thành đơn hàng này?'
      };
    },
    confirmCancel(order) {
      this.confirmAction = {
        show: true,
        type: 'cancel',
        order: order,
        title: 'Xác nhận hủy đơn',
        message: 'Bạn có chắc chắn muốn hủy đơn hàng này không?'
      };
    },
    closeConfirmModal() {
      this.confirmAction.show = false;
      this.confirmAction.order = null;
    },
    async executeAction() {
      const order = this.confirmAction.order;
      if (!order) return;

      if (this.confirmAction.type === 'receive') {
        try {
          await OrderService.update(order._id, { status: 'completed' });
          order.status = 'completed';
          showToast("Cảm ơn bạn đã mua hàng!", "success");
        } catch (error) {
          showToast("Có lỗi xảy ra, vui lòng thử lại", "error");
        }
      } else if (this.confirmAction.type === 'cancel') {
        try {
          await OrderService.update(order._id, { status: 'cancelled' });
          order.status = 'cancelled';
          showToast("Đã hủy đơn hàng thành công", "success");
        } catch (error) {
          const msg = error.response?.data?.message || "Lỗi khi hủy đơn hàng";
          showToast(msg, "error");
          this.fetchOrders(); // Tải lại danh sách để cập nhật trạng thái mới nhất từ server
        }
      }
      this.closeConfirmModal();
    },
    async retryPayment(order) {
      try {
        showToast("Đang kết nối đến cổng thanh toán...", "info");
        if (order.payment_method === 'vnpay') {
            const res = await PaymentService.createVnpayPayment(order._id);
            if (res.paymentUrl) window.location.href = res.paymentUrl;
        } else if (order.payment_method === 'momo') {
            const res = await PaymentService.createMomoPayment(order._id);
            if (res.paymentUrl) window.location.href = res.paymentUrl;
        }
      } catch (e) {
        console.error(e);
        showToast("Không thể tạo kết nối thanh toán lúc này.", "error");
      }
    },
    openReturnModal(order) {
      this.selectedOrder = order;
      this.showReturnModal = true;
    },
    async handleReturnSubmit(reason) {
      if (!this.selectedOrder) return;
      
        try {
          await OrderService.update(this.selectedOrder._id, { 
            status: 'return_requested', 
            return_reason: reason 
          });
          
          // Cập nhật UI ngay lập tức
          this.selectedOrder.status = 'return_requested';
          this.selectedOrder.return_reason = reason;
          
          showToast("Đã gửi yêu cầu trả hàng. Vui lòng chờ duyệt.", "success");
          this.showReturnModal = false;
          this.selectedOrder = null;
        } catch (error) {
          showToast("Lỗi khi trả hàng", "error");
        }
    },
    openReviewModal(item, order) {
      if (item.is_reviewed) return;
        this.selectedProductForReview = item;
        this.selectedOrderForReview = order;
        this.showReviewModal = true;
    },
    async handleReviewSubmit(reviewData) {
        // Kiểm tra token trước khi submit
        if (!localStorage.getItem("user_token")) {
          showToast("Vui lòng đăng nhập để đánh giá!", "error");
          this.$router.push("/login");
          return;
        }
        try {
            await ReviewsService.create(reviewData);
            showToast("Đánh giá thành công! Bạn được cộng 100đ vào ví.", "success");
            
            // Cập nhật trạng thái đã đánh giá cho sản phẩm trong đơn hàng hiện tại
            if (this.selectedOrderForReview && this.selectedProductForReview) {
                const order = this.orders.find(o => o._id === this.selectedOrderForReview._id);
                if (order) {
                    const reviewProductId = this.selectedProductForReview.product_id || this.selectedProductForReview._id;
                    const item = order.items.find(i => (i.product_id || i._id) === reviewProductId);
                    if (item) item.is_reviewed = true;
                }
            }

            this.showReviewModal = false;
        } catch (error) {
            console.error(error);
            if (error.response?.status === 401) {
              showToast("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!", "error");
              localStorage.removeItem("user_token");
              this.$router.push("/login");
            } else {
              showToast("Lỗi khi gửi đánh giá", "error");
            }
        }
    },
    goToProduct(id) {
        if (id) {
            this.$router.push({ name: 'product.detail', params: { id: id } });
        }
    }
  },
  mounted() {
    this.fetchOrders();
  }
};
</script>

<style scoped>
.page-wrapper { display: flex; flex-direction: column; min-height: 100vh; background: #f5f7fa; }
.container { flex: 1; max-width: 800px; margin: 0 auto; padding: 40px 20px; width: 100%; }
.page-title { text-align: center; color: #2c3e50; margin-bottom: 30px; }

.order-card { background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); border-left: 5px solid #ccc; }
.order-header { display: flex; justify-content: space-between; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
.order-id { font-weight: bold; color: #555; }

.order-status { padding: 5px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: bold; text-transform: uppercase; }
.status-pending { background: #fff3cd; color: #856404; border-left-color: #ffc107; } /* Vàng */
.status-shipped { background: #e2e3e5; color: #383d41; } /* Xám/Tím */
.status-delivered { background: #d1ecf1; color: #0c5460; } /* Xanh lam nhạt - Đã giao */
.status-completed { background: #d4edda; color: #155724; } /* Xanh lá - Hoàn thành */
.status-cancelled { background: #f8d7da; color: #721c24; } /* Đỏ */
.status-returned { background: #e2e3e5; color: #383d41; border-left-color: #6c757d; } /* Xám - Trả hàng */

/* Border màu cho card tương ứng status */
.order-card:has(.status-pending) { border-left-color: #ffc107; }
.order-card:has(.status-delivered) { border-left-color: #17a2b8; }
.order-card:has(.status-completed) { border-left-color: #28a745; }
.order-card:has(.status-cancelled) { border-left-color: #dc3545; }
.order-card:has(.status-returned) { border-left-color: #6c757d; }

.order-items-list { border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 10px; }
.order-item-row { display: flex; align-items: center; margin-bottom: 10px; }
.item-thumb { width: 60px; height: 60px; object-fit: cover; border-radius: 4px; margin-right: 15px; border: 1px solid #eee; cursor: pointer; }
.item-details { flex: 1; }
.item-name { font-weight: 600; color: #333; font-size: 0.95rem; cursor: pointer; transition: color 0.2s; }
.item-name:hover { color: #007bff; }
.item-meta { font-size: 0.85rem; color: #777; margin-top: 2px; }
.item-qty { font-size: 0.85rem; color: #555; margin-top: 2px; }
.item-price-col { text-align: right; margin-left: 10px; min-width: 80px; }
.item-unit-price { font-weight: bold; color: #ee4d2d; }
.item-action { margin-left: 15px; display: flex; flex-direction: column; gap: 8px; align-items: flex-end; }
.btn-buy-again {
    background: #fff; border: 1px solid #ee4d2d; color: #ee4d2d;
    padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 0.85rem;
}
.btn-buy-again:hover { background: #ee4d2d; color: white; }
.btn-review {
    background: #fff; border: 1px solid #2980b9; color: #2980b9;
    padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 0.85rem;
}
.btn-review:hover { background: #2980b9; color: white; }
.text-reviewed { font-size: 0.85rem; color: #27ae60; font-weight: bold; }

.order-body p { margin: 5px 0; color: #444; font-size: 0.95rem; }
.order-total-row { text-align: right; padding: 15px 0; border-top: 1px dashed #eee; font-size: 1.1rem; color: #555; }
.order-total-row .total-price { font-size: 1.5rem; color: #ee4d2d; font-weight: bold; margin-left: 10px; }
.order-footer { font-size: 0.9rem; color: #777; font-style: italic; display: flex; justify-content: space-between; align-items: center; }

.discount-value { color: #28a745; font-weight: bold; }
.action-right { margin-left: auto; }
.btn-confirm-received, .btn-cancel, .btn-return, .btn-pay-now {
  background: linear-gradient(135deg, #28a745, #218838);
  color: white; border: none; padding: 8px 15px;
  border-radius: 20px; cursor: pointer; font-weight: bold;
  transition: 0.3s;
}
.btn-confirm-received:hover, .btn-cancel:hover, .btn-return:hover, .btn-pay-now:hover { transform: translateY(-2px); box-shadow: 0 2px 5px rgba(0,0,0,0.2); }

.btn-cancel { background: linear-gradient(135deg, #dc3545, #c82333); }
.btn-pay-now { background: linear-gradient(135deg, #007bff, #0056b3); margin-right: 10px; }
.btn-return { background: linear-gradient(135deg, #6c757d, #5a6268); margin-right: 10px; }

.text-warning { color: #d35400; font-weight: bold; font-size: 0.9rem; font-style: italic; }
.text-info { color: #17a2b8; font-weight: bold; font-size: 0.9rem; font-style: italic; }

.no-orders { text-align: center; margin-top: 50px; color: #777; }
.btn-shop { display: inline-block; margin-top: 15px; padding: 10px 20px; background: #2c3e50; color: white; text-decoration: none; border-radius: 20px; }

.order-payment { display: flex; align-items: center; gap: 10px; }
.payment-status { padding: 3px 8px; border-radius: 4px; font-size: 0.8rem; }
.payment-status.unpaid { background: #fff3e0; color: #f57c00; }
.payment-status.paid { background: #e8f5e9; color: #388e3c; }
.payment-status.pending { background: #e3f2fd; color: #1976d2; }
.payment-status.failed { background: #ffebee; color: #d32f2f; }

/* Confirm Modal */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; backdrop-filter: blur(2px); }
.confirm-dialog { background: white; padding: 30px; border-radius: 12px; width: 400px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.2); animation: modalFadeIn 0.3s ease; }
@keyframes modalFadeIn { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
.confirm-icon { margin-bottom: 15px; display: flex; justify-content: center; }
.confirm-dialog h3 { margin-top: 0; color: #2c3e50; font-size: 1.3rem; }
.confirm-dialog p { color: #666; margin-bottom: 25px; line-height: 1.5; font-size: 0.95rem;}
.confirm-actions { display: flex; justify-content: center; gap: 15px; }
.confirm-actions button { padding: 10px 20px; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; transition: 0.2s; font-size: 0.95rem; }
.btn-cancel-modal { background: #f1f3f5; color: #495057; border: 1px solid #ddd; }
.btn-cancel-modal:hover { background: #e2e6ea; }
.btn-confirm-danger { background: #e74c3c; color: white; }
.btn-confirm-danger:hover { background: #c0392b; transform: translateY(-2px); box-shadow: 0 4px 10px rgba(231, 76, 60, 0.3);}
.btn-confirm-success { background: #27ae60; color: white; }
.btn-confirm-success:hover { background: #219150; transform: translateY(-2px); box-shadow: 0 4px 10px rgba(39, 174, 96, 0.3);}
</style>
