import axios from 'axios';

const API_BASE = 'http://localhost:3003/api/contacts';

class ContactService {
    // Lấy tất cả tin nhắn liên hệ
    getAll() {
        return axios.get(API_BASE);
    }

    // Lấy chi tiết một tin nhắn
    getById(id) {
        return axios.get(`${API_BASE}/${id}`);
    }

    // Tạo tin nhắn liên hệ (dùng từ Frontend User)
    create(data) {
        return axios.post(API_BASE, data);
    }

    // Cập nhật tin nhắn (trả lời)
    update(id, data) {
        return axios.put(`${API_BASE}/${id}`, data);
    }

    // Đánh dấu đã đọc
    markAsRead(id) {
        return axios.put(`${API_BASE}/${id}/mark-as-read`);
    }

    // Xóa một tin nhắn
    delete(id) {
        return axios.delete(`${API_BASE}/${id}`);
    }

    // Xóa tất cả tin nhắn
    deleteAll() {
        return axios.delete(`${API_BASE}/all`);
    }
}

export default new ContactService();
