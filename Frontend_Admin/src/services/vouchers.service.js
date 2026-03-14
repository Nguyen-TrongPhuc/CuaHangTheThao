import createApiClient from "./api.service";

class VoucherService {
    constructor() {
        this.api = createApiClient("/api/vouchers");
    }

    async getAll() {
        return (await this.api.get("/")).data;
    }

    async getStats() {
        return (await this.api.get("/stats")).data;
    }

    async create(data) {
        return (await this.api.post("/", data)).data;
    }

    async getById(id) {
        return (await this.api.get(`/${id}`)).data;
    }

    async update(id, data) {
        return (await this.api.put(`/${id}`, data)).data;
    }

    async delete(id) {
        return (await this.api.delete(`/${id}`)).data;
    }
}

export default new VoucherService();
