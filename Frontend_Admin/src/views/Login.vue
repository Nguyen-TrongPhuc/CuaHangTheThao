<template>
  <div class="login-container">
    <div class="login-box">
      <h2>Admin SportStore</h2>
      <form @submit.prevent="handleLogin">
        <input v-model="admin_code" type="text" placeholder="Mã Admin" required />
        <input v-model="password" type="password" placeholder="Mật khẩu" required />
        <button type="submit">Đăng nhập</button>
      </form>
    </div>
  </div>
</template>

<script>
import AuthService from "@/services/auth.service";
import { showToast } from "@/utils/toast";

export default {
  data() {
    return { admin_code: "", password: "" };
  },
  methods: {
    async handleLogin() {
      try {
        const response = await AuthService.login({ admin_code: this.admin_code, password: this.password });
        if (response.token) {
          // Lưu token vào localStorage để dùng cho các yêu cầu sau
          localStorage.setItem("admin_token", response.token);
          localStorage.setItem("user_role", response.user.role); // Lưu quyền hạn
          localStorage.setItem("user_name", response.user.full_name); // Lưu tên hiển thị
          showToast("Đăng nhập thành công!", "success");
          this.$router.push("/dashboard"); // Chuyển vào trang quản trị
        }
      } catch (error) {
        showToast("Mã Admin hoặc mật khẩu không đúng!", "error");
      }
    }
  }
}
</script>

<style scoped>
/* CSS cho trang login canh giữa màn hình */
.login-container { display: flex; height: 100vh; justify-content: center; align-items: center; background: transparent; pointer-events: auto; }
.login-box { background: rgba(15, 12, 41, 0.7); backdrop-filter: blur(15px); border: 1px solid rgba(255,255,255,0.1); padding: 40px; border-radius: 15px; box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37); width: 350px; color: white; text-align: center; }
input { width: 100%; margin-bottom: 20px; padding: 12px; border: 1px solid rgba(255,255,255,0.2); border-radius: 25px; background: rgba(255, 255, 255, 0.05); color: white; box-sizing: border-box; transition: 0.3s; }
input:focus { border-color: #00c6ff; background: rgba(255, 255, 255, 0.1); outline: none; box-shadow: 0 0 10px rgba(0, 198, 255, 0.3); }
button { width: 100%; padding: 12px; background: linear-gradient(to right, #00c6ff, #0072ff); color: white; border: none; cursor: pointer; border-radius: 25px; font-weight: bold; transition: 0.3s; box-shadow: 0 4px 15px rgba(0, 114, 255, 0.3); }
button:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0, 114, 255, 0.5); }
</style>