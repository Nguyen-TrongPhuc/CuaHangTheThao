const { ObjectId } = require("mongodb");

class ProductsService {
    constructor(client) {
        this.Products = client.db().collection("products");
    }

    // =======================
    // TẠO SẢN PHẨM
    // =======================
    async create(payload) {
        const product = {
            name: payload.name,
            description: payload.description || "",
            price: Number(payload.price),
            stock: payload.stock ? Number(payload.stock) : 0,

            category_id: payload.category_id
                ? new ObjectId(payload.category_id)
                : null,

            image: payload.image || null,

            createdAt: new Date(),
        };

        const result = await this.Products.insertOne(product);
        return { _id: result.insertedId, ...product };
    }

    // =======================
    // TÌM THEO ĐIỀU KIỆN
    // =======================
    async find(filter) {
        const cursor = await this.Products.find(filter).sort({ createdAt: -1 });
        return cursor.toArray();
    }

    // =======================
    // TÌM THEO ID
    // =======================
    async findById(id) {
        return await this.Products.findOne({
            _id: ObjectId.isValid(id) ? new ObjectId(id) : null,
        });
    }

    // =======================
    // TÌM THEO TÊN
    // =======================
    async findByName(name) {
        return await this.Products.find({
            name: { $regex: new RegExp(name), $options: "i" },
        }).toArray();
    }

    // =======================
    // TÌM THEO DANH MỤC
    // =======================
    async findByCategory(categoryId) {
        return await this.Products.find({
            category_id: ObjectId.isValid(categoryId)
                ? new ObjectId(categoryId)
                : null,
        }).toArray();
    }

    // =======================
    // CẬP NHẬT SẢN PHẨM
    // =======================
    async update(id, payload) {
        const filter = {
            _id: ObjectId.isValid(id) ? new ObjectId(id) : null,
        };

        const update = {
            $set: {
                ...payload,
                updatedAt: new Date(),
            },
        };

        const result = await this.Products.findOneAndUpdate(
            filter,
            update,
            { returnDocument: "after" }
        );

        return result.value;
    }

    // =======================
    // XÓA 1 SẢN PHẨM
    // =======================
    async delete(id) {
        const result = await this.Products.findOneAndDelete({
            _id: ObjectId.isValid(id) ? new ObjectId(id) : null,
        });

        return result.value;
    }

    // =======================
    // XÓA TẤT CẢ SẢN PHẨM
    // =======================
    async deleteAll() {
        const result = await this.Products.deleteMany({});
        return result.deletedCount;
    }
}

module.exports = ProductsService;
