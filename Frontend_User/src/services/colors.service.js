import createApiClient from "./api.service";

class ColorsService {
    constructor(baseUrl = "/api/colors") {
        this.api = createApiClient(baseUrl);
    }

    async getAll() {
        return (await this.api.get("/")).data;
    }
}

export default new ColorsService();