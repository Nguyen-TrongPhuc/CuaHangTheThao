<template>
  <header class="app-header">
    <div class="container">
      <!-- Logo -->
      <router-link to="/" class="logo">
        <i class="fa-solid fa-dumbbell"></i> SportStore
      </router-link>

      <!-- Search Bar -->
      <div class="search-bar">
        <input 
          type="text" 
          v-model="searchQuery" 
          @keyup.enter="handleSearch"
          placeholder="Tìm kiếm sản phẩm..." 
        />
        <button @click="handleSearch"><i class="fa-solid fa-magnifying-glass"></i></button>
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
          <i class="fa-solid fa-cart-shopping"></i>
          <span class="cart-count" v-if="cartTotal > 0">{{ cartTotal }}</span>
        </router-link>

        <!-- User Auth -->
        <div v-if="isLoggedIn" class="user-dropdown">
          <span class="user-name" @click="toggleDropdown">
            <i class="fa-solid fa-user-circle"></i> {{ userName }}
          </span>
          <div v-if="showDropdown" class="dropdown-menu">
            <router-link to="/profile" class="dropdown-item">Hồ sơ cá nhân</router-link>
            <router-link to="/orders" class="dropdown-item">Lịch sử đơn hàng</router-link>
            <a @click="logout" class="dropdown-item">Đăng xuất</a>
          </div>
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

export default {
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
  padding: 15px 0;
}

.container {
  max-width: 1200px;
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

.search-bar {
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border-radius: 25px;
  padding: 5px 15px;
  width: 300px;
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
}

.nav-links { display: flex; gap: 20px; }
.nav-links a { text-decoration: none; color: #333; font-weight: 500; transition: color 0.3s; position: relative; }
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

.cart-btn { position: relative; color: #333; font-size: 1.2rem; }
.cart-count {
  position: absolute; top: -8px; right: -8px;
  background: #e74c3c; color: white; font-size: 0.7rem;
  width: 18px; height: 18px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
}

.auth-links a { text-decoration: none; color: #333; font-weight: 500; }
.divider { margin: 0 5px; color: #ccc; }

.user-dropdown { position: relative; cursor: pointer; }
.user-name { font-weight: 600; color: #302b63; }
.dropdown-menu {
  position: absolute; top: 100%; right: 0;
  background: white; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  border-radius: 5px; width: 180px; margin-top: 10px; overflow: hidden;
}
.dropdown-item { display: block; padding: 10px 15px; text-decoration: none; color: #333; transition: background 0.2s; cursor: pointer; }
.dropdown-item:hover { background: #f5f5f5; }

@media (max-width: 768px) {
  .container { flex-direction: column; gap: 15px; }
  .search-bar { width: 100%; }
  .nav-links { width: 100%; justify-content: space-between; font-size: 0.9rem; }
}
</style>