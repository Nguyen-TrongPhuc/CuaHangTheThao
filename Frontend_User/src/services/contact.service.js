import axios from 'axios';

const API_BASE = 'http://localhost:3003/api/contacts';

class ContactService {
    // Tạo tin nhắn liên hệ
    create(data) {
        return axios.post(API_BASE, data);
    }
}

export default new ContactService();
