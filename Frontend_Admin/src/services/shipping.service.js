import createApiClient from "./api.service";

class ShippingService {
    constructor(baseUrl = "/api/shipping") {
        this.api = createApiClient(baseUrl);
    }

    async getShopInfo() {
        return (await this.api.get("/shop")).data;
    }

    async updateShopInfo(data) {
        return (await this.api.put("/shop", data)).data;
    }
}

export default new ShippingService();