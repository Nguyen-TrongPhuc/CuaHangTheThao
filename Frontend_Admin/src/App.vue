<template>
  <div class="admin-container">
    <!-- Sidebar đóng vai trò là background khi login và thanh menu khi dashboard -->
    <aside class="sidebar" :class="{ 'sidebar-full': isLoginPage }">
      <div class="logo" v-show="!isLoginPage">
        SPORT STORE
        <div class="user-info" v-if="userName">
          <div class="user-name">Xin chào, {{ userName }}</div>
          <div class="user-role">({{ userRole === 'admin' ? 'Quản trị viên' : 'Nhân viên' }})</div>
        </div>
      </div>
      
      <nav v-show="!isLoginPage" class="nav-menu">
        <router-link to="/dashboard" class="nav-item">Tổng quan</router-link>
        <router-link to="/categories" class="nav-item">Quản lý Danh mục</router-link>
        <router-link to="/sports" class="nav-item">Quản lý Môn thể thao</router-link>
        <router-link to="/products" class="nav-item">Quản lý Sản phẩm</router-link>
        <router-link to="/orders" class="nav-item">Quản lý Đơn hàng</router-link>
        <router-link to="/customers" class="nav-item">Quản lý Khách hàng</router-link>
        <router-link v-if="isAdmin" to="/employees" class="nav-item">Quản lý Nhân viên</router-link>
      </nav>
      <button v-show="!isLoginPage" class="nav-item logout-btn" @click="handleLogout">Đăng xuất</button>
    </aside>
    
    <main class="main-content" :class="{ 'content-login-mode': isLoginPage }">
      <router-view v-slot="{ Component }">
        <transition name="page-transition" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Toast Notification -->
    <div class="toast-notification" :class="[toastState.type, { show: toastState.visible }]">
      {{ toastState.message }}
    </div>
  </div>
</template>

<script>
import { toastState } from "@/utils/toast";

export default {
  data() {
    return {
      userRole: localStorage.getItem("user_role") || "",
      userName: localStorage.getItem("user_name") || "",
      toastState // Đưa state vào data để template sử dụng
    };
  },
  computed: {
    isLoginPage() {
      return this.$route.path === '/login' || this.$route.name === 'login';
    },
    isAdmin() {
      return this.userRole === 'admin';
    }
  },
  watch: {
    $route() {
      // Cập nhật role mỗi khi chuyển trang (để xử lý trường hợp vừa login xong)
      this.userRole = localStorage.getItem("user_role") || "";
      this.userName = localStorage.getItem("user_name") || "";
    }
  },
  methods: {
    handleLogout() {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("user_role");
      localStorage.removeItem("user_name");
      this.$router.push("/login");
    }
  }
}
</script>

<style>
body { margin: 0; font-family: Arial, sans-serif; }
.admin-container { display: flex; height: 100vh; }
.sidebar {
    width: 260px; /* Kích thước mặc định khi là Dashboard */
    background: linear-gradient(180deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
    color: white;
    padding: 20px;
    box-shadow: 5px 0 15px rgba(0, 0, 0, 0.3);
    transition: all 0.8s cubic-bezier(0.25, 0.8, 0.25, 1); /* Hiệu ứng trượt mượt mà */
    flex-shrink: 0;
    overflow: hidden;
    z-index: 10;
    display: flex;
    flex-direction: column;
}

/* Khi ở trang Login, Sidebar mở rộng full màn hình */
.sidebar-full {
    width: 100vw;
    padding: 0;
    display: flex;
    justify-content: center;
    align-items: center;
}

.logo { 
    font-weight: bold; 
    font-size: 24px; 
    margin-bottom: 40px; 
    text-align: center; 
    letter-spacing: 2px;
    text-transform: uppercase;
    background: linear-gradient(to right, #00c6ff, #0072ff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: 0 2px 10px rgba(0, 198, 255, 0.3);
}
.user-info { 
    margin-top: 20px; 
    padding: 15px; 
    background: rgba(255,255,255,0.05); 
    border-radius: 10px; 
    border: 1px solid rgba(255,255,255,0.1);
}
.user-role { font-size: 12px; color: #ecf0f1; margin-top: 5px; font-style: italic; }
.nav-item { display: block; color: rgba(255,255,255,0.8); text-decoration: none; padding: 12px 15px; margin-bottom: 8px; border-radius: 0 25px 25px 0; width: 100%; text-align: left; border: none; background: transparent; font-size: 16px; cursor: pointer; box-sizing: border-box; font-family: 'Segoe UI', sans-serif; transition: all 0.3s ease; border-left: 4px solid transparent; }
.nav-item:hover, .router-link-active { 
    background: linear-gradient(90deg, rgba(255,255,255,0.1), transparent); 
    color: white;
    border-left-color: #00c6ff;
    padding-left: 20px;
    text-shadow: 0 0 8px rgba(255,255,255,0.5);
}
.logout-btn { margin-top: auto; background: linear-gradient(135deg, #FF512F, #DD2476); text-align: center; transition: 0.3s; box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
.logout-btn:hover { background: linear-gradient(135deg, #DD2476, #FF512F); box-shadow: 0 4px 10px rgba(0,0,0,0.3); transform: translateY(-1px); }
.main-content { flex: 1; padding: 30px; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
 overflow-y: auto; }

/* Khi ở chế độ Login, Main Content nằm đè lên Sidebar (để hiển thị Form) */
.content-login-mode { 
    padding: 0; 
    position: fixed; 
    top: 0; 
    left: 0; 
    width: 100%; 
    height: 100%; 
    z-index: 20; 
    background: transparent; /* Trong suốt để nhìn thấy nền Sidebar */
    pointer-events: none; /* Để không chặn click chuột nếu cần, nhưng form bên trong sẽ bật lại */
}

/* Hiệu ứng chuyển trang mượt mà */
.page-transition-enter-active,
.page-transition-leave-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
}
.page-transition-enter-from,
.page-transition-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* Toast Styles */
.toast-notification {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 15px 25px;
  border-radius: 8px;
  color: white;
  font-weight: bold;
  z-index: 9999;
  transform: translateX(150%);
  transition: transform 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55);
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}
.toast-notification.show {
  transform: translateX(0);
}
.toast-notification.success {
  background: linear-gradient(135deg, #00c6ff, #0072ff);
}
.toast-notification.error {
  background: linear-gradient(135deg, #FF512F, #DD2476);
}
</style>