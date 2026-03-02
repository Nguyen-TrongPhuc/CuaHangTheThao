import createApiClient from "./api.service";

class AuthService {
    constructor(baseUrl = "/api/customers") {
        this.api = createApiClient(baseUrl);
    }

    async login(user) {
        return (await this.api.post("/login", user)).data;
    }

    async register(user) {
        return (await this.api.post("/", user)).data;
    }

    async forgotPassword(data) {
        return (await this.api.post("/forgot-password", data)).data;
    }

    // ✅ Xác thực OTP (kiểm tra OTP đúng trước khi đổi mật khẩu)
    async verifyOtp(data) {
        return (await this.api.post("/verify-otp", data)).data;
    }

    async resetPassword(data) {
        return (await this.api.post("/reset-password", data)).data;
    }
}

export default new AuthService();