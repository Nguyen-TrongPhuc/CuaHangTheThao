import createApiClient from "./api.service";

class AuthService {
    constructor(baseUrl = "/api/employees") {
        this.api = createApiClient(baseUrl);
    }

    async login(user) {
        return (await this.api.post("/login", user)).data;
    }
}

export default new AuthService();