import createApiClient from "./api.service";

class UploadService {
    constructor(baseUrl = "/api/upload") {
        this.api = createApiClient(baseUrl);
    }

    async upload(file) {
        const formData = new FormData();
        formData.append("image", file);
        return (await this.api.post("/", formData, {
            headers: {
                "Content-Type": undefined
            }
        })).data;
    }
}

export default new UploadService();