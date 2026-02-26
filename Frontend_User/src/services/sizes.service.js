import createApiClient from "./api.service";

class SizesService {
    constructor(baseUrl = "/api/sizes") {
        this.api = createApiClient(baseUrl);
    }

    async getAll() {
        return (await this.api.get("/")).data;
    }
}

export default new SizesService();