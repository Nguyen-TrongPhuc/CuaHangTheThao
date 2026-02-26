import createApiClient from "./api.service";

class ReviewsService {
    constructor(baseUrl = "/api/reviews") {
        this.api = createApiClient(baseUrl);
    }

    async create(data) {
        return (await this.api.post("/", data)).data;
    }

    async getByProduct(productId) {
        return (await this.api.get(`/product/${productId}`)).data;
    }
}

export default new ReviewsService();