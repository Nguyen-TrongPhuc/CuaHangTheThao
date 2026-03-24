<template>
  <header class="app-header">
    <div class="container">
      <!-- Logo -->
      <router-link to="/" class="logo">
        
        <img src="/logo.jpg" alt="SportStore Logo" class="img-logo" />
       
      </router-link>

      <!-- Search Bar -->
      <div class="search-bar">
        <input 
          type="text" 
          v-model="searchQuery" 
          @keyup.enter="handleSearch"
          placeholder="Tìm kiếm sản phẩm..." 
        />
        <button @click="handleSearch"><Search :size="20" /></button>
      </div>

      <!-- Navigation -->
      <nav class="nav-links">
        <router-link to="/" class="home-link">Trang chủ</router-link>
        <router-link to="/products">Sản phẩm</router-link>
        <router-link to="/about">Giới thiệu</router-link>
        <router-link to="/contact">Liên hệ</router-link>
      </nav>

      <!-- User & Cart -->
      <div class="user-actions">
        <!-- Cart -->
        <router-link to="/cart" class="cart-btn">
          <ShoppingCart :size="24" />
          <span class="cart-count" v-if="cartTotal > 0">{{ cartTotal }}</span>
        </router-link>

        <!-- User Auth -->
        <div v-if="isLoggedIn" class="user-dropdown">
          <span class="user-name" @click="toggleDropdown">
            <CircleUser :size="20" style="margin-right: 5px;" /> {{ userName }}
          </span>
          <transition name="dropdown-fade">
            <div v-if="showDropdown" class="dropdown-menu">
              <div class="dropdown-header">Xin chào, {{ userName }}</div>
              <router-link to="/profile" class="dropdown-item"><UserCog :size="18" /> Hồ sơ cá nhân</router-link>
              <router-link to="/orders" class="dropdown-item"><Package :size="18" /> Lịch sử đơn hàng</router-link>
              <div class="dropdown-divider"></div>
              <a @click="logout" class="dropdown-item text-danger"><LogOut :size="18" /> Đăng xuất</a>
            </div>
          </transition>
        </div>
        <div v-else class="auth-links">
          <router-link to="/login">Đăng nhập</router-link>
          <span class="divider">|</span>
          <router-link to="/register">Đăng ký</router-link>
        </div>
      </div>
    </div>
  </header>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { cartStore } from "@/utils/cart";
import { Search, ShoppingCart, CircleUser, UserCog, Package, LogOut } from "lucide-vue-next";

export default {
  components: { Search, ShoppingCart, CircleUser, UserCog, Package, LogOut },
  setup() {
    const router = useRouter();
    const searchQuery = ref("");
    const isLoggedIn = ref(false);
    const userName = ref("");
    const showDropdown = ref(false);

    const checkLogin = () => {
      const token = localStorage.getItem("user_token");
      if (token) {
        isLoggedIn.value = true;
        userName.value = localStorage.getItem("user_name") || "User";
      } else {
        isLoggedIn.value = false;
        userName.value = "";
      }
    };

    const handleSearch = () => {
      if (searchQuery.value.trim()) {
        // Chuyển hướng sang trang tìm kiếm với query param 'q'
        router.push({ name: 'product.search', query: { q: searchQuery.value } });
        searchQuery.value = ""; // Xóa ô tìm kiếm sau khi enter
      }
    };

    const logout = () => {
      localStorage.removeItem("user_token");
      localStorage.removeItem("user_name");
      localStorage.removeItem("user_avatar");
      localStorage.removeItem("user_role");
      isLoggedIn.value = false;
      showDropdown.value = false;
      router.push("/login");
    };

    const toggleDropdown = () => {
      showDropdown.value = !showDropdown.value;
    };

    // Đóng dropdown khi click ra ngoài
    const closeDropdown = (e) => {
        if (!e.target.closest('.user-dropdown')) {
            showDropdown.value = false;
        }
    };

    onMounted(() => {
      checkLogin();
      window.addEventListener('click', closeDropdown);
      // Lắng nghe sự kiện storage để cập nhật trạng thái đăng nhập giữa các tab hoặc component khác
      window.addEventListener('storage', checkLogin);
    });

    onUnmounted(() => {
        window.removeEventListener('click', closeDropdown);
        window.removeEventListener('storage', checkLogin);
    });

    return {
      searchQuery,
      handleSearch,
      cartTotal: cartStore.totalItems, // Reactive từ cartStore
      isLoggedIn,
      userName,
      logout,
      showDropdown,
      toggleDropdown
    };
  }
};
</script>

<style scoped>
.app-header {
  background-color: #fff;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
  padding: 10px 0; /* Giảm padding một chút để cân bằng với logo lớn hơn */
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  color: #302b63;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 10px;
}

.img-logo {
  height: 75px; /* Tăng đáng kể chiều cao của logo */
  width: auto;
  object-fit: contain;
  transition: transform 0.3s ease;
}

.img-logo:hover {
  transform: scale(1.05); /* Thêm hiệu ứng phóng to nhẹ khi di chuột */
}

.search-bar {
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border-radius: 25px;
  padding: 5px 15px;
  width: 400px;
}

.search-bar input {
  border: none;
  background: transparent;
  flex: 1;
  padding: 8px;
  outline: none;
}

.search-bar button {
  background: none;
  border: none;
  cursor: pointer;
  color: #555;
  font-size: 1.2rem;
}

.nav-links { display: flex; gap: 25px; }
.nav-links a { text-decoration: none; color: #333; font-weight: 500; transition: color 0.3s; position: relative; font-size: 1.1rem; }
.nav-links a:hover { color: #302b63; }

/* Active link styling */
.nav-links a:not(.home-link).router-link-active,
.nav-links a.home-link.router-link-exact-active {
  color: #e74c3c;
  font-weight: 700;
}
.nav-links a:not(.home-link).router-link-active::after,
.nav-links a.home-link.router-link-exact-active::after {
  content: ''; position: absolute; bottom: -5px; left: 0; width: 100%; height: 2px; background: #e74c3c;
}

.user-actions { display: flex; align-items: center; gap: 20px; }

.cart-btn { position: relative; color: #333; font-size: 1.5rem; display: flex; align-items: center; }
.cart-count {
  position: absolute; top: -8px; right: -8px;
  background: #e74c3c; color: white; font-size: 0.7rem;
  width: 20px; height: 20px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: bold;
}

.auth-links a { text-decoration: none; color: #333; font-weight: 500; }
.divider { margin: 0 5px; color: #ccc; }

.user-dropdown { position: relative; cursor: pointer; }
.user-name { font-weight: 600; color: #2c3e50; font-size: 1.05rem; display: flex; align-items: center; gap: 5px; padding: 6px 12px; border-radius: 20px; transition: background 0.3s; }
.user-name:hover { background: #f5f5f5; }

.dropdown-menu {
  position: absolute; top: calc(100% + 10px); right: 0;
  background: white; box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  border-radius: 12px; width: 220px; overflow: visible;
  border: 1px solid #eee; z-index: 1000;
  transform-origin: top right;
}

.dropdown-menu::before {
  content: ''; position: absolute; top: -6px; right: 20px;
  width: 12px; height: 12px; background: white;
  transform: rotate(45deg); border-left: 1px solid #eee; border-top: 1px solid #eee;
}

.dropdown-header {
  padding: 15px; background: #f8f9fa; border-bottom: 1px solid #eee;
  font-weight: 700; color: #2c3e50; font-size: 0.95rem; text-align: center;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; border-radius: 12px 12px 0 0;
}

.dropdown-item { display: flex; align-items: center; gap: 10px; padding: 12px 20px; text-decoration: none; color: #555; transition: all 0.2s; cursor: pointer; font-weight: 500; font-size: 0.95rem; }
.dropdown-item:hover { background: #fff5f1; color: #ee4d2d; padding-left: 25px; }
.dropdown-item.text-danger:hover { background: #fee2e2; color: #e74c3c; }

.dropdown-divider { height: 1px; background: #eee; margin: 5px 0; }

.dropdown-fade-enter-active, .dropdown-fade-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.dropdown-fade-enter-from, .dropdown-fade-leave-to { opacity: 0; transform: translateY(-10px) scale(0.95); }

@media (max-width: 768px) {
  .container { flex-direction: column; gap: 15px; }
  .search-bar { width: 100%; }
  .nav-links { width: 100%; justify-content: space-between; font-size: 0.9rem; }
}
</style>