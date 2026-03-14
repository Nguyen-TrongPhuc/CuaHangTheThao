import createApiClient from "./api.service";

class CustomerService {
    constructor(baseUrl = "/api/customers") {
        this.api = createApiClient(baseUrl);
    }

    async getProfile() {
        return (await this.api.get("/profile")).data;
    }

    async updateProfile(data) {
        return (await this.api.put("/profile", data)).data;
    }

    async changePassword(data) {
        return (await this.api.post("/change-password", data)).data;
    }

    async getLoyalty() {
        try {
            return (await this.api.get("/loyalty")).data;
        } catch (error) {
            if (error.response && error.response.status === 401) {
                // Token hết hạn -> Xóa token và dữ liệu cũ
                localStorage.removeItem("user_token");
                localStorage.removeItem("user_name");
                localStorage.removeItem("user_avatar");
            }
            throw error; // Đẩy lỗi tiếp để component xử lý giao diện
        }
    }
}

export default new CustomerService();
