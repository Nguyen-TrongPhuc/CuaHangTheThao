<template>
  <div class="shop-config-container">
    <h2 class="page-title">Cấu hình Cửa hàng</h2>
    <div v-if="isLoading" class="loading-spinner">Đang tải...</div>
    <form v-else @submit.prevent="handleSave" class="config-form">
      <div class="form-section">
        <h4>Thông tin liên hệ</h4>
        <div class="form-group">
          <label for="shop-email">Gmail (Email gửi thông báo)</label>
          <input id="shop-email" v-model="shop.email" type="email" placeholder="example@gmail.com" />
          <small style="color: #6b7280; font-size: 0.8rem;">Email này dùng để gửi thông báo hệ thống cho người dùng.</small>
        </div>
      </div>

      <div class="form-section">
        <h4>Địa chỉ & Tọa độ (dùng để tính phí ship)</h4>
        <div class="form-group">
          <label for="shop-address">Địa chỉ đầy đủ</label>
          <textarea id="shop-address" v-model="shop.address" rows="3" required></textarea>
        </div>
        <div class="form-group-inline">
          <div class="form-group">
            <label for="shop-lat">Vĩ độ (Latitude)</label>
            <input id="shop-lat" v-model.number="shop.lat" type="number" step="any" required />
          </div>
          <div class="form-group">
            <label for="shop-lng">Kinh độ (Longitude)</label>
            <input id="shop-lng" v-model.number="shop.lng" type="number" step="any" required />
          </div>
        </div>
        <div class="form-note">
          <i class="fa-solid fa-circle-info"></i>
          <strong>Làm thế nào để lấy tọa độ?</strong>
          <ol>
            <li>Truy cập <a href="https://www.google.com/maps" target="_blank">Google Maps</a>.</li>
            <li>Tìm địa chỉ của bạn.</li>
            <li>Click chuột phải vào vị trí trên bản đồ, tọa độ sẽ hiện ra để bạn sao chép.</li>
          </ol>
        </div>
      </div>

      <button type="submit" class="btn-save" :disabled="isSaving">
        <span v-if="isSaving">Đang lưu...</span>
        <span v-else>Lưu thay đổi</span>
      </button>
    </form>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import ShippingService from '@/services/shipping.service';
// Giả sử bạn có một hàm showToast tương tự bên User
// import { showToast } from '@/utils/toast'; 

export default {
  name: 'ShopConfig',
  setup() {
    const shop = ref({
      name: '',
      address: '',
      lat: 0,
      lng: 0,
      phone: '',
      email: '',
    });
    const isLoading = ref(true);
    const isSaving = ref(false);

    const loadShopInfo = async () => {
      try {
        isLoading.value = true;
        const response = await ShippingService.getShopInfo();
        // API trả về { shop: {...}, shipping: {...} }
        if (response && response.shop) {
          shop.value = response.shop;
        }
      } catch (error) {
        console.error('Lỗi tải thông tin shop:', error);
        alert('Không thể tải thông tin cửa hàng.');
      } finally {
        isLoading.value = false;
      }
    };

    const handleSave = async () => {
      if (!shop.value.address || !shop.value.lat || !shop.value.lng) {
        alert('Vui lòng điền đầy đủ địa chỉ và tọa độ.');
        return;
      }
      try {
        isSaving.value = true;
        await ShippingService.updateShopInfo(shop.value);
        alert('Cập nhật thông tin cửa hàng thành công!');
      } catch (error) {
        console.error('Lỗi cập nhật thông tin shop:', error);
        alert('Cập nhật thất bại. Vui lòng thử lại.');
      } finally {
        isSaving.value = false;
      }
    };

    onMounted(loadShopInfo);

    return {
      shop,
      isLoading,
      isSaving,
      handleSave,
    };
  },
};
</script>

<style scoped>
.shop-config-container {
  padding: 2rem;
  background-color: #f9fafb;
}
.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 1.5rem;
}
.config-form {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
  max-width: 800px;
  margin: auto;
}
.form-section {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}
.form-section:last-of-type {
  border-bottom: none;
  margin-bottom: 0;
}
.form-section h4 {
  font-size: 1.1rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 1rem;
}
.form-group {
  margin-bottom: 1rem;
}
.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}
.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}
.form-group-inline {
  display: flex;
  gap: 1.5rem;
}
.form-group-inline .form-group {
  flex: 1;
}
.form-note {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #1e40af;
}
.form-note strong {
  display: block;
  margin-bottom: 0.5rem;
}
.form-note ol {
  margin: 0;
  padding-left: 1.2rem;
}
.form-note a {
  color: #1d4ed8;
  text-decoration: underline;
}
.btn-save {
  margin-top: 1.5rem;
  padding: 0.75rem 1.5rem;
  background-color: #16a34a;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}
.btn-save:hover:not(:disabled) {
  background-color: #15803d;
}
.btn-save:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}
</style>