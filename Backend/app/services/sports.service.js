const { ObjectId } = require("mongodb");

class SportsService {
    constructor(client) {
        this.Sports = client.db().collection("sports");
        this.Products = client.db().collection("products");
    }

    async create(payload) {
        const sport = {
            name: payload.name,
            description: payload.description || "",
            createdAt: new Date(),
        };
        const result = await this.Sports.insertOne(sport);
        return { _id: result.insertedId, ...sport };
    }

    async find(filter) {
        const cursor = await this.Sports.find(filter);
        return cursor.toArray();
    }

    async findById(id) {
        return await this.Sports.findOne({
            _id: ObjectId.isValid(id) ? new ObjectId(id) : null,
        });
    }

    async update(id, payload) {
        const filter = { _id: ObjectId.isValid(id) ? new ObjectId(id) : null };
        const update = { $set: { ...payload, updatedAt: new Date() } };
        const result = await this.Sports.findOneAndUpdate(filter, update, { returnDocument: "after" });
        return result;
    }

    async delete(id) {
        const objectId = ObjectId.isValid(id) ? new ObjectId(id) : null;
        
        const productsCount = await this.Products.countDocuments({ sport_id: objectId });
        if (productsCount > 0) {
            throw new Error(`Không thể xóa Môn thể thao này vì đang có ${productsCount} sản phẩm liên quan.`);
        }

        const result = await this.Sports.findOneAndDelete({ _id: objectId });
        return result;
    }
}

module.exports = SportsService;