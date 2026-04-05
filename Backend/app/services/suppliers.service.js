const { ObjectId } = require("mongodb");

class SuppliersService {
    constructor(client) {
        this.Suppliers = client.db().collection("suppliers");
        this.Products = client.db().collection("products");
        this.Warehouse = client.db().collection("warehouse");
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
        const objectId = ObjectId.isValid(id) ? new ObjectId(id) : null;

        const productsCount = await this.Products.countDocuments({ supplier_id: objectId });
        if (productsCount > 0) {
            throw new Error(`Không thể xóa Nhà cung cấp này vì đang có ${productsCount} sản phẩm trực thuộc.`);
        }

        const warehouseCount = await this.Warehouse.countDocuments({ $or: [{ supplier_id: objectId }, { supplier_id: String(objectId) }] });
        if (warehouseCount > 0) {
            throw new Error(`Không thể xóa Nhà cung cấp này vì đã có ${warehouseCount} phiếu nhập kho liên quan.`);
        }

        return await this.Suppliers.deleteOne({ _id: objectId });
    }
}

module.exports = SuppliersService;