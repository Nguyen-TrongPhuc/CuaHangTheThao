const { ObjectId } = require("mongodb");

class WarehouseService {
    constructor(client) {
        this.Warehouse = client.db().collection("warehouse");
    }

    async findAll() {
        const cursor = await this.Warehouse.find({}).sort({ createdAt: -1 });
        return await cursor.toArray();
    }

    async create(payload) {
        // Thêm thông tin ngày tạo nếu chưa có
        const dataWithTimestamp = {
            ...payload,
            createdAt: payload.createdAt || new Date()
        };
        const result = await this.Warehouse.insertOne(dataWithTimestamp);
        return result.value;
    }
}

module.exports = WarehouseService;
