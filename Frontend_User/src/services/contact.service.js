import axios from 'axios';

const API_BASE = 'http://localhost:3003/api/contacts';

class ContactService {
    // Hàm lấy header chứa token
    getHeaders() {
        const token = localStorage.getItem('user_token');
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }

    // Lấy tất cả tin nhắn (Backend sẽ lọc hoặc trả về hết tùy phân quyền)
    getAll() {
        return axios.get(API_BASE, { headers: this.getHeaders() });
    }

    // Gửi tin nhắn mới
    create(data) {
        return axios.post(API_BASE, data, { headers: this.getHeaders() });
    }
}

export default new ContactService();