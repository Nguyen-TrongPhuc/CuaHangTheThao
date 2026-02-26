import createApiClient from "./api.service";

class OrderService {
    constructor(baseUrl = "/api/orders") {
        this.api = createApiClient(baseUrl);
    }

    async getAll() {
        return (await this.api.get("/")).data;
    }

    async update(id, data) {
        return (await this.api.put(`/${id}`, data)).data;
    }

    // Có thể thêm delete nếu cần
}

export default new OrderService();