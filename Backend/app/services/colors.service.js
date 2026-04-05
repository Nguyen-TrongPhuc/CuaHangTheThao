const { ObjectId } = require("mongodb");

class ColorsService {
    constructor(client) {
        this.Colors = client.db().collection("colors");
        this.Products = client.db().collection("products");
    }

    async create(payload) {
        const color = {
            name: payload.name,
            hex: payload.hex || "#000000", // Mã màu hex
            createdAt: new Date(),
        };
        const result = await this.Colors.insertOne(color);
        return { _id: result.insertedId, ...color };
    }

    async find(filter) {
        const cursor = await this.Colors.find(filter);
        return cursor.toArray();
    }

    async findById(id) {
        return await this.Colors.findOne({
            _id: ObjectId.isValid(id) ? new ObjectId(id) : null,
        });
    }

    async update(id, payload) {
        const filter = { _id: ObjectId.isValid(id) ? new ObjectId(id) : null };
        const update = { $set: { ...payload, updatedAt: new Date() } };
        const result = await this.Colors.findOneAndUpdate(filter, update, { returnDocument: "after" });
        return result;
    }

    async delete(id) {
        const objectId = ObjectId.isValid(id) ? new ObjectId(id) : null;
        
        const productsCount = await this.Products.countDocuments({ "variants.color_id": objectId });
        if (productsCount > 0) {
            throw new Error(`Không thể xóa Màu sắc này vì đang có ${productsCount} biến thể sản phẩm đang sử dụng.`);
        }

        const result = await this.Colors.findOneAndDelete({ _id: objectId });
        return result;
    }
}

module.exports = ColorsService;