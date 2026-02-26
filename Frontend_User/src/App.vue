<template>
  <div id="app">
    <router-view v-slot="{ Component }">
      <transition name="page-transition" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>

    <div v-if="toast.isVisible" :class="['toast-notification', toast.type, { show: toast.isVisible }]">
      {{ toast.message }}
    </div>
  </div>
</template>

<script>
import { toastState } from "@/utils/toast";

export default {
  setup() {
    return { toast: toastState };
  }
}
</script>

<style>
/* 1. XÓA BỎ KHOẢNG TRẮNG MẶC ĐỊNH CỦA TRÌNH DUYỆT */
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  min-height: 100vh;
  overflow-x: hidden; /* Chống tràn ngang */
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); /* Nền sáng hiện đại giống Admin Content */
}

/* 2. ĐỊNH DẠNG LẠI ID #APP ĐỂ BUNG TOÀN MÀN HÌNH */
#app {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  
  /* Quan trọng: Xóa các giới hạn kích thước */
  max-width: none !important; 
  margin: 0 !important;
  padding: 0 !important;
  width: 100%;
  display: block; /* Tránh dùng grid/flex căn giữa toàn bộ app */
}

/* 3. STYLE CHO TOAST (GALAXY STYLE - GIỐNG ADMIN) */
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
.toast-notification.warning {
  background: linear-gradient(135deg, #f1c40f, #f39c12);
}

/* 4. HIỆU ỨNG CHUYỂN TRANG */
.page-transition-enter-active,
.page-transition-leave-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
}
.page-transition-enter-from,
.page-transition-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>