import createApiClient from "./api.service";

class SportService {
    constructor(baseUrl = "/api/sports") {
        this.api = createApiClient(baseUrl);
    }

    async getAll() {
        return (await this.api.get("/")).data;
    }
}

export default new SportService();