import createApiClient from "./api.service";

class WarehouseService {
    constructor(baseUrl = "/api/warehouse") {
        this.api = createApiClient(baseUrl);
    }
    async getAll() {
        return (await this.api.get("/")).data;
    }
    async importStock(data) {
        return (await this.api.post("/import", data)).data;
    }
}

export default new WarehouseService();
