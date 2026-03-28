import createApiClient from "./api.service";

class WarehouseService {
    constructor(baseUrl = "/api/warehouse") {
        this.api = createApiClient(baseUrl);
    }
    async getAll(year, month) {
        const params = new URLSearchParams();
        if (year && month && month !== 'all') {
            params.append('year', year);
            params.append('month', month);
        }
        return (await this.api.get(`/?${params}`)).data;
    }

    async importStock(data) {
        return (await this.api.post("/import", data)).data;
    }
}

export default new WarehouseService();
