import createApiClient from "./api.service";

class VoucherService {
    constructor(baseUrl = "/api/vouchers") {
        this.api = createApiClient(baseUrl);
    }
    async getAll() {
        return (await this.api.get("/")).data;
    }

    async validateVoucher(code, subtotal, shipping_fee = 0) {
        return (await this.api.post("/validate", { code, subtotal, shipping_fee })).data;
    }
}
export default new VoucherService();