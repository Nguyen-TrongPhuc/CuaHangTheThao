<template>
  <div class="forgot-container">
    <div class="forgot-box">
      <h2>🔐 Khôi phục mật khẩu</h2>
      
      <!-- Progress Indicator -->
      <div class="progress-indicator">
        <div :class="['step', { active: step >= 1, done: step > 1 }]">
          <span>1</span>
          <p>Email</p>
        </div>
        <div class="line" :class="{ done: step > 1 }"></div>
        <div :class="['step', { active: step >= 2, done: step > 2 }]">
          <span>2</span>
          <p>OTP</p>
        </div>
        <div class="line" :class="{ done: step > 2 }"></div>
        <div :class="['step', { active: step === 3 }]">
          <span>3</span>
          <p>Mật khẩu</p>
        </div>
      </div>
      
      <!-- Bước 1: Nhập Email -->
      <form v-if="step === 1" @submit.prevent="sendOtp">
        <p class="instruction">📧 Nhập email đã đăng ký để nhận mã xác thực OTP.</p>
        <input type="email" v-model="email" required placeholder="Nhập địa chỉ Email" />
        <button type="submit" class="btn-submit" :disabled="isLoading">
            {{ isLoading ? '⏳ Đang gửi...' : '📤 Gửi mã OTP' }}
        </button>
      </form>

      <!-- Bước 2: Nhập OTP và xác thực -->
      <form v-if="step === 2" @submit.prevent="verifyOtp">
        <p class="instruction">✅ Mã OTP đã được gửi đến <strong>{{ email }}</strong></p>
        
        <div class="input-group">
          <label>🔑 Mã OTP (6 chữ số):</label>
          <input type="text" v-model="otp" required placeholder="000000" maxlength="6" @input="otp = otp.replace(/[^0-9]/g, '')" />
          <small class="help-text">Mã OTP hết hạn sau 5 phút</small>
        </div>
        
        <button type="submit" class="btn-submit" :disabled="isLoading || !otp">
            {{ isLoading ? '⏳ Đang xác thực...' : '✅ Xác thực OTP' }}
        </button>
        
        <div class="resend-link">
          <a href="#" @click.prevent="step = 1">↩️ Gửi lại mã / Nhập lại email</a>
        </div>
      </form>

      <!-- Bước 3: Nhập mật khẩu mới -->
      <form v-if="step === 3" @submit.prevent="resetPassword">
        <p class="instruction">🔐 Tạo mật khẩu mới cho tài khoản <strong>{{ email }}</strong></p>
        
        <div class="input-group password-wrapper">
          <label>🔒 Mật khẩu mới:</label>
          <input
            :type="showNewPwd ? 'text' : 'password'"
            v-model="newPassword"
            required
            placeholder="Ít nhất 8 ký tự (Hoa, thường, số, ký tự đặc biệt)"
          />
          <i
            :class="['fa-solid', showNewPwd ? 'fa-eye-slash' : 'fa-eye']"
            class="toggle-pwd"
            @click="showNewPwd = !showNewPwd"
          ></i>
        </div>

        <div class="input-group password-wrapper">
          <label>🔒 Nhập lại mật khẩu:</label>
          <input
            :type="showConfirmPwd ? 'text' : 'password'"
            v-model="confirmPassword"
            required
            placeholder="Nhập lại mật khẩu mới"
          />
          <i
            :class="['fa-solid', showConfirmPwd ? 'fa-eye-slash' : 'fa-eye']"
            class="toggle-pwd"
            @click="showConfirmPwd = !showConfirmPwd"
          ></i>
        </div>

        <button type="submit" class="btn-submit" :disabled="isLoading">
            {{ isLoading ? '⏳ Đang xử lý...' : '💾 Lưu mật khẩu mới' }}
        </button>
        
        <div class="resend-link">
          <a href="#" @click.prevent="step = 2">↩️ Quay lại nhập lại OTP</a>
        </div>
      </form>

      <p class="back-link">
        <router-link to="/login"><i class="fa-solid fa-arrow-left"></i> Quay lại đăng nhập</router-link>
      </p>
    </div>
  </div>
</template>

<script>
import AuthService from "@/services/auth.service"; // Giả sử AuthService có các hàm này
import { showToast } from "@/utils/toast";

export default {
  data() {
    return {
      step: 1,
      email: "",
      otp: "",
      newPassword: "",
      confirmPassword: "",
      isLoading: false,
      otpVerified: false  // ✅ Cờ kiểm tra OTP đã xác thực
      ,
      showNewPwd: false,
      showConfirmPwd: false
    };
  },
  methods: {
    async sendOtp() {
      if (!this.email) {
        showToast("Vui lòng nhập email.", "warning");
        return;
      }
      this.isLoading = true;
      try {
        console.log("📧 Gửi OTP tới:", this.email);
        await AuthService.forgotPassword({ email: this.email });
        showToast("✅ Mã OTP đã được gửi đến email của bạn.", "success");
        console.log("✅ Chuyển sang bước 2 (xác thực OTP)");
        this.step = 2;
        this.otp = "";
        this.otpVerified = false;
      } catch (error) {
        console.error("❌ Lỗi sendOtp:", error);
        showToast(error.response?.data?.message || "Không tìm thấy email hoặc lỗi hệ thống.", "error");
      } finally {
        this.isLoading = false;
      }
    },
    // ✅ Bước 2: Xác thực OTP (chỉ kiểm tra OTP, không đổi mật khẩu)
    async verifyOtp() {
      console.log("🔑 Bắt đầu xác thực OTP");
      console.log("Email:", this.email);
      console.log("OTP nhập vào:", this.otp);
      
      if (!this.otp || this.otp.length !== 6) {
        showToast("⚠️ Vui lòng nhập đúng 6 chữ số OTP.", "warning");
        return;
      }

      this.isLoading = true;
      try {
        // ✅ Gọi API để xác thực OTP (không cần newPassword)
        console.log("📡 Gửi request xác thực OTP...");
        const response = await AuthService.verifyOtp({
            email: this.email,
            otp: this.otp
        });
        
        console.log("✅ OTP chính xác! Response:", response);
        showToast("✅ OTP chính xác! Vui lòng tạo mật khẩu mới.", "success");
        this.otpVerified = true;
        this.step = 3;  // ✅ Chuyển sang bước 3 (đổi mật khẩu)
      } catch (error) {
        console.error("❌ Lỗi verifyOtp:", error);
        showToast(error.response?.data?.message || "Mã OTP không đúng hoặc đã hết hạn.", "error");
        this.otpVerified = false;
      } finally {
        this.isLoading = false;
      }
    },
    // ✅ Bước 3: Đổi mật khẩu (sau khi OTP đã xác thực)
    async resetPassword() {
      console.log("🔐 Bắt đầu đổi mật khẩu");
      console.log("Email:", this.email);
      console.log("OTP đã xác thực:", this.otpVerified);
      
      // ✅ Kiểm tra OTP đã xác thực
      if (!this.otpVerified) {
        showToast("❌ Bạn phải xác thực OTP trước!", "error");
        this.step = 2;
        return;
      }
      
      if (!this.newPassword || !this.confirmPassword) {
        showToast("⚠️ Vui lòng nhập đầy đủ mật khẩu mới.", "warning");
        return;
      }

      if (this.newPassword !== this.confirmPassword) {
        showToast("❌ Mật khẩu xác nhận không khớp!", "error");
        return;
      }

      // Validate mật khẩu mạnh
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(this.newPassword)) {
        showToast("⚠️ Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.", "warning");
        return;
      }

      this.isLoading = true;
      try {
        console.log("📡 Gửi request đổi mật khẩu...");
        await AuthService.resetPassword({
            email: this.email,
            otp: this.otp,
            newPassword: this.newPassword
        });
        showToast("✅ Đổi mật khẩu thành công! Vui lòng đăng nhập.", "success");
        console.log("✅ Chuyển hướng sang trang login");
        this.$router.push("/login");
      } catch (error) {
        console.error("❌ Lỗi resetPassword:", error);
        showToast(error.response?.data?.message || "Lỗi khi đổi mật khẩu. Vui lòng thử lại.", "error");
      } finally {
        this.isLoading = false;
      }
    }
  }
};
</script>

<style scoped>
.forgot-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #ffffff, #ffffff, #ffffff);
}
.forgot-box { background: rgba(15, 12, 41, 0.7); backdrop-filter: blur(15px); border: 1px solid rgba(255,255,255,0.1); padding: 40px; border-radius: 15px; box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37); width: 100%; max-width: 400px; color: white; text-align: center; }

h2 { margin-bottom: 30px; font-weight: bold; letter-spacing: 1px; }

/* Progress Indicator */
.progress-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 30px;
  gap: 10px;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-width: 60px;
}

.step span {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  transition: 0.3s;
}

.step.active span {
  background: linear-gradient(to right, #00c6ff, #0072ff);
  border-color: #00c6ff;
}

.step.done span {
  background: #27ae60;
  border-color: #27ae60;
}

.step.done span::after {
  content: "✓";
  color: white;
}

.step p {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
}

.step.active p,
.step.done p {
  color: white;
}

.line {
  width: 30px;
  height: 2px;
  background: rgba(255, 255, 255, 0.2);
  transition: 0.3s;
}

.line.done {
  background: #27ae60;
}

.instruction { margin-bottom: 25px; color: rgba(255,255,255,0.8); font-size: 0.95rem; line-height: 1.5; }

.input-group {
  text-align: left;
  margin-bottom: 15px;
}

.input-group label {
  display: block;
  font-size: 0.85rem;
  margin-bottom: 5px;
  color: rgba(255,255,255,0.9);
}

input { 
  width: 100%; 
  margin-bottom: 10px; 
  padding: 12px 20px; 
  border: 1px solid rgba(255,255,255,0.2); 
  border-radius: 25px; 
  background: rgba(255, 255, 255, 0.05); 
  color: white; 
  box-sizing: border-box; 
  transition: 0.3s; 
  font-size: 15px; 
}
/* toggle password wrapper */
.password-wrapper { position: relative; }
.password-wrapper .toggle-pwd { position: absolute; right: 15px; top: 50%; transform: translateY(-50%); cursor: pointer; color: rgba(255,255,255,0.7); }
.password-wrapper .toggle-pwd:hover { color: rgba(255,255,255,1); }

input:focus { 
  border-color: #00c6ff; 
  background: rgba(255, 255, 255, 0.1); 
  outline: none; 
  box-shadow: 0 0 10px rgba(0, 198, 255, 0.3); 
}

button { 
  width: 100%; 
  padding: 12px; 
  background: linear-gradient(to right, #00c6ff, #0072ff); 
  color: white; 
  border: none; 
  cursor: pointer; 
  border-radius: 25px; 
  font-weight: bold; 
  transition: 0.3s; 
  box-shadow: 0 4px 15px rgba(0, 114, 255, 0.3); 
  font-size: 16px; 
  margin-top: 10px;
}

button:hover:not(:disabled) { 
  transform: translateY(-2px); 
  box-shadow: 0 6px 20px rgba(0, 114, 255, 0.5); 
}

button:disabled { 
  opacity: 0.7; 
  cursor: not-allowed; 
}

.resend-link { margin-top: 15px; font-size: 0.9rem; }
.resend-link a { color: #00c6ff; text-decoration: none; }
.resend-link a:hover { text-decoration: underline; }

.back-link { margin-top: 25px; font-size: 0.9rem; }
.back-link a { color: rgba(255,255,255,0.7); text-decoration: none; transition: 0.3s; display: inline-flex; align-items: center; gap: 5px; }
.back-link a:hover { color: white; }

::placeholder { color: rgba(255, 255, 255, 0.5); }
</style>