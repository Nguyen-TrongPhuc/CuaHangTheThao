const { ObjectId } = require("mongodb");

class CategoriesService {
    constructor(client) {
        this.Categories = client.db().collection("categories");
        this.Products = client.db().collection("products");
    }

    // Lọc dữ liệu hợp lệ
    extractCategoryData(payload) {
        const category = {
            name: payload.name,
            description: payload.description,
        };

        Object.keys(category).forEach(
            (key) => category[key] === undefined && delete category[key]
        );

        return category;
    }

    // Tạo mới category
    async create(payload) {
        const category = this.extractCategoryData(payload);
        const result = await this.Categories.insertOne(category);
        return await this.findById(result.insertedId);
    }

    // Tìm theo điều kiện
    async find(filter) {
        const cursor = await this.Categories.find(filter);
        return await cursor.toArray();
    }

    // Tìm theo tên (dùng cho search & check trùng)
    async findByName(name) {
        return await this.Categories.findOne({
            name: { $regex: new RegExp(`^${name}$`, "i") }, // không phân biệt hoa thường
        });
    }

    // Tìm theo ID
    async findById(id) {
        return await this.Categories.findOne({
            _id: ObjectId.isValid(id) ? new ObjectId(String(id)) : null,
        });
    }

    // Cập nhật
    async update(id, payload) {
        const filter = {
            _id: ObjectId.isValid(id) ? new ObjectId(String(id)) : null,
        };

        const update = this.extractCategoryData(payload);

        const result = await this.Categories.findOneAndUpdate(
            filter,
            { $set: update },
            { returnDocument: "after" }
        );

        return result;
    }

    // Xóa 1
    async delete(id) {
        const objectId = ObjectId.isValid(id) ? new ObjectId(String(id)) : null;

        // Kiểm tra ràng buộc dữ liệu
        const productsCount = await this.Products.countDocuments({ category_id: objectId });
        if (productsCount > 0) {
            throw new Error(`Không thể xóa Danh mục này vì đang có ${productsCount} sản phẩm trực thuộc. Vui lòng chuyển sản phẩm sang danh mục khác trước.`);
        }

        const result = await this.Categories.findOneAndDelete({ _id: objectId });

        return result;
    }

    // Xóa tất cả
    async deleteAll() {
        const result = await this.Categories.deleteMany({});
        return result.deletedCount;
    }
}

module.exports = CategoriesService;
