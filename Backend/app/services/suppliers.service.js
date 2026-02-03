const { ObjectId } = require("mongodb");

class SuppliersService {
    constructor(client) {
        this.Suppliers = client.db().collection("suppliers");
    }

    // =======================
    // LỌC DỮ LIỆU HỢP LỆ
    // =======================
    extractSupplierData(payload) {
        const supplier = {
            name: payload.name,
            phone: payload.phone,
            email: payload.email,
            address: payload.address,
            description: payload.description,
        };

        Object.keys(supplier).forEach(
            (key) => supplier[key] === undefined && delete supplier[key]
        );

        return supplier;
    }

    // =======================
    // TẠO NHÀ CUNG CẤP
    // =======================
    async create(payload) {
        const supplier = this.extractSupplierData(payload);

        supplier.createdAt = new Date();

        const result = await this.Suppliers.insertOne(supplier);
        return await this.findById(result.insertedId);
    }

    // =======================
    // TÌM THEO ĐIỀU KIỆN
    // =======================
    async find(filter) {
        const cursor = await this.Suppliers.find(filter).sort({ createdAt: -1 });
        return await cursor.toArray();
    }

    // =======================
    // TÌM THEO TÊN
    // =======================
    async findByName(name) {
        return await this.Suppliers.findOne({
            name: { $regex: new RegExp(`^${name}$`, "i") }, // không phân biệt hoa thường
        });
    }

    // =======================
    // TÌM THEO ID
    // =======================
    async findById(id) {
        return await this.Suppliers.findOne({
            _id: ObjectId.isValid(id) ? new ObjectId(String(id)) : null,
        });
    }

    // =======================
    // CẬP NHẬT
    // =======================
    async update(id, payload) {
        const filter = {
            _id: ObjectId.isValid(id) ? new ObjectId(String(id)) : null,
        };

        const update = this.extractSupplierData(payload);
        update.updatedAt = new Date();

        const result = await this.Suppliers.findOneAndUpdate(
            filter,
            { $set: update },
            { returnDocument: "after" }
        );

        return result;
    }

    // =======================
    // XÓA 1
    // =======================
    async delete(id) {
        const result = await this.Suppliers.findOneAndDelete({
            _id: ObjectId.isValid(id) ? new ObjectId(String(id)) : null,
        });

        return result;
    }

    // =======================
    // XÓA TẤT CẢ
    // =======================
    async deleteAll() {
        const result = await this.Suppliers.deleteMany({});
        return result.deletedCount;
    }
}

module.exports = SuppliersService;
