<template>
  <div v-if="isVisible" class="modal-overlay">
    <div class="modal-content">
      <h3>Đánh giá sản phẩm</h3>
      <p class="product-name">{{ product?.product_name }}</p>
      
      <div class="rating-input">
        <span 
            v-for="star in 5" 
            :key="star" 
            class="star" 
            :class="{ active: star <= rating }"
            @click="rating = star"
        >★</span>
      </div>

      <div class="image-upload-section">
        <label class="upload-btn">
            <i class="fa-solid fa-image"></i> Thêm ảnh
            <input type="file" accept="image/*" @change="handleImageUpload" hidden />
        </label>
        <div v-if="previewImage" class="image-preview">
            <img :src="previewImage" alt="Preview" />
            <button class="btn-remove-img" @click="removeImage">×</button>
        </div>
      </div>

      <textarea 
        v-model="comment" 
        placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
        rows="4"
      ></textarea>

      <div class="modal-actions">
        <button class="btn-cancel" @click="$emit('close')">Hủy</button>
        <button class="btn-submit" @click="submitReview">Gửi đánh giá</button>
      </div>
    </div>
  </div>
</template>

<script>
import { showToast } from "@/utils/toast";
import UploadService from "@/services/upload.service";

export default {
  props: {
    isVisible: Boolean,
    product: Object,
    orderId: String
  },
  data() {
    return {
      rating: 5,
      comment: '',
      imageFile: null,
      previewImage: null
    };
  },
  methods: {
    handleImageUpload(event) {
        const file = event.target.files[0];
        if (file) {
            this.imageFile = file;
            this.previewImage = URL.createObjectURL(file);
        }
    },
    removeImage() {
        this.imageFile = null;
        this.previewImage = null;
    },
    async submitReview() {
      if (!this.comment.trim()) {
        showToast("Vui lòng nhập nội dung đánh giá", "warning");
        return;
      }

      let imageUrl = null;
      if (this.imageFile) {
          try {
              const res = await UploadService.upload(this.imageFile);
              imageUrl = res.url;
          } catch (error) {
              showToast("Lỗi tải ảnh lên", "error");
              return;
          }
      }

      this.$emit('submit', {
        product_id: this.product.product_id,
        order_id: this.orderId,
        rating: this.rating,
        comment: this.comment,
        image: imageUrl
      });
      // Reset form
      this.comment = '';
      this.rating = 5;
      this.removeImage();
    }
  }
};
</script>

<style scoped>
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1100; }
.modal-content { background: white; padding: 25px; border-radius: 8px; width: 90%; max-width: 450px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); text-align: center; }
h3 { margin-top: 0; color: #2c3e50; }
.product-name { font-weight: bold; color: #555; margin-bottom: 15px; }
.rating-input { font-size: 2rem; color: #ddd; cursor: pointer; margin-bottom: 15px; }
.star.active { color: #f1c40f; }

.image-upload-section { margin-bottom: 15px; text-align: left; }
.upload-btn { display: inline-block; padding: 8px 15px; background: #f0f0f0; border-radius: 4px; cursor: pointer; font-size: 0.9rem; color: #555; }
.image-preview { position: relative; display: inline-block; margin-top: 10px; margin-left: 10px; vertical-align: top; }
.image-preview img { width: 60px; height: 60px; object-fit: cover; border-radius: 4px; border: 1px solid #ddd; }
.btn-remove-img { position: absolute; top: -5px; right: -5px; background: red; color: white; border: none; border-radius: 50%; width: 18px; height: 18px; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; }

textarea { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; margin-bottom: 20px; font-family: inherit; resize: vertical; }
.modal-actions { display: flex; gap: 10px; }
.modal-actions button { flex: 1; padding: 10px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; transition: 0.2s; }
.btn-cancel { background: #ecf0f1; color: #7f8c8d; }
.btn-cancel:hover { background: #bdc3c7; color: white; }
.btn-submit { background: #2980b9; color: white; }
.btn-submit:hover { background: #2471a3; }
</style>