import createApiClient from "./api.service";

class DashboardService {
    constructor(baseUrl = "/api/dashboard") {
        this.api = createApiClient(baseUrl);
    }

    async getSummary() {
        return (await this.api.get("/summary")).data;
    }
}

export default new DashboardService();