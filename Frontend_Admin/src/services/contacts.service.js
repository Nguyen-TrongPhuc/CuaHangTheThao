import createApiClient from "./api.service.js";

class ContactService {
    constructor() {
        this.api = createApiClient("/api/contacts");
    }

    // Lấy tất cả tin nhắn liên hệ
    getAll() {
        return this.api.get("");
    }

    // Lấy chi tiết một tin nhắn
    getById(id) {
        return this.api.get(`/${id}`);
    }

    // Tạo tin nhắn liên hệ (dùng từ Frontend User)
    create(data) {
        return this.api.post("", data);
    }

    // Cập nhật tin nhắn (trả lời)
    update(id, data) {
        return this.api.put(`/${id}`, data);
    }

    // Đánh dấu đã đọc
    markAsRead(id) {
        return this.api.put(`/${id}/mark-as-read`);
    }

    // Xóa một tin nhắn
    delete(id) {
        return this.api.delete(`/${id}`);
    }

    // Xóa tất cả tin nhắn
    deleteAll() {
        return this.api.delete("/all");
    }
}

export default new ContactService();
