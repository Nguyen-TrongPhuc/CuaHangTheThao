const { ObjectId } = require("mongodb");

class SizesService {
    constructor(client) {
        this.Sizes = client.db().collection("sizes");
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
        const result = await this.Sizes.findOneAndDelete({ _id: ObjectId.isValid(id) ? new ObjectId(id) : null });
        return result;
    }
}

module.exports = SizesService;