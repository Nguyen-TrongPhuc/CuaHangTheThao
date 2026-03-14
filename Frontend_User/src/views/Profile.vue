<template>
  <div class="profile-page-wrapper">
    <AppHeader />

    <main class="profile-container">
      <div class="profile-card">
        <div class="profile-sidebar">
          <div class="avatar-large" @click="triggerFileInput">
            <img v-if="user.avatar" :src="user.avatar" alt="Avatar" />
            <span v-else>{{ userAvatar }}</span>
            <div class="overlay">
              <i class="fa-solid fa-camera"></i>
            </div>
          </div>
          <h3>{{ user.last_name }} {{ user.first_name }}</h3>
          <p class="email-text">{{ user.email }}</p>
          
          <div class="menu-list">
            <button :class="{ active: activeTab === 'info' }" @click="activeTab = 'info'">
              <i class="fa-solid fa-user"></i> Thông tin cá nhân
            </button>
            <button :class="{ active: activeTab === 'password' }" @click="activeTab = 'password'">
              <i class="fa-solid fa-lock"></i> Đổi mật khẩu
            </button>
            
            <!-- Input file ẩn -->
            <input type="file" ref="fileInput" style="display: none" @change="handleFileUpload" accept="image/*" />
          </div>
        </div>

        <div class="profile-content">
          <!-- TAB THÔNG TIN -->
          <div v-if="activeTab === 'info'">
            <h2 class="section-title">Thông tin cá nhân</h2>
            
            <!-- VIP Loyalty Section -->
            <div v-if="loyaltyInfo" class="vip-section">
              <h3><i class="fa-solid fa-star"></i> Khách hàng thân thiết</h3>
              <div class="vip-card">
                <div class="vip-rank" :class="loyaltyInfo.customerRank">
                  <span class="rank-label">{{ getRankLabel(loyaltyInfo.customerRank) }}</span>
                  <div class="progress-bar">
                    <div class="progress-fill" :style="'width: ' + getProgressPercent(loyaltyInfo.totalSpent) + '%'"></div>
                  </div>
                  <div class="vip-stats">
                    <span>Tổng chi: {{ formatMoney(loyaltyInfo.totalSpent) }}</span>
                    <span>Giảm giá: {{ loyaltyInfo.discountPercent }}%</span>
                  </div>
                </div>
              </div>
            </div>

            <form @submit.prevent="updateInfo">
              <div class="form-row">
                <div class="form-group half">
                  <label>Họ</label>
                  <input v-model="user.last_name" type="text" required />
                </div>
                <div class="form-group half">
                  <label>Tên</label>
                  <input v-model="user.first_name" type="text" required />
                </div>
              </div>

              <div class="form-group">
                <label>Email</label>
                <input v-model="user.email" type="email" required />
              </div>

              <div class="form-group">
                <label>Số điện thoại</label>
                <input v-model="user.phone" type="text" required />
              </div>

              <div class="form-group">
                <label>Địa chỉ</label>
                <p v-if="user.address" class="current-address"><strong>Địa chỉ hiện tại:</strong> {{ user.address }}</p>
                <small v-if="user.address" class="text-muted">Để thay đổi, vui lòng nhập địa chỉ mới bên dưới. Nếu không, địa chỉ hiện tại sẽ được giữ nguyên.</small>
                
                <div class="address-selection">
                    <select v-model="addressState.selectedProvince" @change="fetchDistricts" class="form-control">
                        <option :value="null">-- Tỉnh/Thành phố --</option>
                        <option v-for="p in addressState.provinces" :key="p.code" :value="p">{{ p.name }}</option>
                    </select>
                    <select v-model="addressState.selectedDistrict" @change="fetchWards" class="form-control" :disabled="!addressState.selectedProvince">
                        <option :value="null">-- Quận/Huyện --</option>
                        <option v-for="d in addressState.districts" :key="d.code" :value="d">{{ d.name }}</option>
                    </select>
                    <select v-model="addressState.selectedWard" class="form-control" :disabled="!addressState.selectedDistrict">
                        <option :value="null">-- Phường/Xã --</option>
                        <option v-for="w in addressState.wards" :key="w.code" :value="w">{{ w.name }}</option>
                    </select>
                </div>
                <input v-model="addressState.street" type="text" placeholder="Số nhà, tên đường..." class="street-input" />
              </div>

              <!-- Avatar is handled by the sidebar now -->
              <!-- <div class="form-group"> ... </div> -->

              <button type="submit" class="btn-save">Cập nhật thông tin</button>
            </form>
          </div>

          <!-- TAB ĐỔI MẬT KHẨU -->
          <div v-if="activeTab === 'password'">
            <h2 class="section-title">Đổi mật khẩu</h2>
            <form @submit.prevent="changePassword">
              <div class="form-group">
                <div class="label-wrapper">
                  <label>Mật khẩu cũ</label>
                  <router-link to="/forgot-password" class="forgot-pass-link">Quên mật khẩu?</router-link>
                </div>
                <input v-model="passwordForm.oldPassword" type="password" placeholder="Nhập mật khẩu hiện tại" required />
                  <span class="toggle-pass" @click="showOldPwd = !showOldPwd">
                    <i :class="showOldPwd ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
                  </span>
              </div>
              <div class="form-group">
                <label>Mật khẩu mới</label>
                <input v-model="passwordForm.newPassword" type="password" required />
                  <span class="toggle-pass" @click="showNewPwd = !showNewPwd">
                    <i :class="showNewPwd ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
                  </span>
              </div>
              <div class="form-group">
                <label>Nhập lại mật khẩu mới</label>
                <input v-model="passwordForm.confirmPassword" type="password" required />
                  <span class="toggle-pass" @click="showConfirmPwd = !showConfirmPwd">
                    <i :class="showConfirmPwd ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
                  </span>
              </div>

              <button type="submit" class="btn-save">Đổi mật khẩu</button>
            </form>
          </div>
        </div>
      </div>
    </main>

    <AppFooter />
  </div>
</template>

<script>
import AppHeader from "@/components/AppHeader.vue";
import AppFooter from "@/components/AppFooter.vue";
import CustomerService from "@/services/customer.service";
import UploadService from "@/services/upload.service";
import { showToast } from "@/utils/toast";

export default {
  components: { AppHeader, AppFooter },
  data() {
    return {
      activeTab: 'info',
      user: {
        first_name: "", last_name: "", email: "", phone: "", address: "", avatar: ""
      },
      loyaltyInfo: null,
      passwordForm: {
        oldPassword: "", newPassword: "", confirmPassword: ""
      }
      ,
      addressState: {
        provinces: [],
        districts: [],
        wards: [],
        selectedProvince: null,
        selectedDistrict: null,
        selectedWard: null,
        street: ""
      },
      showOldPwd: false,
      showNewPwd: false,
      showConfirmPwd: false
    };
  },
  computed: {
    userAvatar() {
      const name = this.user.first_name || "U";
      return name.charAt(0).toUpperCase();
    },
    newAddressString() {
        const parts = [];
        if (this.addressState.street) parts.push(this.addressState.street);
        if (this.addressState.selectedWard) parts.push(this.addressState.selectedWard.name);
        if (this.addressState.selectedDistrict) parts.push(this.addressState.selectedDistrict.name);
        if (this.addressState.selectedProvince) parts.push(this.addressState.selectedProvince.name);
        return parts.join(", ");
    }
  },
  methods: {
    async fetchProfile() {
      try {
        this.user = await CustomerService.getProfile();
        this.loyaltyInfo = await CustomerService.getLoyalty();
      } catch (error) {
        // Nếu lỗi 401 (Unauthorized), chuyển hướng về trang đăng nhập
        if (error.response && error.response.status === 401) {
          showToast("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", "warning");
          this.$router.push("/login");
        } else {
          showToast("Lỗi tải thông tin hồ sơ", "error");
        }
      }
    },
    async updateInfo() {
      try {
        const dataToUpdate = { ...this.user };

        // Nếu người dùng đã nhập địa chỉ mới, sử dụng nó.
        if (this.newAddressString) {
            dataToUpdate.address = this.newAddressString;
        }

        await CustomerService.updateProfile(dataToUpdate);
        // Cập nhật tên hiển thị trên Header
        localStorage.setItem("user_name", this.user.last_name + " " + this.user.first_name);
        if (this.user.avatar) {
            localStorage.setItem("user_avatar", this.user.avatar);
        } else {
            localStorage.removeItem("user_avatar");
        }
        
        // Phát sự kiện để AppHeader cập nhật lại avatar ngay lập tức
        window.dispatchEvent(new Event("user-updated"));

        // Tải lại hồ sơ để hiển thị địa chỉ mới nhất
        await this.fetchProfile();
        showToast("Cập nhật hồ sơ thành công!", "success");
      } catch (error) {
        showToast(error.response?.data?.message || "Cập nhật thất bại", "error");
      }
    },
    async changePassword() {
      if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
        showToast("Mật khẩu xác nhận không khớp!", "error");
        return;
      }
      
      try {
        await CustomerService.changePassword({
          oldPassword: this.passwordForm.oldPassword,
          newPassword: this.passwordForm.newPassword
        });
        showToast("Đổi mật khẩu thành công!", "success");
        this.passwordForm = { oldPassword: "", newPassword: "", confirmPassword: "" };
      } catch (error) {
        showToast(error.response?.data?.message || "Đổi mật khẩu thất bại", "error");
      }
    },
    triggerFileInput() {
      this.$refs.fileInput.click();
    },
    async handleFileUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      try {
        const response = await UploadService.upload(file);
        this.user.avatar = response.url;
        
        // Lưu ngay vào CSDL và cập nhật Header
        await this.updateInfo();
      } catch (error) {
        console.log(error);
        showToast("Lỗi tải ảnh lên", "error");
      }
    },
    // API Địa chính
    async fetchProvinces() {
        try {
            const res = await fetch("https://provinces.open-api.vn/api/?depth=1");
            this.addressState.provinces = await res.json();
        } catch (e) { console.error(e); }
    },
    async fetchDistricts() {
        this.addressState.districts = [];
        this.addressState.wards = [];
        this.addressState.selectedDistrict = null;
        this.addressState.selectedWard = null;
        if (this.addressState.selectedProvince) {
            try {
                const res = await fetch(`https://provinces.open-api.vn/api/p/${this.addressState.selectedProvince.code}?depth=2`);
                const data = await res.json();
                this.addressState.districts = data.districts;
            } catch (e) { console.error(e); }
        }
    },
    async fetchWards() {
        this.addressState.wards = [];
        this.addressState.selectedWard = null;
        if (this.addressState.selectedDistrict) {
            try {
                const res = await fetch(`https://provinces.open-api.vn/api/d/${this.addressState.selectedDistrict.code}?depth=2`);
                const data = await res.json();
                this.addressState.wards = data.wards;
            } catch (e) { console.error(e); }
        }
    },
    formatMoney(amount) {
      return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
    },
    getRankLabel(rank) {
      const labels = { normal: 'Thường', silver: 'Bạc', gold: 'Vàng' };
      return labels[rank] || 'Thường';
    },
    getProgressPercent(totalSpent) {
      if (totalSpent >= 50000000) return 100;
      if (totalSpent >= 10000000) return (totalSpent - 10000000) / 40000000 * 100;
      return totalSpent / 10000000 * 100;
    },
    // ... other methods
  },
  async mounted() {
    await this.fetchProfile();
    await this.fetchProvinces();
  }
};
</script>

<style scoped>
.page-wrapper { display: flex; flex-direction: column; min-height: 100vh; }
.container { flex: 1; padding: 40px 10%; background-color: #f9f9f9; display: flex; justify-content: center; }
.profile-card { display: flex; background: white; border-radius: 15px; box-shadow: 0 5px 20px rgba(0,0,0,0.05); width: 100%; max-width: 900px; overflow: hidden; }
.profile-sidebar { width: 250px; background: #f8f9fa; padding: 30px 20px; text-align: center; border-right: 1px solid #eee; }
.profile-sidebar h3 { color: #2c3e50; font-weight: 700; margin-bottom: 5px; }
.avatar-large { width: 80px; height: 80px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: bold; margin: 0 auto 15px; overflow: hidden; position: relative; cursor: pointer; }
.avatar-large img { width: 100%; height: 100%; object-fit: cover; }
.overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; opacity: 0; transition: 0.3s; }
.avatar-large:hover .overlay { opacity: 1; }
.email-text { color: #7f8c8d; font-size: 0.9rem; margin-bottom: 30px; word-break: break-all; }
.menu-list button { display: block; width: 100%; padding: 12px 15px; text-align: left; background: none; border: none; cursor: pointer; color: #2c3e50; font-size: 1rem; border-radius: 8px; margin-bottom: 5px; transition: 0.2s; }
.menu-list button:hover { background: #e9ecef; }
.menu-list button.active { background: linear-gradient(135deg, #0f0c29, #302b63); color: white; }
.menu-list button i { margin-right: 10px; width: 20px; text-align: center; }
.profile-content { flex: 1; padding: 40px; }
.section-title { margin-bottom: 25px; color: #2c3e50; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px; }
.form-row { display: flex; gap: 20px; }
.half { flex: 1; }
.form-group { margin-bottom: 20px; }
.form-group label { display: block; margin-bottom: 8px; font-weight: 600; color: #34495e; }
.label-wrapper { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.label-wrapper label { margin-bottom: 0; }
.forgot-pass-link { font-size: 0.9rem; color: #302b63; text-decoration: none; transition: 0.3s; }
.forgot-pass-link:hover { color: #e74c3c; text-decoration: underline; }
.form-group input { width: 100%; padding: 10px 15px; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem; box-sizing: border-box; }
.input-group { display: flex; gap: 10px; }
.form-group select { width: 100%; padding: 10px 15px; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem; box-sizing: border-box; background: white; }
.address-selection { display: flex; gap: 10px; margin-bottom: 10px; }
.street-input { margin-top: 10px; }
.current-address { background: #f0f0f0; padding: 10px; border-radius: 4px; margin-bottom: 10px; font-size: 0.95rem; color: #333; }
.text-muted { font-size: 0.85rem; color: #888; margin-bottom: 10px; display: block; }

.vip-section { margin-bottom: 30px; }
.vip-section h3 { color: #2c3e50; font-weight: 600; margin-top: 0; margin-bottom: 15px; font-size: 1.1rem; }
.vip-card { background: linear-gradient(135deg, #f8f9ff, #e8f4fd); border: 1px solid #d1e7ff; border-radius: 12px; padding: 20px; }
.vip-rank { text-align: center; }
.vip-rank.normal { color: #6c757d; }
.vip-rank.silver { color: #6b7280; }
.vip-rank.gold { color: #b45309; font-weight: bold; }
.rank-label { display: block; font-size: 1.2em; margin-bottom: 10px; font-weight: 700; color: #2c3e50; }
.progress-bar { background: #e5e7eb; height: 8px; border-radius: 4px; overflow: hidden; margin-bottom: 10px; }
.progress-fill { height: 100%; background: linear-gradient(90deg, #3b82f6, #8b5cf6); transition: width 0.5s ease; }
.vip-stats { font-size: 0.9em; color: #4b5563; display: flex; justify-content: space-between; }

.btn-save { padding: 12px 30px; background: linear-gradient(135deg, #0f0c29, #302b63); color: white; border: none; border-radius: 25px; font-size: 1rem; font-weight: bold; cursor: pointer; transition: 0.3s; margin-top: 10px; }
.btn-save:hover { transform: translateY(-2px); box-shadow: 0 4px 10px rgba(48, 43, 99, 0.3); }
@media (max-width: 768px) { .profile-card { flex-direction: column; } .profile-sidebar { width: 100%; border-right: none; border-bottom: 1px solid #eee; } }
.form-group .toggle-pass { position: absolute; right: 15px; top: 50%; transform: translateY(50%); cursor: pointer; }
</style>
