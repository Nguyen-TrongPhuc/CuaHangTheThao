import createApiClient from "./api.service";

class ShiftsService {
    constructor(baseUrl = "/api/shifts") {
        this.api = createApiClient(baseUrl);
    }
    async getAll(params) {
        return (await this.api.get("/", { params })).data;
    }
    async create(data) {
        return (await this.api.post("/", data)).data;
    }
    async update(id, data) {
        return (await this.api.put(`/${id}`, data)).data;
    }
    async delete(id) {
        return (await this.api.delete(`/${id}`)).data;
    }
}
export default new ShiftsService();