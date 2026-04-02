<template>
  <div class="page-container">
    <div class="header">
      <h1>Quản lý Đánh giá</h1>
    </div>

    <div class="filters" style="margin-bottom: 20px; display: flex; gap: 15px;">
      <select v-model="filterRating" class="filter-select">
        <option value="">-- Tất cả số sao --</option>
        <option value="5">5 Sao</option>
        <option value="4">4 Sao</option>
        <option value="3">3 Sao</option>
        <option value="2">2 Sao</option>
        <option value="1">1 Sao</option>
      </select>
      <select v-model="filterStatus" class="filter-select">
        <option value="">-- Tất cả trạng thái --</option>
        <option value="replied">Đã phản hồi</option>
        <option value="pending">Chưa phản hồi</option>
      </select>
      <div style="display: flex; align-items: center; color: #555;">
        Tìm thấy: <b>{{ filteredReviews.length }}</b> đánh giá
      </div>
    </div>

    <table class="admin-table">
      <thead>
        <tr>
          <th style="width: 15%">Khách hàng</th>
          <th style="width: 20%">Sản phẩm</th>
          <th style="width: 12%">Đánh giá</th>
          <th style="width: 28%">Nội dung</th>
          <th style="width: 15%">Trạng thái</th>
          <th style="width: 10%; text-align: center;">Thao tác</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="filteredReviews.length === 0">
          <td colspan="6" style="text-align: center; color: #777; padding: 20px;">Không có đánh giá nào phù hợp.</td>
        </tr>
        <tr v-for="review in filteredReviews" :key="review._id">
          <td>
            <strong>{{ review.user ? review.user.first_name + ' ' + review.user.last_name : 'Khách ẩn danh' }}</strong>
            <div style="font-size: 0.85em; color: #777; margin-top: 5px;">{{ formatDate(review.createdAt) }}</div>
          </td>
          <td>
             <div class="product-info" style="display: flex; align-items: center; gap: 10px;">
                <img :src="review.product?.image || (review.product?.images?.length ? review.product.images[0].url : 'https://placehold.co/40')" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px; border: 1px solid #eee;" />
                <span style="font-size: 0.9em; font-weight: 500; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;" :title="review.product?.name">{{ review.product?.name || 'Sản phẩm đã bị xóa' }}</span>
             </div>
          </td>
          <td style="color: #f1c40f;">
            <i v-for="n in 5" :key="n" class="fa-star" :class="n <= review.rating ? 'fa-solid' : 'fa-regular'"></i>
          </td>
          <td>
            <p style="margin: 0 0 8px 0; font-size: 0.95em; line-height: 1.4;">{{ review.comment }}</p>
            <img v-if="review.image" :src="review.image" style="max-width: 60px; max-height: 60px; border-radius: 4px; cursor: pointer; border: 1px solid #eee;" title="Bấm để xem ảnh" />
          </td>
          <td>
            <span v-if="review.reply" class="status-badge replied"><i class="fa-solid fa-check"></i> Đã phản hồi</span>
            <span v-else class="status-badge pending"><i class="fa-solid fa-clock"></i> Chờ phản hồi</span>
          </td>
          <td style="text-align: center;">
            <button class="btn-edit" @click="openReplyModal(review)" title="Xem & Phản hồi">
              <i class="fa-solid fa-reply"></i>
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Reply Modal -->
    <div v-if="showReplyModal" class="modal-overlay" @click.self="closeReplyModal">
      <div class="form-container" style="max-width: 550px;">
        <h2>Phản hồi Khách hàng</h2>
        
        <div class="review-summary" style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-size: 0.95em; border-left: 4px solid #f1c40f;">
            <div style="color: #f1c40f; margin-bottom: 8px;">
                <i v-for="n in 5" :key="n" class="fa-star" :class="n <= currentReview.rating ? 'fa-solid' : 'fa-regular'"></i>
            </div>
            <p style="margin: 0; color: #333;"><strong>Khách:</strong> {{ currentReview.comment }}</p>
        </div>

        <div class="form-group">
            <label>Nội dung trả lời từ Cửa hàng <span style="color: red">*</span></label>
            <textarea v-model="replyContent" rows="5" class="input-field" placeholder="Gõ câu trả lời của bạn ở đây. Câu trả lời này sẽ hiển thị công khai trên website..." style="resize: vertical;"></textarea>
        </div>

        <div class="form-actions">
            <button class="btn-cancel" @click="closeReplyModal">Hủy</button>
            <button class="btn-save" @click="submitReply" :disabled="!replyContent.trim()">Gửi phản hồi</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import ReviewsService from "@/services/reviews.service";
import { showToast } from "@/utils/toast";

export default {
  data() {
    return {
      reviews: [],
      filterRating: "",
      filterStatus: "",
      
      showReplyModal: false,
      currentReview: null,
      replyContent: "",
    };
  },
  computed: {
    filteredReviews() {
      return this.reviews.filter(r => {
        let matchRating = true;
        let matchStatus = true;

        if (this.filterRating) {
          matchRating = String(r.rating) === String(this.filterRating);
        }

        if (this.filterStatus === "replied") {
          matchStatus = !!r.reply;
        } else if (this.filterStatus === "pending") {
          matchStatus = !r.reply;
        }

        return matchRating && matchStatus;
      });
    }
  },
  methods: {
    formatDate(dateString) {
      if (!dateString) return "";
      const d = new Date(dateString);
      return d.toLocaleDateString("vi-VN") + " " + d.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' });
    },
    async fetchReviews() {
      try {
        // Fetch toàn bộ đánh giá (yêu cầu file reviews.service.js bên admin có cấu hình gọi API này)
        const res = await ReviewsService.getAll(); 
        this.reviews = res || [];
      } catch (error) {
        console.error("Lỗi tải danh sách đánh giá:", error);
      }
    },
    openReplyModal(review) {
      this.currentReview = review;
      this.replyContent = review.reply ? review.reply.text : "";
      this.showReplyModal = true;
    },
    closeReplyModal() {
      this.showReplyModal = false;
      this.currentReview = null;
      this.replyContent = "";
    },
    async submitReply() {
      if (!this.replyContent.trim()) return;
      try {
        await ReviewsService.reply(this.currentReview._id, { text: this.replyContent });
        showToast("Đã gửi phản hồi thành công", "success");
        this.closeReplyModal();
        this.fetchReviews(); // Refresh
      } catch (error) {
        showToast("Lỗi khi gửi phản hồi", "error");
      }
    },
  },
  mounted() {
    this.fetchReviews();
  }
};
</script>

<style scoped>
.page-container { padding: 20px; }
.header h1 { margin-bottom: 20px; color: #2c3e50; }
.filters { display: flex; align-items: center; }
.filter-select { padding: 10px; border: 1px solid #ccc; border-radius: 6px; min-width: 180px; font-size: 0.95rem; }

.admin-table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
.admin-table th, .admin-table td { padding: 15px; border-bottom: 1px solid #eee; text-align: left; vertical-align: top; line-height: 1.5; }
.admin-table th { background: #f8f9fa; font-weight: 600; color: #2c3e50; }
.admin-table tr:hover { background: #fbfbfc; }

.btn-edit { color: #3498db; cursor: pointer; border: none; background: none; margin-right: 15px; font-size: 1.2rem; transition: 0.2s; }
.btn-edit:hover { color: #2980b9; transform: scale(1.1); }
.btn-del { color: #e74c3c; cursor: pointer; border: none; background: none; font-size: 1.2rem; transition: 0.2s; }
.btn-del:hover { color: #c0392b; transform: scale(1.1); }

.status-badge { padding: 5px 10px; border-radius: 20px; font-size: 0.85rem; font-weight: bold; display: inline-flex; align-items: center; gap: 4px; }
.status-badge.replied { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
.status-badge.pending { background: #fff3cd; color: #856404; border: 1px solid #ffeeba; }

/* Modal */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; backdrop-filter: blur(2px); }
.form-container { background: white; padding: 30px; border-radius: 12px; width: 90%; box-shadow: 0 10px 30px rgba(0,0,0,0.2); animation: modalFadeIn 0.3s ease; }
@keyframes modalFadeIn { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
.form-container h2 { margin-top: 0; margin-bottom: 20px; color: #2c3e50; border-bottom: 2px solid #eee; padding-bottom: 10px; }
.form-group { margin-bottom: 20px; }
.form-group label { display: block; margin-bottom: 8px; font-weight: 600; color: #444; }
.input-field { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; box-sizing: border-box; font-family: inherit; font-size: 0.95rem; }
.input-field:focus { border-color: #4776E6; outline: none; }
.form-actions { display: flex; justify-content: flex-end; gap: 10px; }
.btn-cancel { background: #f1f3f5; color: #495057; border: 1px solid #ddd; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold; transition: 0.2s;}
.btn-cancel:hover { background: #e2e6ea; }
.btn-save { background: linear-gradient(135deg, #4776E6, #8E54E9); color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; transition: 0.2s; }
.btn-save:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 10px rgba(71, 118, 230, 0.3); }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
</style>