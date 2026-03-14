const { ObjectId } = require("mongodb");

class SuppliersService {
    constructor(client) {
        this.Suppliers = client.db().collection("suppliers");
    }

    async create(payload) {
        const supplier = {
            name: payload.name,
            email: payload.email,
            phone: payload.phone,
            address: payload.address,
            createdAt: new Date()
        };
        const result = await this.Suppliers.insertOne(supplier);
        return { _id: result.insertedId, ...supplier };
    }

    async findAll() {
        return await this.Suppliers.find({}).sort({ createdAt: -1 }).toArray();
    }

    async findById(id) {
        return await this.Suppliers.findOne({ _id: ObjectId.isValid(id) ? new ObjectId(id) : null });
    }

    async update(id, payload) {
        const filter = { _id: ObjectId.isValid(id) ? new ObjectId(id) : null };
        const update = { $set: { ...payload, updatedAt: new Date() } };
        return await this.Suppliers.findOneAndUpdate(filter, update, { returnDocument: "after" });
    }

    async delete(id) {
        return await this.Suppliers.deleteOne({ _id: ObjectId.isValid(id) ? new ObjectId(id) : null });
    }
}

module.exports = SuppliersService;