const { ObjectId } = require("mongodb");

class OrdersService {
    constructor(client) {
        this.Orders = client.db().collection("orders");
        this.OrderDetails = client.db().collection("order_details");
        this.Products = client.db().collection("products");
    }

    // =======================
    // TẠO ĐƠN HÀNG + CHI TIẾT
    // =======================
    async create(payload) {
        // Đã bỏ Transaction để tránh lỗi 500 trên MongoDB Standalone (môi trường dev)
                const order = {
                    customer_id: payload.customer_id
                        ? new ObjectId(payload.customer_id)
                        : null,

                    employee_id: payload.employee_id 
                        ? new ObjectId(payload.employee_id) 
                        : null, // Đơn hàng online không có nhân viên tạo

                    name: payload.name,
                    phone: payload.phone,
                    address: payload.address,
                    note: payload.note,

                    payment_method: payload.payment_method || "cash",
                    status: "pending",

                    total_amount: 0,

                    createdAt: new Date(),
                };

                // 1️⃣ Tạo đơn hàng
                const orderResult = await this.Orders.insertOne(order);
                const orderId = orderResult.insertedId;

                // 2️⃣ Tạo chi tiết đơn hàng
                let totalAmount = 0;

                const orderDetails = payload.items.map(item => {
                    const quantity = Number(item.quantity);
                    const unit_price = Number(item.unit_price);
                    const total_price = quantity * unit_price;

                    totalAmount += total_price;

                    return {
                        order_id: orderId,
                        product_id: new ObjectId(item.product_id),
                        quantity,
                        unit_price,
                        total_price,
                        // FIX: Lưu thông tin biến thể
                        variant_size_id: (item.variant_size_id && ObjectId.isValid(item.variant_size_id)) ? new ObjectId(item.variant_size_id) : null,
                        variant_color_id: (item.variant_color_id && ObjectId.isValid(item.variant_color_id)) ? new ObjectId(item.variant_color_id) : null,
                        
                        createdAt: new Date(),
                    };
                });

                await this.OrderDetails.insertMany(orderDetails);

                // 3️⃣ Cập nhật tổng tiền
                await this.Orders.updateOne(
                    { _id: orderId },
                    { $set: { total_amount: totalAmount } }
                );

                return {
                    _id: orderId,
                    ...order,
                    total_amount: totalAmount,
                    items: orderDetails,
                };
    }

    // =======================
    // TÌM THEO ĐIỀU KIỆN
    // =======================
    async find(filter) {
        const cursor = await this.Orders.find(filter).sort({ createdAt: -1 });
        return cursor.toArray();
    }

    // =======================
    // TÌM THEO ID
    // =======================
    async findById(id) {
        const order = await this.Orders.findOne({
            _id: ObjectId.isValid(id) ? new ObjectId(id) : null,
        });

        if (!order) return null;

        const items = await this.OrderDetails.find({
            order_id: order._id,
        }).toArray();

        return { ...order, items };
    }

    // =======================
    // TÌM THEO TRẠNG THÁI
    // =======================
    async findByStatus(status) {
        return await this.Orders.find({ status }).toArray();
    }

    // =======================
    // TÌM THEO NHÂN VIÊN
    // =======================
    async findByEmployee(employeeId) {
        return await this.Orders.find({
            employee_id: ObjectId.isValid(employeeId)
                ? new ObjectId(employeeId)
                : null,
        }).toArray();
    }

    // =======================
    // TÌM THEO KHÁCH HÀNG
    // =======================
    async findByCustomer(customerId) {
        return await this.Orders.find({
            customer_id: ObjectId.isValid(customerId)
                ? new ObjectId(customerId)
                : null,
        }).toArray();
    }

    // =======================
    // TÌM THEO KHÁCH HÀNG KÈM CHI TIẾT SẢN PHẨM
    // =======================
    async findByCustomerWithDetails(customerId) {
        const orders = await this.Orders.find({
            customer_id: ObjectId.isValid(customerId)
                ? new ObjectId(customerId)
                : null,
        }).sort({ createdAt: -1 }).toArray();

        // Với mỗi đơn hàng, lấy chi tiết và thông tin sản phẩm (tên, ảnh)
        const result = await Promise.all(orders.map(async (order) => {
            const details = await this.OrderDetails.find({
                order_id: order._id,
            }).toArray();

            const itemsWithProductInfo = await Promise.all(details.map(async (detail) => {
                const product = await this.Products.findOne({ _id: detail.product_id });
                // determine image based on variant color if available
                let product_image = null;
                if (product) {
                    // first prefer color-specific image
                    if (detail.variant_color_id && Array.isArray(product.images)) {
                        const match = product.images.find(i => String(i.color_id) === String(detail.variant_color_id));
                        if (match && match.url) {
                            product_image = match.url;
                        }
                    }
                    // fallback to first image in array
                    if (!product_image && Array.isArray(product.images) && product.images.length) {
                        product_image = product.images[0].url || null;
                    }
                    // last fallback to legacy field
                    if (!product_image && product.image) {
                        product_image = product.image;
                    }
                }
                return {
                    ...detail,
                    product_name: product ? product.name : "Sản phẩm đã bị xóa",
                    product_image
                };
            }));

            return { ...order, items: itemsWithProductInfo };
        }));

        return result;
    }

    // =======================
    // CẬP NHẬT ĐƠN HÀNG
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

        const result = await this.Orders.findOneAndUpdate(
            filter,
            update,
            { returnDocument: "after" }
        );

        return result;
    }

    // =======================
    // XÓA ĐƠN HÀNG + CHI TIẾT
    // =======================
    async delete(id) {
        const orderId = ObjectId.isValid(id) ? new ObjectId(id) : null;

        const session = this.Orders.client.startSession();

        let deletedOrder;

        try {
            await session.withTransaction(async () => {
                // 1️⃣ Xóa chi tiết đơn hàng
                await this.OrderDetails.deleteMany(
                    { order_id: orderId },
                    { session }
                );

                // 2️⃣ Xóa đơn hàng
                const result = await this.Orders.findOneAndDelete(
                    { _id: orderId },
                    { session }
                );

                deletedOrder = result;
            });

            return deletedOrder;

        } finally {
            await session.endSession();
        }
    }

    // =======================
    // XÓA TẤT CẢ ĐƠN HÀNG
    // =======================
    async deleteAll() {
        const session = this.Orders.client.startSession();

        let deletedCount;

        try {
            await session.withTransaction(async () => {
                await this.OrderDetails.deleteMany({}, { session });
                const result = await this.Orders.deleteMany({}, { session });
                deletedCount = result.deletedCount;
            });

            return deletedCount;

        } finally {
            await session.endSession();
        }
    }
}

module.exports = OrdersService;
