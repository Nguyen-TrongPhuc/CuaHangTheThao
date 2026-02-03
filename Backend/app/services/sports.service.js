const { ObjectId } = require("mongodb");

class SportsService {
    constructor(client) {
        this.Sports = client.db().collection("sports");
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
        const result = await this.Sports.findOneAndDelete({ _id: ObjectId.isValid(id) ? new ObjectId(id) : null });
        return result;
    }
}

module.exports = SportsService;