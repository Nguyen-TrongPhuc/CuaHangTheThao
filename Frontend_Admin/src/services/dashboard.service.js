import createApiClient from "./api.service";

class DashboardService {
    constructor(baseUrl = "/api/dashboard") {
        this.api = createApiClient(baseUrl);
    }

    async getSummary() {
        return (await this.api.get("/summary")).data;
    }

    async getMonthlySales(year) {
        return (await this.api.get(`/monthly-sales?year=${year}`)).data;
    }

    async getTopCustomers(startDate, endDate) {
        return (await this.api.get(`/top-customers?startDate=${startDate}&endDate=${endDate}`)).data;
    }

    async getLowStockProducts(threshold) {
        return (await this.api.get(`/low-stock?threshold=${threshold}`)).data;
    }

    async getImportReport(startDate, endDate) {
        return (await this.api.get(`/import-report?startDate=${startDate}&endDate=${endDate}`)).data;
    }

    async syncStock() {
        return (await this.api.post("/sync-stock")).data;
    }
}

export default new DashboardService();