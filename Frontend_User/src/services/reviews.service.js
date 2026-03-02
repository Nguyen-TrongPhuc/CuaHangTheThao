import createApiClient from "./api.service";

class ReviewsService {
    constructor(baseUrl = "/api/reviews") {
        this.api = createApiClient(baseUrl);
    }

    async getAll() {
        return (await this.api.get("/")).data;
    }

    async getMyReviews() {
        return (await this.api.get("/my-reviews")).data;
    }

    async getByProduct(productId) {
        return (await this.api.get(`/product/${productId}`)).data;
    }

    async create(data) {
        return (await this.api.post("/", data)).data;
    }
}

export default new ReviewsService();