import createApiClient from "./api.service";

class ReviewsService {
    constructor(baseUrl = "/api/reviews") {
        this.api = createApiClient(baseUrl);
    }

    // Lấy toàn bộ danh sách đánh giá
    async getAll() {
        return (await this.api.get("/")).data;
    }

    // Gửi phản hồi cho một đánh giá
    async reply(id, payload) {
        // Thay đổi sang PUT và điều chỉnh cấu trúc dữ liệu để khớp với backend
        return (await this.api.put(`/${id}/reply`, { reply: payload.text })).data;
    }

    // Xóa một đánh giá
    async delete(id) {
        return (await this.api.delete(`/${id}`)).data;
    }
}

export default new ReviewsService();