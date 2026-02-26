<template>
  <div class="login-container">
    <div class="login-box">
      <h2>Đăng nhập Khách hàng</h2>
      <form @submit.prevent="handleLogin">
        <input type="email" v-model="email" required placeholder="Email" />
        <input type="password" v-model="password" required placeholder="Mật khẩu" />
        <button type="submit" class="btn-login">Đăng nhập</button>
      </form>
      <p class="register-link">
        Chưa có tài khoản? <router-link to="/register">Đăng ký ngay</router-link>
      </p>
    </div>
  </div>
</template>

<script>
import AuthService from "@/services/auth.service";
import { showToast } from "@/utils/toast";

export default {
  data() {
    return {
      email: "",
      password: ""
    };
  },
  methods: {
    async handleLogin() {
      try {
        const response = await AuthService.login({ email: this.email, password: this.password });
        if (response.token) {
            localStorage.setItem("user_token", response.token);
            localStorage.setItem("user_name", response.user.last_name + " " + response.user.first_name);
            localStorage.setItem("user_email", response.user.email);
            if (response.user.phone) {
                localStorage.setItem("user_phone", response.user.phone);
            }
            if (response.user.avatar) {
                localStorage.setItem("user_avatar", response.user.avatar);
            }
            showToast("Đăng nhập thành công!", "success");
            
            // Kiểm tra xem có trang cần redirect không, nếu không thì về trang chủ
            const redirectPath = this.$route.query.redirect || "/";
            this.$router.push(redirectPath);
        }
      } catch (error) {
        showToast(error.response?.data?.message || "Email hoặc mật khẩu không đúng!", "error");
      }
    }
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #ffffff, #ffffff, #ffffff);
}
.login-box { background: rgba(15, 12, 41, 0.7); backdrop-filter: blur(15px); border: 1px solid rgba(255,255,255,0.1); padding: 40px; border-radius: 15px; box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37); width: 100%; max-width: 400px; color: white; text-align: center; }

h2 { margin-bottom: 30px; font-weight: bold; letter-spacing: 1px; }

input { width: 100%; margin-bottom: 20px; padding: 12px 20px; border: 1px solid rgba(255,255,255,0.2); border-radius: 25px; background: rgba(255, 255, 255, 0.05); color: white; box-sizing: border-box; transition: 0.3s; font-size: 15px; }
input:focus { border-color: #00c6ff; background: rgba(255, 255, 255, 0.1); outline: none; box-shadow: 0 0 10px rgba(0, 198, 255, 0.3); }

button { width: 100%; padding: 12px; background: linear-gradient(to right, #00c6ff, #0072ff); color: white; border: none; cursor: pointer; border-radius: 25px; font-weight: bold; transition: 0.3s; box-shadow: 0 4px 15px rgba(0, 114, 255, 0.3); font-size: 16px; }
button:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0, 114, 255, 0.5); }

.register-link { margin-top: 20px; font-size: 0.9rem; color: rgba(255,255,255,0.7); }
.register-link a { color: #00c6ff; text-decoration: none; font-weight: bold; transition: 0.3s; }
.register-link a:hover { text-decoration: underline; color: #0072ff; }

/* Placeholder color */
::placeholder {
  color: rgba(255, 255, 255, 0.5);
}
</style>