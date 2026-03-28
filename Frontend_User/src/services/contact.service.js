import createApiClient from "./api.service.js";

class ContactService {
    constructor() {
        this.api = createApiClient("/api/contacts");
    }

    // Lấy tất cả tin nhắn (Backend sẽ lọc hoặc trả về hết tùy phân quyền)
    getAll() {
        return this.api.get("");
    }

    // Gửi tin nhắn mới
    create(data) {
        return this.api.post("", data);
    }
}

export default new ContactService();
