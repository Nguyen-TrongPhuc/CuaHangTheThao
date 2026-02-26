import createApiClient from "./api.service";

class AuthService {
    constructor(baseUrl = "/api/customers") {
        this.api = createApiClient(baseUrl);
    }

    async login(user) {
        return (await this.api.post("/login", user)).data;
    }

    async register(user) {
        return (await this.api.post("/", user)).data;
    }
}

export default new AuthService();