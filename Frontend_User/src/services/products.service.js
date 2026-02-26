import createApiClient from "./api.service";

class ProductService {
    constructor(baseUrl = "/api/products") {
        this.api = createApiClient(baseUrl);
    }

    async getAll() {
        return (await this.api.get("/")).data;
    }

    async findById(id) {
        return (await this.api.get(`/${id}`)).data;
    }

    async findByName(name) {
        return (await this.api.get(`/?name=${name}`)).data;
    }
    
    // Các phương thức khác nếu cần (create, update, delete thường dùng bên Admin)
}

export default new ProductService();