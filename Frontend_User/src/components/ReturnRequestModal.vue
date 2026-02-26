<template>
  <div v-if="isVisible" class="modal-overlay">
    <div class="modal-content">
      <h3>Yêu cầu Trả hàng</h3>
      <p class="order-ref">Đơn hàng: #{{ orderId ? orderId.slice(-6).toUpperCase() : '' }}</p>
      
      <div class="reasons-list">
        <p class="label">Vui lòng chọn lý do:</p>
        <label class="radio-group" v-for="(reason, index) in reasons" :key="index">
          <input type="radio" v-model="selectedReason" :value="reason" />
          <span>{{ reason }}</span>
        </label>
        <label class="radio-group">
          <input type="radio" v-model="selectedReason" value="Khác" />
          <span>Lý do khác</span>
        </label>
      </div>

      <div class="other-reason" v-if="selectedReason === 'Khác'">
        <textarea 
          v-model="otherReason" 
          placeholder="Mô tả chi tiết lý do..."
          rows="3"
        ></textarea>
      </div>

      <div class="modal-actions">
        <button class="btn-cancel" @click="$emit('close')">Hủy bỏ</button>
        <button class="btn-submit" @click="submitReturn">Gửi yêu cầu</button>
      </div>
    </div>
  </div>
</template>

<script>
import { showToast } from "@/utils/toast";

export default {
  props: {
    isVisible: Boolean,
    orderId: String
  },
  data() {
    return {
      selectedReason: '',
      otherReason: '',
      reasons: [
        "Sản phẩm bị lỗi / hư hỏng",
        "Giao sai sản phẩm (sai Size, sai Màu)",
        "Sản phẩm không giống mô tả",
        "Thiếu phụ kiện / quà tặng kèm"
      ]
    };
  },
  methods: {
    submitReturn() {
      if (!this.selectedReason) {
        showToast("Vui lòng chọn lý do trả hàng!", "warning");
        return;
      }
      
      let finalReason = this.selectedReason;
      if (this.selectedReason === 'Khác') {
        if (!this.otherReason.trim()) {
          showToast("Vui lòng nhập chi tiết lý do!", "warning");
          return;
        }
        finalReason = `Khác: ${this.otherReason}`;
      }

      this.$emit('submit', finalReason);
      // Reset form
      this.selectedReason = '';
      this.otherReason = '';
    }
  }
};
</script>

<style scoped>
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
.modal-content { background: white; padding: 25px; border-radius: 8px; width: 90%; max-width: 400px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
h3 { margin-top: 0; color: #2c3e50; text-align: center; margin-bottom: 5px; }
.order-ref { text-align: center; color: #7f8c8d; font-size: 0.9rem; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
.label { font-weight: bold; margin-bottom: 10px; color: #333; }
.reasons-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 15px; }
.radio-group { display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 0.95rem; color: #555; }
.radio-group input { width: 18px; height: 18px; cursor: pointer; accent-color: #e74c3c; }
.other-reason textarea { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-family: inherit; resize: vertical; box-sizing: border-box; }
.modal-actions { display: flex; gap: 10px; margin-top: 20px; }
.modal-actions button { flex: 1; padding: 10px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; transition: 0.2s; }
.btn-cancel { background: #ecf0f1; color: #7f8c8d; }
.btn-cancel:hover { background: #bdc3c7; color: white; }
.btn-submit { background: #e74c3c; color: white; }
.btn-submit:hover { background: #c0392b; }
</style>