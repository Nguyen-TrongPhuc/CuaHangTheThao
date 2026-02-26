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
}

export default new CustomerService();