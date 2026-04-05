const { ObjectId } = require("mongodb");

class SizesService {
    constructor(client) {
        this.Sizes = client.db().collection("sizes");
        this.Products = client.db().collection("products");
    }

    async create(payload) {
        const size = {
            name: payload.name, // S, M, L, 39, 40...
            description: payload.description || "",
            createdAt: new Date(),
        };
        const result = await this.Sizes.insertOne(size);
        return { _id: result.insertedId, ...size };
    }

    async find(filter) {
        const cursor = await this.Sizes.find(filter);
        return cursor.toArray();
    }

    async findById(id) {
        return await this.Sizes.findOne({
            _id: ObjectId.isValid(id) ? new ObjectId(id) : null,
        });
    }

    async update(id, payload) {
        const filter = { _id: ObjectId.isValid(id) ? new ObjectId(id) : null };
        const update = { $set: { ...payload, updatedAt: new Date() } };
        const result = await this.Sizes.findOneAndUpdate(filter, update, { returnDocument: "after" });
        return result;
    }

    async delete(id) {
        const objectId = ObjectId.isValid(id) ? new ObjectId(id) : null;
        
        const productsCount = await this.Products.countDocuments({ "variants.size_id": objectId });
        if (productsCount > 0) {
            throw new Error(`Không thể xóa Kích thước này vì đang có ${productsCount} biến thể sản phẩm đang sử dụng.`);
        }

        const result = await this.Sizes.findOneAndDelete({ _id: objectId });
        return result;
    }
}

module.exports = SizesService;