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
                <input v-model="user.email" type="email" disabled class="disabled-input" />
              </div>

              <div class="form-group">
                <label>Số điện thoại</label>
                <input v-model="user.phone" type="text" required />
              </div>

              <div class="form-group">
                <label>Địa chỉ</label>
                <input v-model="user.address" type="text" />
              </div>

              <div class="form-group">
                <label>Avatar</label>
                <div class="input-group">
                    <input v-model="user.avatar" type="text" placeholder="Link ảnh hoặc tải lên" />
                    <button type="button" class="btn-upload" @click="triggerFileInput"><i class="fa-solid fa-upload"></i></button>
                </div>
              </div>

              <button type="submit" class="btn-save">Cập nhật thông tin</button>
            </form>
          </div>

          <!-- TAB ĐỔI MẬT KHẨU -->
          <div v-if="activeTab === 'password'">
            <h2 class="section-title">Đổi mật khẩu</h2>
            <form @submit.prevent="changePassword">
              <div class="form-group">
                <label>Mật khẩu cũ</label>
                <input v-model="passwordForm.oldPassword" type="password" required />
              </div>
              <div class="form-group">
                <label>Mật khẩu mới</label>
                <input v-model="passwordForm.newPassword" type="password" required />
              </div>
              <div class="form-group">
                <label>Nhập lại mật khẩu mới</label>
                <input v-model="passwordForm.confirmPassword" type="password" required />
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
      passwordForm: {
        oldPassword: "", newPassword: "", confirmPassword: ""
      }
    };
  },
  computed: {
    userAvatar() {
      const name = this.user.first_name || "U";
      return name.charAt(0).toUpperCase();
    }
  },
  methods: {
    async fetchProfile() {
      try {
        this.user = await CustomerService.getProfile();
      } catch (error) {
        showToast("Lỗi tải thông tin hồ sơ", "error");
      }
    },
    async updateInfo() {
      try {
        await CustomerService.updateProfile(this.user);
        // Cập nhật tên hiển thị trên Header
        localStorage.setItem("user_name", this.user.last_name + " " + this.user.first_name);
        if (this.user.avatar) {
            localStorage.setItem("user_avatar", this.user.avatar);
        } else {
            localStorage.removeItem("user_avatar");
        }
        
        // Phát sự kiện để AppHeader cập nhật lại avatar ngay lập tức
        window.dispatchEvent(new Event("user-updated"));

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
    }
  },
  mounted() {
    this.fetchProfile();
  }
};
</script>

<style scoped>
.profile-page-wrapper { display: flex; flex-direction: column; min-height: 100vh; }
.profile-container { flex: 1; padding: 40px 10%; background-color: #f9f9f9; display: flex; justify-content: center; }
.profile-card { display: flex; background: white; border-radius: 15px; box-shadow: 0 5px 20px rgba(0,0,0,0.05); width: 100%; max-width: 900px; overflow: hidden; }
.profile-sidebar { width: 250px; background: #f8f9fa; padding: 30px 20px; text-align: center; border-right: 1px solid #eee; }
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
.form-group input { width: 100%; padding: 10px 15px; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem; box-sizing: border-box; }
.input-group { display: flex; gap: 10px; }
.btn-upload { padding: 0 15px; background: #e9ecef; border: 1px solid #ddd; border-radius: 8px; cursor: pointer; color: #2c3e50; }
.disabled-input { background-color: #f0f2f5; color: #7f8c8d; cursor: not-allowed; }
.btn-save { padding: 12px 30px; background: linear-gradient(135deg, #0f0c29, #302b63); color: white; border: none; border-radius: 25px; font-size: 1rem; font-weight: bold; cursor: pointer; transition: 0.3s; margin-top: 10px; }
.btn-save:hover { transform: translateY(-2px); box-shadow: 0 4px 10px rgba(48, 43, 99, 0.3); }
@media (max-width: 768px) { .profile-card { flex-direction: column; } .profile-sidebar { width: 100%; border-right: none; border-bottom: 1px solid #eee; } }
</style>