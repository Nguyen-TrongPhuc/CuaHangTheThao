<template>
  <div class="register-container">
    <div class="register-box">
      <h2>Đăng ký Tài khoản</h2>
      <form @submit.prevent="handleRegister">
        <div class="form-row">
            <input type="text" v-model="user.last_name" required placeholder="Họ" class="half" />
            <input type="text" v-model="user.first_name" required placeholder="Tên" class="half" />
        </div>

        <input type="email" v-model="user.email" required placeholder="Email" />
        <input type="text" v-model="user.phone" required placeholder="Số điện thoại" />
        <input type="text" v-model="user.address" required placeholder="Địa chỉ" />
        <input type="password" v-model="user.password" required placeholder="Mật khẩu" />

        <button type="submit" class="btn-register">Đăng ký</button>
      </form>
      <p class="login-link">
        Đã có tài khoản? <router-link to="/login">Đăng nhập ngay</router-link>
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
      user: {
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        address: "",
        password: "",
        customer_type: "member"
      }
    };
  },
  methods: {
    isValidPhone(phone) {
      const phoneRegex = /^0\d{9}$/;
      return phoneRegex.test(phone);
    },
    async handleRegister() {
      if (!this.isValidPhone(this.user.phone)) {
        showToast("Số điện thoại không hợp lệ (phải có 10 số và bắt đầu bằng 0)", "error");
        return;
      }

      try {
        await AuthService.register(this.user);
        showToast("Đăng ký thành công! Vui lòng đăng nhập.", "success");
        this.$router.push("/login");
      } catch (error) {
        console.log(error);
        showToast(error.response?.data?.message || "Đăng ký thất bại.", "error");
      }
    }
  }
};
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #ffffff, #ffffff, #ffffff);
}
.register-box { background: rgba(15, 12, 41, 0.7); backdrop-filter: blur(15px); border: 1px solid rgba(255,255,255,0.1); padding: 40px; border-radius: 15px; box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37); width: 100%; max-width: 450px; color: white; text-align: center; }

h2 { margin-bottom: 30px; font-weight: bold; letter-spacing: 1px; }

.form-row { display: flex; gap: 15px; margin-bottom: 0; }

input { width: 100%; margin-bottom: 20px; padding: 12px 20px; border: 1px solid rgba(255,255,255,0.2); border-radius: 25px; background: rgba(255, 255, 255, 0.05); color: white; box-sizing: border-box; transition: 0.3s; font-size: 15px; }
input:focus { border-color: #00c6ff; background: rgba(255, 255, 255, 0.1); outline: none; box-shadow: 0 0 10px rgba(0, 198, 255, 0.3); }

button { width: 100%; padding: 12px; background: linear-gradient(to right, #00c6ff, #0072ff); color: white; border: none; cursor: pointer; border-radius: 25px; font-weight: bold; transition: 0.3s; box-shadow: 0 4px 15px rgba(0, 114, 255, 0.3); font-size: 16px; }
button:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0, 114, 255, 0.5); }

.login-link { margin-top: 20px; font-size: 0.9rem; color: rgba(255,255,255,0.7); }
.login-link a { color: #00c6ff; text-decoration: none; font-weight: bold; transition: 0.3s; }
.login-link a:hover { text-decoration: underline; color: #0072ff; }

/* Placeholder color */
::placeholder {
  color: rgba(255, 255, 255, 0.5);
}
</style>