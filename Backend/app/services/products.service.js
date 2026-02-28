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
            // stock: Tổng tồn kho sẽ được tính toán hoặc hiển thị từ variants, ở đây lưu tạm 0 hoặc tổng
            stock: Number(payload.stock) || 0, 
            sold: 0, // Thêm trường số lượng đã bán, mặc định là 0

            category_id: (payload.category_id && ObjectId.isValid(payload.category_id))
                ? new ObjectId(payload.category_id)
                : null,

            sport_id: (payload.sport_id && ObjectId.isValid(payload.sport_id))
                ? new ObjectId(payload.sport_id)
                : null,
            
            // Mảng biến thể: [{ size_id, color_id, stock, price }]
            variants: Array.isArray(payload.variants) ? payload.variants.map(v => ({
                size_id: (v.size_id && ObjectId.isValid(v.size_id)) ? new ObjectId(v.size_id) : null,
                color_id: (v.color_id && ObjectId.isValid(v.color_id)) ? new ObjectId(v.color_id) : null,
                stock: Number(v.stock) || 0,
                price: Number(v.price) || Number(payload.price) // Nếu không có giá riêng thì lấy giá chung
            })) : [],

            // support multiple images. each item may optionally be associated with a color
            images: Array.isArray(payload.images)
                ? payload.images.map(img => ({
                      url: img.url || null,
                      color_id: (img.color_id && ObjectId.isValid(img.color_id)) ? new ObjectId(img.color_id) : null
                  }))
                : [],
            // legacy single image field for backward compatibility
            image: payload.image || (Array.isArray(payload.images) && payload.images[0] ? payload.images[0].url : null),

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
    // TÌM THEO MÔN THỂ THAO
    // =======================
    async findBySport(sportId) {
        return await this.Products.find({
            sport_id: ObjectId.isValid(sportId)
                ? new ObjectId(sportId)
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

        // FIX: Chuyển đổi dữ liệu sang đúng định dạng (ObjectId, Number) trước khi update
        const updateData = { ...payload };

        const objectIdFields = ["category_id", "sport_id"];
        objectIdFields.forEach((field) => {
            if (updateData[field] && ObjectId.isValid(updateData[field])) {
                updateData[field] = new ObjectId(updateData[field]);
            }
        });

        // Xử lý variants khi update
        if (updateData.variants && Array.isArray(updateData.variants)) {
            updateData.variants = updateData.variants.map(v => ({
                size_id: (v.size_id && ObjectId.isValid(v.size_id)) ? new ObjectId(v.size_id) : null,
                color_id: (v.color_id && ObjectId.isValid(v.color_id)) ? new ObjectId(v.color_id) : null,
                stock: Number(v.stock) || 0,
                price: Number(v.price) || Number(updateData.price || 0)
            }));
        }

        // Xử lý images khi update (mảng ảnh có thể đi kèm color_id)
        if (updateData.images && Array.isArray(updateData.images)) {
            updateData.images = updateData.images.map(img => ({
                url: img.url || null,
                color_id: (img.color_id && ObjectId.isValid(img.color_id)) ? new ObjectId(img.color_id) : null
            }));
            // maintain legacy image property as first url
            updateData.image = updateData.images[0] ? updateData.images[0].url : null;
        }

        if (updateData.price !== undefined) updateData.price = Number(updateData.price);
        if (updateData.stock !== undefined) updateData.stock = Number(updateData.stock);
        if (updateData.sold !== undefined) updateData.sold = Number(updateData.sold);

        const update = {
            $set: {
                ...updateData,
                updatedAt: new Date(),
            },
        };

        const result = await this.Products.findOneAndUpdate(
            filter,
            update,
            { returnDocument: "after" }
        );

        return result;
    }

    // =======================
    // XÓA 1 SẢN PHẨM
    // =======================
    async delete(id) {
        const result = await this.Products.findOneAndDelete({
            _id: ObjectId.isValid(id) ? new ObjectId(id) : null,
        });

        return result;
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
