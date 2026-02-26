const { ObjectId } = require("mongodb");

class ColorsService {
    constructor(client) {
        this.Colors = client.db().collection("colors");
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
        const result = await this.Colors.findOneAndDelete({ _id: ObjectId.isValid(id) ? new ObjectId(id) : null });
        return result;
    }
}

module.exports = ColorsService;