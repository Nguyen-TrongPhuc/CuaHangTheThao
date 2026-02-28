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
                <img :src="item.product_image || 'https://via.placeholder.com/60'" class="item-thumb" />
                <div class="item-details">
                    <div class="item-name">{{ item.product_name }}</div>
                    <div class="item-meta">
                        <span v-if="item.variant_size_id">Size: {{ getSizeName(item.variant_size_id) }}</span>
                        <span v-if="item.variant_size_id && item.variant_color_id"> - </span>
                        <span v-if="item.variant_color_id">Màu: {{ getColorName(item.variant_color_id) }}</span>
                    </div>
                    <div class="item-qty">x{{ item.quantity }}</div>
                </div>
                <div class="item-price">{{ formatPrice(item.unit_price) }}đ</div>
                <div v-if="order.status === 'completed'" class="item-action">
                    <button v-if="!item.is_reviewed" class="btn-review" @click="openReviewModal(item, order)">Đánh giá</button>
                    <span v-else class="text-reviewed"><i class="fa-solid fa-check"></i> Đã đánh giá</span>
                </div>
            </div>
          </div>

          <div class="order-body">
            <p class="order-date">Ngày đặt: {{ formatDate(order.createdAt) }}</p>
            <p class="order-total">Tổng tiền: <strong>{{ formatPrice(order.total_amount) }}đ</strong></p>
            <p class="order-info" v-if="order.name">Người nhận: {{ order.name }} ({{ order.phone }})</p>
            <p class="order-address">Địa chỉ: {{ order.address || 'Chưa cập nhật (Đơn hàng cũ)' }}</p>
          </div>

          <div class="order-footer">
             <!-- Có thể thêm nút Xem chi tiết tại đây -->
             <span class="note" v-if="order.note">Ghi chú: {{ order.note }}</span>
             
             <div class="action-right">
                <button v-if="order.status === 'pending'" class="btn-cancel" @click="cancelOrder(order)">Hủy đơn</button>
                <button v-if="order.status === 'delivered'" class="btn-return" @click="openReturnModal(order)">Trả hàng</button>
                <button v-if="order.status === 'delivered'" class="btn-confirm-received" @click="confirmReceived(order)">Đã nhận hàng</button>
                <span v-if="order.status === 'return_requested'" class="text-warning">Đang chờ duyệt trả hàng...</span>
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
import { showToast } from "@/utils/toast";

export default {
  components: { AppHeader, AppFooter, ReturnRequestModal, ReviewModal },
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
      selectedOrderForReview: null
    };
  },
  methods: {
    async fetchOrders() {
      try {
        // Tải dữ liệu đơn hàng và metadata (size, color) song song
        const [ordersData, sizesData, colorsData] = await Promise.all([
            OrderService.getHistory(),
            SizesService.getAll(),
            ColorsService.getAll()
        ]);
        this.orders = ordersData;
        this.sizes = sizesData;
        this.colors = colorsData;
      } catch (error) {
        console.error("Lỗi tải đơn hàng:", error);
      } finally {
        this.isLoading = false;
      }
    },
    formatPrice(value) {
      return new Intl.NumberFormat('vi-VN').format(value);
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
    async confirmReceived(order) {
      if (confirm("Bạn xác nhận đã nhận được hàng và muốn hoàn thành đơn hàng này?")) {
        try {
          await OrderService.update(order._id, { status: 'completed' });
          order.status = 'completed';
          showToast("Cảm ơn bạn đã mua hàng!", "success");
        } catch (error) {
          showToast("Có lỗi xảy ra, vui lòng thử lại", "error");
        }
      }
    },
    async cancelOrder(order) {
      if (confirm("Bạn có chắc muốn hủy đơn hàng này?")) {
        try {
          await OrderService.update(order._id, { status: 'cancelled' });
          order.status = 'cancelled';
          showToast("Đã hủy đơn hàng thành công", "success");
        } catch (error) {
          showToast("Lỗi khi hủy đơn hàng", "error");
        }
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
        this.selectedProductForReview = item;
        this.selectedOrderForReview = order;
        this.showReviewModal = true;
    },
    async handleReviewSubmit(reviewData) {
        try {
            await ReviewsService.create(reviewData);
            showToast("Cảm ơn bạn đã đánh giá sản phẩm!", "success");
            
            // Cập nhật trạng thái đã đánh giá cho sản phẩm trong đơn hàng hiện tại
            if (this.selectedOrderForReview && this.selectedProductForReview) {
                const order = this.orders.find(o => o._id === this.selectedOrderForReview._id);
                if (order) {
                    const item = order.items.find(i => i._id === this.selectedProductForReview._id);
                    if (item) item.is_reviewed = true;
                }
            }

            this.showReviewModal = false;
        } catch (error) {
            console.error(error);
            showToast("Lỗi khi gửi đánh giá", "error");
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
.item-thumb { width: 60px; height: 60px; object-fit: cover; border-radius: 4px; margin-right: 15px; border: 1px solid #eee; }
.item-details { flex: 1; }
.item-name { font-weight: 600; color: #333; font-size: 0.95rem; }
.item-meta { font-size: 0.85rem; color: #777; margin-top: 2px; }
.item-qty { font-size: 0.85rem; color: #555; margin-top: 2px; }
.item-price { font-weight: bold; color: #333; }
.item-action { margin-left: 15px; }
.btn-review {
    background: #fff; border: 1px solid #2980b9; color: #2980b9;
    padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 0.85rem;
}
.btn-review:hover { background: #2980b9; color: white; }
.text-reviewed { font-size: 0.85rem; color: #27ae60; font-weight: bold; }

.order-body p { margin: 5px 0; color: #444; font-size: 0.95rem; }
.order-footer { margin-top: 15px; font-size: 0.9rem; color: #777; font-style: italic; display: flex; justify-content: space-between; align-items: center; }

.action-right { margin-left: auto; }
.btn-confirm-received, .btn-cancel, .btn-return {
  background: linear-gradient(135deg, #28a745, #218838);
  color: white; border: none; padding: 8px 15px;
  border-radius: 20px; cursor: pointer; font-weight: bold;
  transition: 0.3s;
}
.btn-confirm-received:hover, .btn-cancel:hover, .btn-return:hover { transform: translateY(-2px); box-shadow: 0 2px 5px rgba(0,0,0,0.2); }

.btn-cancel { background: linear-gradient(135deg, #dc3545, #c82333); }
.btn-return { background: linear-gradient(135deg, #6c757d, #5a6268); margin-right: 10px; }

.text-warning { color: #d35400; font-weight: bold; font-size: 0.9rem; font-style: italic; }

.no-orders { text-align: center; margin-top: 50px; color: #777; }
.btn-shop { display: inline-block; margin-top: 15px; padding: 10px 20px; background: #2c3e50; color: white; text-decoration: none; border-radius: 20px; }
</style>