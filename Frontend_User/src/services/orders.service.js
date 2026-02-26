import createApiClient from "./api.service";

class OrderService {
    constructor(baseUrl = "/api/orders") {
        this.api = createApiClient(baseUrl);
    }

    async create(data) {
        return (await this.api.post("/", data)).data;
    }

    async getAll() {
        return (await this.api.get("/")).data;
    }
    
    // Lấy lịch sử đơn hàng của user
    async getHistory() {
        return (await this.api.get("/history")).data;
    }

    // Cập nhật đơn hàng (dùng để xác nhận đã nhận hàng)
    async update(id, data) {
        return (await this.api.put(`/${id}`, data)).data;
    }
}

export default new OrderService();