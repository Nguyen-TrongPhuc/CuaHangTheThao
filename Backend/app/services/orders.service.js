const { ObjectId } = require("mongodb");

class OrdersService {
    constructor(client) {
        this.Orders = client.db().collection("orders");
        this.OrderDetails = client.db().collection("order_details");
    }

    // =======================
    // TẠO ĐƠN HÀNG + CHI TIẾT
    // =======================
    async create(payload) {
        const session = this.Orders.client.startSession();

        try {
            let resultOrder;

            await session.withTransaction(async () => {
                const order = {
                    customer_id: payload.customer_id
                        ? new ObjectId(payload.customer_id)
                        : null,

                    employee_id: new ObjectId(payload.employee_id),

                    payment_method: payload.payment_method || "cash",
                    status: "pending",

                    total_amount: 0,

                    createdAt: new Date(),
                };

                // 1️⃣ Tạo đơn hàng
                const orderResult = await this.Orders.insertOne(order, { session });
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
                        createdAt: new Date(),
                    };
                });

                await this.OrderDetails.insertMany(orderDetails, { session });

                // 3️⃣ Cập nhật tổng tiền
                await this.Orders.updateOne(
                    { _id: orderId },
                    { $set: { total_amount: totalAmount } },
                    { session }
                );

                resultOrder = {
                    _id: orderId,
                    ...order,
                    total_amount: totalAmount,
                    items: orderDetails,
                };
            });

            return resultOrder;

        } finally {
            await session.endSession();
        }
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
