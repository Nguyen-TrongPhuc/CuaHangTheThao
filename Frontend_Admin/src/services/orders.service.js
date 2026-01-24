import createApiClient from "./api.service";

class OrderService {
    constructor(baseUrl = "/api/orders") {
        this.api = createApiClient(baseUrl);
    }
    async getAll() { return (await this.api.get("/")).data; }
    async getDetail(id) { return (await this.api.get(`/${id}`)).data; }
    async updateStatus(id, status) { return (await this.api.put(`/${id}`, { status })).data; }
}
export default new OrderService();