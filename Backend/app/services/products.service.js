const { ObjectId } = require("mongodb");
const ApiError = require("../api-error");

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
            import_price: 0, // Khởi tạo giá vốn mặc định
            // stock: Tổng tồn kho sẽ được tính toán hoặc hiển thị từ variants, ở đây lưu tạm 0 hoặc tổng
            stock: 0, 
            sold: 0, // Thêm trường số lượng đã bán, mặc định là 0

            category_id: (payload.category_id && ObjectId.isValid(payload.category_id))
                ? new ObjectId(payload.category_id)
                : null,

            sport_id: (payload.sport_id && ObjectId.isValid(payload.sport_id))
                ? new ObjectId(payload.sport_id)
                : null,
            
            supplier_id: (payload.supplier_id && ObjectId.isValid(payload.supplier_id))
                ? new ObjectId(payload.supplier_id)
                : null,
            
            // Mảng biến thể: [{ size_id, color_id, stock, price }]
            variants: Array.isArray(payload.variants) ? payload.variants.map(v => ({
                size_id: (v.size_id && ObjectId.isValid(v.size_id)) ? new ObjectId(v.size_id) : null,
                color_id: (v.color_id && ObjectId.isValid(v.color_id)) ? new ObjectId(v.color_id) : null,
                stock: 0, // Chỉ cập nhật tồn kho thông qua phiếu nhập kho
                import_price: 0, // Khởi tạo giá vốn mặc định cho biến thể
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

        // Luôn khởi tạo tồn kho = 0, chỉ thay đổi khi có phiếu nhập hàng
        product.stock = 0;

        const result = await this.Products.insertOne(product);
        return { _id: result.insertedId, ...product };
    }

    // =======================
    // TÌM THEO ĐIỀU KIỆN
    // =======================
    async find(filter, customerId = null) {
        const pipeline = [
            { $match: filter || {} },
            { $sort: { createdAt: -1 } },
            {
                $lookup: {
                    from: "reviews",
                    let: { pid: "$_id", pidStr: { $toString: "$_id" } },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $or: [
                                        { $eq: ["$product_id", "$$pid"] },
                                        { $eq: ["$product_id", "$$pidStr"] },
                                        { $eq: ["$productId", "$$pid"] },
                                        { $eq: ["$productId", "$$pidStr"] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "product_reviews"
                }
            },
            {
                $addFields: {
                    reviewCount: { $size: "$product_reviews" },
                    averageRating: { $ifNull: [{ $avg: "$product_reviews.rating" }, 0] }
                }
            },
            { $project: { product_reviews: 0 } }
        ];

        const products = await this.Products.aggregate(pipeline).toArray();

        // Apply VIP discount if customerId provided
        if (customerId) {
            const CustomerService = require('./customer.service');
            const MongoDB = require('../utils/mongodb.util');
            const customerService = new CustomerService(MongoDB.client);
            const loyaltyInfo = await customerService.getLoyaltyInfo(String(customerId));
            const discountPercent = loyaltyInfo ? loyaltyInfo.discountPercent / 100 : 0;

            return products.map(p => ({
                ...p,
                vipDiscountPercent: discountPercent * 100,
                vipPrice: p.price * (1 - discountPercent),
                showVipPrice: discountPercent > 0
            }));
        }

        return products;
    }

    // =======================
    // TÌM THEO ID
    // =======================
    async findById(id, customerId = null) {
        let objectId = null;
        try {
            const cleanId = id ? String(id).trim() : "";
            if (ObjectId.isValid(cleanId)) objectId = new ObjectId(cleanId);
        } catch (e) {
            objectId = null;
        }

        const pipeline = [
            { $match: { _id: objectId } },
            {
                $lookup: {
                    from: "reviews",
                    let: { pid: "$_id", pidStr: { $toString: "$_id" } },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $or: [
                                        { $eq: ["$product_id", "$$pid"] },
                                        { $eq: ["$product_id", "$$pidStr"] },
                                        { $eq: ["$productId", "$$pid"] },
                                        { $eq: ["$productId", "$$pidStr"] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "product_reviews"
                }
            },
            {
                $addFields: {
                    reviewCount: { $size: "$product_reviews" },
                    averageRating: { $ifNull: [{ $avg: "$product_reviews.rating" }, 0] }
                }
            },
            { $project: { product_reviews: 0 } }
        ];

        const products = await this.Products.aggregate(pipeline).toArray();
        const product = products.length > 0 ? products[0] : null;

        if (product && customerId) {
            const CustomerService = require('./customer.service');
            const MongoDB = require('../utils/mongodb.util');
            const customerService = new CustomerService(MongoDB.client);
            const loyaltyInfo = await customerService.getLoyaltyInfo(String(customerId));
            const discountPercent = loyaltyInfo ? loyaltyInfo.discountPercent / 100 : 0;

            product.vipDiscountPercent = discountPercent * 100;
            product.vipPrice = product.price * (1 - discountPercent);
            product.showVipPrice = discountPercent > 0;
        }
        
        return product;
    }

    // =======================
    // TÌM THEO TÊN
    // =======================
    async findByName(name, customerId = null) {
        const products = await this.Products.find({
            name: { $regex: new RegExp(name), $options: "i" },
        }).toArray();

        if (customerId) {
            const CustomerService = require('./customer.service');
            const MongoDB = require('../utils/mongodb.util');
            const customerService = new CustomerService(MongoDB.client);
            const loyaltyInfo = await customerService.getLoyaltyInfo(String(customerId));
            const discountPercent = loyaltyInfo ? loyaltyInfo.discountPercent / 100 : 0;

            return products.map(p => ({
                ...p,
                vipDiscountPercent: discountPercent * 100,
                vipPrice: p.price * (1 - discountPercent),
                showVipPrice: discountPercent > 0
            }));
        }

        return products;
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

        const objectIdFields = ["category_id", "sport_id", "supplier_id"];
        objectIdFields.forEach((field) => {
            if (updateData[field] && ObjectId.isValid(updateData[field])) {
                updateData[field] = new ObjectId(updateData[field]);
            }
        });

        // Lấy sản phẩm cũ để giữ nguyên tồn kho và giá vốn
        const oldProduct = await this.Products.findOne(filter);

        // BẢO VỆ GIÁ VỐN SẢN PHẨM GỐC: Chỉ cập nhật từ phiếu nhập, không cho sửa tay
        if (oldProduct) {
            updateData.import_price = oldProduct.import_price || 0;
        }

        // Xử lý variants khi update
        if (updateData.variants && Array.isArray(updateData.variants)) {
            updateData.variants = updateData.variants.map(v => {
                // Giữ nguyên tồn kho và giá vốn cũ của biến thể từ Database
                let currentStock = 0;
                let currentImportPrice = 0;
                if (oldProduct && oldProduct.variants) {
                    const oldVariant = oldProduct.variants.find(ov => 
                        String(ov.size_id) === String(v.size_id) && 
                        String(ov.color_id) === String(v.color_id)
                    );
                    if (oldVariant) {
                        currentStock = oldVariant.stock;
                        currentImportPrice = oldVariant.import_price || 0;
                    }
                }

                return {
                    size_id: (v.size_id && ObjectId.isValid(v.size_id)) ? new ObjectId(v.size_id) : null,
                    color_id: (v.color_id && ObjectId.isValid(v.color_id)) ? new ObjectId(v.color_id) : null,
                    stock: currentStock, // Bỏ qua giá trị gửi lên, lấy từ DB
                    import_price: currentImportPrice, // Giữ nguyên giá vốn
                    price: Number(v.price) || Number(updateData.price || 0)
                };
            });

            // Cập nhật tổng tồn kho dựa trên variants
            updateData.stock = updateData.variants.reduce((sum, v) => sum + v.stock, 0);
        }
        
        // Đảm bảo không ghi đè tổng stock của sản phẩm đơn giản nếu có gửi lên
        if (oldProduct && (!oldProduct.variants || oldProduct.variants.length === 0)) {
            updateData.stock = oldProduct.stock;
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
        const _id = ObjectId.isValid(id) ? new ObjectId(id) : null;

        // 1. Tìm sản phẩm để kiểm tra trước
        const product = await this.Products.findOne({ _id });
        if (!product) {
            return null;
        }

        // 2. Nếu sản phẩm đã có lượt bán (sold > 0), chặn xóa và báo lỗi
        if (product.sold && product.sold > 0) {
            throw new ApiError(400, `Không thể xóa sản phẩm "${product.name}" vì đã có ${product.sold} lượt mua. Vui lòng điều chỉnh tồn kho về 0 thay vì xóa.`);
        }

        // 3. Nếu chưa bán, tiến hành xóa
        const result = await this.Products.findOneAndDelete({ _id });

        return result;
    }

    // =======================
    // XÓA TẤT CẢ SẢN PHẨM
    // =======================
    async deleteAll() {
        // Chỉ xóa những sản phẩm chưa có lượt bán nào
        const result = await this.Products.deleteMany({
            $or: [
                { sold: 0 },
                { sold: { $exists: false } },
                { sold: null }
            ]
        });
        return result.deletedCount;
    }
}

module.exports = ProductsService;
