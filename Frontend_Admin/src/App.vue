<template>
  <div class="admin-container">
    <!-- Sidebar đóng vai trò là background khi login và thanh menu khi dashboard -->
    <aside class="sidebar" :class="{ 'sidebar-full': isLoginPage }">
      <div class="logo" v-show="!isLoginPage">
        <img :src="'/logo1.jpg'" alt="Sport Store" class="sidebar-logo-img" />
        <div class="user-info" v-if="userName">
          <div class="user-name">Xin chào, {{ userName }}</div>
          <div class="user-role">({{ userRole === 'admin' ? 'Quản trị viên' : 'Nhân viên' }})</div>
        </div>
      </div>
      
      <nav v-show="!isLoginPage" class="nav-menu">
        <router-link to="/dashboard" class="nav-item"><i class="fa-solid fa-chart-line"></i> Tổng quan</router-link>
        
        <div class="menu-group">
          <div class="menu-group-title" @click="toggleMenu('business')">
            <span style="display: flex; align-items: center;">
              <i class="fa-solid fa-briefcase"></i> Kinh doanh
              <span v-if="pendingOrdersCount > 0 && !isOrderPage" class="unread-dot"></span>
            </span>
            <i class="fa-solid fa-chevron-down arrow" :class="{ 'open': openMenus.business }"></i>
          </div>
          <div class="menu-group-items" v-show="openMenus.business">
            <router-link to="/orders" class="nav-item">
              Đơn hàng
              <span v-if="pendingOrdersCount > 0 && !isOrderPage" class="unread-badge">{{ pendingOrdersCount }}</span>
            </router-link>
            <router-link to="/customers" class="nav-item">Khách hàng</router-link>
            <router-link to="/vouchers" class="nav-item">Khuyến mãi (Voucher)</router-link>
          </div>
        </div>

        <div class="menu-group">
          <div class="menu-group-title" @click="toggleMenu('warehouse')">
            <span><i class="fa-solid fa-boxes-stacked"></i> Kho hàng</span>
            <i class="fa-solid fa-chevron-down arrow" :class="{ 'open': openMenus.warehouse }"></i>
          </div>
          <div class="menu-group-items" v-show="openMenus.warehouse">
            <router-link to="/products" class="nav-item">Sản phẩm</router-link>
            <router-link to="/categories" class="nav-item">Danh mục</router-link>
            <router-link to="/sports" class="nav-item">Môn thể thao</router-link>
            <router-link to="/colors" class="nav-item">Màu sắc</router-link>
            <router-link to="/sizes" class="nav-item">Kích thước</router-link>
            <router-link to="/warehouse" class="nav-item">Nhập kho</router-link>
            <router-link to="/suppliers" class="nav-item">Nhà cung cấp</router-link>
          </div>
        </div>

        <div class="menu-group">
          <div class="menu-group-title" @click="toggleMenu('system')">
            <span style="display: flex; align-items: center;">
              <i class="fa-solid fa-gear"></i> Hệ thống
              <span v-if="unreadContactsCount > 0 && !isContactPage" class="unread-dot"></span>
            </span>
            <i class="fa-solid fa-chevron-down arrow" :class="{ 'open': openMenus.system }"></i>
          </div>
          <div class="menu-group-items" v-show="openMenus.system">
            <template v-if="isAdmin">
              <router-link to="/employees" class="nav-item">Quản lý Nhân viên</router-link>
              <router-link to="/payroll" class="nav-item">Bảng lương</router-link>
            </template>
            <template v-else>
              <router-link to="/my-payslips" class="nav-item">Lương của tôi</router-link>
            </template>
            <router-link to="/contacts" class="nav-item">
              Tin nhắn liên hệ
              <span v-if="unreadContactsCount > 0 && !isContactPage" class="unread-badge">{{ unreadContactsCount }}</span>
            </router-link>
          </div>
        </div>
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
import ContactService from "@/services/contacts.service";
import DashboardService from "@/services/dashboard.service";
import { toastState, showToast } from "@/utils/toast";

export default {
  data() {
    return {
      userRole: localStorage.getItem("user_role") || "",
      userName: localStorage.getItem("user_name") || "",
      unreadContactsCount: 0,
      pendingOrdersCount: 0,
      contactPollInterval: null,
      orderPollInterval: null,
      toastState, // Đưa state vào data để template sử dụng
      isFirstContactLoad: true, // Biến kiểm tra lần tải đầu tiên
      isFirstOrderLoad: true,
      openMenus: {
        business: true,     // Mở mặc định khi vào
        warehouse: false,
        system: false
      }
    };
  },
  computed: {
    isLoginPage() {
      return this.$route?.path === '/login' || this.$route?.name === 'login';
    },
    isAdmin() {
      return this.userRole === 'admin';
    },
    isOrderPage() {
      return this.$route?.path?.startsWith('/orders') || false;
    },
    isContactPage() {
      return this.$route?.path?.startsWith('/contacts') || false;
    }
  },
  watch: {
    $route() {
      // Cập nhật role mỗi khi chuyển trang (để xử lý trường hợp vừa login xong)
      this.userRole = localStorage.getItem("user_role") || "";
      this.userName = localStorage.getItem("user_name") || "";
      
      if (this.userRole) {
        this.fetchUnreadContacts();
        this.fetchPendingOrders();
      }
    }
  },
  methods: {
    async fetchUnreadContacts() {
      if (!this.userRole) return; // Không gọi API nếu chưa đăng nhập
      try {
        const res = await ContactService.getAll();
        const contacts = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
        const unreadCount = contacts.filter(c => c.status === 'unread').length;
        
        // Tự động mở menu Hệ thống để gây chú ý nếu có tin nhắn mới tăng lên
        if (unreadCount > this.unreadContactsCount) {
            if (!this.openMenus.system) {
                this.openMenus.system = true;
            }
            
            // Bắn thông báo nổi và phát âm thanh (Bỏ qua lần load trang đầu tiên)
            if (!this.isFirstContactLoad) {
                if (!this.isContactPage) {
                    showToast("Bạn có tin nhắn liên hệ mới từ khách hàng!", "success");
                }
                try {
                    new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg').play();
                } catch (e) { /* Bỏ qua nếu trình duyệt chặn tự động phát âm thanh */ }
            }
        }
        this.unreadContactsCount = unreadCount;
        this.isFirstContactLoad = false;
      } catch (error) {
        console.error("Lỗi đếm tin nhắn chưa đọc:", error);
      }
    },
    async fetchPendingOrders() {
      if (!this.userRole) return; 
      try {
        const data = await DashboardService.getSummary();
        const distribution = data.orderStatusDistribution || [];
        const pending = distribution.find(s => s.status === 'pending');
        const pendingCount = pending ? pending.count : 0;
        
        if (pendingCount > this.pendingOrdersCount) {
            if (!this.openMenus.business) {
                this.openMenus.business = true;
            }
            if (!this.isFirstOrderLoad) {
                if (!this.isOrderPage) {
                    showToast("Bạn có đơn hàng mới đang chờ xử lý!", "success");
                }
                try { new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg').play(); } catch (e) {}
            }
        }
        this.pendingOrdersCount = pendingCount;
        this.isFirstOrderLoad = false;
      } catch (error) {
        console.error("Lỗi đếm đơn hàng:", error);
      }
    },
    toggleMenu(menu) {
      this.openMenus[menu] = !this.openMenus[menu];
    },
    handleLogout() {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("user_role");
      localStorage.removeItem("user_name");
      this.$router.push("/login");
    }
  },
  mounted() {
    this.fetchUnreadContacts();
    this.fetchPendingOrders();
    // Thiết lập quét tin nhắn mới mỗi 15 giây
    this.contactPollInterval = setInterval(this.fetchUnreadContacts, 15000); 
    this.orderPollInterval = setInterval(this.fetchPendingOrders, 15000); 
  },
  unmounted() {
    if (this.contactPollInterval) clearInterval(this.contactPollInterval);
    if (this.orderPollInterval) clearInterval(this.orderPollInterval);
  }
}
</script>

<style>
body { margin: 0; font-family: Arial, sans-serif; }
.admin-container { display: flex; height: 100vh; }
.sidebar {
    width: 260px;
    background: #1e1e2d; /* Màu nền hiện đại, chuyên nghiệp */
    color: #9899ac;
    padding: 20px 0;
    box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    flex-shrink: 0;
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
    background: linear-gradient(180deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
}

.logo { 
    font-weight: bold; 
    font-size: 22px; 
    margin-bottom: 40px; 
    text-align: center; 
    letter-spacing: 2px;
    color: #ffffff;
    padding: 0 20px;
}
.sidebar-logo-img {
    max-width: 100%;
    height: 65px;
    object-fit: contain;
    margin-bottom: 10px;
}
.user-info { 
    margin-top: 15px; 
    padding: 12px; 
    background: #1b1b29; 
    border-radius: 8px; 
    border: 1px solid #2b2b40;
    font-size: 13px;
    color: #9899ac;
}
.user-name { color: #ffffff; font-weight: 600; margin-bottom: 4px; }
.user-role { font-size: 12px; color: #888c9f; font-style: italic; }

.nav-menu {
    flex: 1;
    overflow-y: auto;
    padding: 0 15px;
}

/* Tùy chỉnh thanh cuộn cho Menu */
.nav-menu::-webkit-scrollbar { width: 4px; }
.nav-menu::-webkit-scrollbar-thumb { background: #323248; border-radius: 4px; }
.nav-menu::-webkit-scrollbar-track { background: transparent; }

.nav-item { display: flex; align-items: center; color: #9899ac; text-decoration: none; padding: 10px 15px; margin-bottom: 4px; border-radius: 6px; width: 100%; text-align: left; border: none; background: transparent; font-size: 14px; font-weight: 500; cursor: pointer; box-sizing: border-box; font-family: 'Segoe UI', sans-serif; transition: all 0.3s ease; }
.nav-item i { font-size: 1.1rem; margin-right: 12px; width: 20px; text-align: center; }
.nav-item:hover { background-color: #1b1b29; color: #ffffff; }
.router-link-active { color: #3699ff; background-color: rgba(54, 153, 255, 0.1); }

.menu-group { margin-bottom: 10px; }
.menu-group-title {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 15px; color: #6c6e86; font-size: 12px;
  font-weight: 600; text-transform: uppercase; cursor: pointer;
  letter-spacing: 0.5px; transition: all 0.3s; margin-top: 10px;
  border-radius: 6px;
}
.menu-group-title:hover { color: #ffffff; background: #1b1b29; }
.menu-group-title span i { margin-right: 12px; width: 20px; text-align: center; font-size: 1.1rem; }
.menu-group-title .arrow { font-size: 10px; transition: transform 0.3s; }
.menu-group-title .arrow.open { transform: rotate(180deg); }
.menu-group-items { overflow: hidden; margin-top: 4px; }
.menu-group-items .nav-item {
  padding-left: 45px;
  font-size: 13px;
  color: #888c9f;
  position: relative;
}
.menu-group-items .nav-item::before {
    content: ''; position: absolute; left: 24px; top: 50%; transform: translateY(-50%);
    width: 4px; height: 4px; border-radius: 50%; background-color: #494b74; transition: background-color 0.3s;
}
.menu-group-items .nav-item:hover { background: transparent; color: #ffffff; }
.menu-group-items .router-link-active { color: #3699ff; background: transparent; }
.menu-group-items .router-link-active::before { background-color: #3699ff; }

.logout-btn { margin: 20px 15px; background: rgba(246, 78, 96, 0.1); color: #f64e60; text-align: center; justify-content: center; font-weight: 600; border-radius: 6px; }
.logout-btn:hover { background: #f64e60; color: #ffffff; transform: translateY(-1px); box-shadow: 0 4px 10px rgba(246, 78, 96, 0.3); }

.unread-badge {
  background-color: #f64e60;
  color: white;
  font-size: 11px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: auto; /* Đẩy badge sang sát mép phải */
  min-width: 14px;
  text-align: center;
  animation: pulse-badge 2s infinite;
}

.unread-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  background-color: #f64e60;
  border-radius: 50%;
  margin-left: 8px;
  animation: pulse-badge 2s infinite;
}

@keyframes pulse-badge {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(246, 78, 96, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(246, 78, 96, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(246, 78, 96, 0); }
}

.main-content { 
    flex: 1; 
    padding: 30px; 
    background: linear-gradient(rgba(243, 246, 249, 0), rgba(243, 246, 249, 0)), url('https://static.kienviet.net/storage/uploads/2023/12/san-van-dong-future-camp-nou-o-barcelona-nhan-giai-thuong-kien-truc-quoc-te-iaa-2023_2.jpg') no-repeat center center; 
    background-size: cover;
    background-attachment: fixed;
    overflow-y: auto; 
}

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
  background: #333; /* Màu nền mặc định phòng hờ */
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
.toast-notification.warning {
  background: linear-gradient(135deg, #f1c40f, #f39c12);
  color: #fff;
}
.toast-notification.info {
  background: linear-gradient(135deg, #9b59b6, #8e44ad);
}
</style>