import createApiClient from "./api.service";

class SalariesService {
    constructor(baseUrl = "/api/salaries") {
        this.api = createApiClient(baseUrl);
    }

    async getAll(params) {
        return (await this.api.get("/", { params })).data;
    }

    async generate(data) {
        return (await this.api.post("/", data)).data;
    }

    async update(id, data) {
        return (await this.api.put(`/${id}`, data)).data;
    }

    async getMySalaries() {
        return (await this.api.get("/my-salaries")).data;
    }
}
export default new SalariesService();