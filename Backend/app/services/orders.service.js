const { ObjectId } = require("mongodb");

class OrderService {
    constructor(client) {
        this.Orders = client.db().collection("orders");
        this.Products = client.db().collection("products");
    }

    async create(payload) {
        const order = {
            customer_id: payload.customer_id ? new ObjectId(payload.customer_id) : null,
            name: payload.name,
            phone: payload.phone,
            address: payload.address,
            note: payload.note,
            total_amount: payload.total_amount,
            status: "pending", // Trạng thái mặc định
            items: payload.items.map(item => ({
                product_id: new ObjectId(item._id || item.product_id),
                product_name: item.name || item.product_name,
                product_image: item.image || item.product_image,
                quantity: item.quantity,
                unit_price: item.unit_price || item.price,
                variant_size_id: item.variant_size_id ? new ObjectId(item.variant_size_id) : (item.variant?.size_id ? new ObjectId(item.variant.size_id) : null),
                variant_color_id: item.variant_color_id ? new ObjectId(item.variant_color_id) : (item.variant?.color_id ? new ObjectId(item.variant.color_id) : null),
            })),
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // 1. KIỂM TRA TỒN KHO TRƯỚC KHI TẠO
        for (const item of order.items) {
            const product = await this.Products.findOne({ _id: item.product_id });
            
            if (!product) {
                throw new Error(`Sản phẩm ${item.product_name} không tồn tại.`);
            }

            // Tự động điền tên và ảnh từ DB nếu thiếu (để thông báo lỗi rõ ràng hơn)
            if (!item.product_name) item.product_name = product.name;
            if (!item.product_image) item.product_image = product.images?.[0]?.url || product.image;

            // Nếu là sản phẩm có biến thể
            if (item.variant_size_id || item.variant_color_id) {
                const variant = product.variants.find(v => 
                    (v.size_id ? v.size_id.toString() === item.variant_size_id?.toString() : true) &&
                    (v.color_id ? v.color_id.toString() === item.variant_color_id?.toString() : true)
                );

                if (!variant) {
                    throw new Error(`Biến thể sản phẩm ${item.product_name} không hợp lệ.`);
                }

                if (variant.stock < item.quantity) {
                    throw new Error(`Sản phẩm ${item.product_name} (Phân loại đã chọn) chỉ còn ${variant.stock}, không đủ ${item.quantity}.`);
                }
            } else {
                // Sản phẩm đơn giản
                if (product.stock < item.quantity) {
                    throw new Error(`Sản phẩm ${item.product_name} chỉ còn ${product.stock}, không đủ ${item.quantity}.`);
                }
            }
        }

        // 2. TẠO ĐƠN HÀNG
        const result = await this.Orders.insertOne(order);

        // 3. TRỪ TỒN KHO VÀ TĂNG SỐ LƯỢNG ĐÃ BÁN
        for (const item of order.items) {
            if (item.variant_size_id || item.variant_color_id) {
                // Cập nhật cho biến thể: Trừ stock biến thể, trừ stock tổng, tăng sold
                await this.Products.updateOne(
                    { 
                        _id: item.product_id,
                        variants: { 
                            $elemMatch: { 
                                size_id: item.variant_size_id, 
                                color_id: item.variant_color_id 
                            } 
                        }
                    },
                    { 
                        $inc: { 
                            "variants.$.stock": -item.quantity, // Trừ stock biến thể
                            "stock": -item.quantity,            // Trừ stock tổng (nếu có quản lý)
                            "sold": +item.quantity              // Tăng số lượng đã bán
                        } 
                    }
                );
            } else {
                // Cập nhật cho sản phẩm đơn giản
                await this.Products.updateOne(
                    { _id: item.product_id },
                    { 
                        $inc: { 
                            stock: -item.quantity, 
                            sold: +item.quantity 
                        } 
                    }
                );
            }
        }

        return result;
    }

    async findAll() {
        return await this.Orders.find({}).sort({ createdAt: -1 }).toArray();
    }

    async findByCustomerId(customerId) {
        return await this.Orders.find({ 
            customer_id: new ObjectId(customerId) 
        }).sort({ createdAt: -1 }).toArray();
    }

    async findById(id) {
        return await this.Orders.findOne({ 
            _id: ObjectId.isValid(id) ? new ObjectId(id) : null 
        });
    }

    async update(id, payload) {
        const filter = { _id: ObjectId.isValid(id) ? new ObjectId(id) : null };
        const update = { $set: { ...payload, updatedAt: new Date() } };
        return await this.Orders.findOneAndUpdate(filter, update, { returnDocument: "after" });
    }
    
    async delete(id) {
        return await this.Orders.deleteOne({ _id: new ObjectId(id) });
    }

    async deleteAll() {
        const result = await this.Orders.deleteMany({});
        return result.deletedCount;
    }
}

module.exports = OrderService;