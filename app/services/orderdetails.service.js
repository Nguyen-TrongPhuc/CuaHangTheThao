const { ObjectId } = require("mongodb");

class OrderDetailsService {
    constructor(client) {
        this.OrderDetails = client.db().collection("order_details");
    }

    // =======================
    // TẠO CHI TIẾT ĐƠN HÀNG
    // =======================
    async create(payload) {
        const orderDetail = {
            order_id: ObjectId.isValid(payload.order_id)
                ? new ObjectId(payload.order_id)
                : payload.order_id,

            product_id: ObjectId.isValid(payload.product_id)
                ? new ObjectId(payload.product_id)
                : payload.product_id,

            quantity: Number(payload.quantity),
            unit_price: Number(payload.unit_price),
            total_price:
                Number(payload.quantity) * Number(payload.unit_price),

            createdAt: new Date(),
        };

        const result = await this.OrderDetails.insertOne(orderDetail);

        return result.insertedId
            ? { _id: result.insertedId, ...orderDetail }
            : null;
    }

    // =======================
    // TÌM THEO ĐIỀU KIỆN
    // =======================
    async find(filter) {
        const cursor = await this.OrderDetails.find(filter);
        return cursor.toArray();
    }

    // =======================
    // TÌM THEO ID
    // =======================
    async findById(id) {
        return await this.OrderDetails.findOne({
            _id: ObjectId.isValid(id) ? new ObjectId(id) : null,
        });
    }

    // =======================
    // TÌM THEO ORDER_ID
    // =======================
    async findByOrderId(orderId) {
        return await this.OrderDetails.find({
            order_id: ObjectId.isValid(orderId)
                ? new ObjectId(orderId)
                : orderId,
        }).toArray();
    }

    // =======================
    // CẬP NHẬT CHI TIẾT
    // =======================
    async update(id, payload) {
        const filter = {
            _id: ObjectId.isValid(id) ? new ObjectId(id) : null,
        };

        const updateData = { ...payload };

        // nếu cập nhật quantity hoặc unit_price thì tính lại total_price
        if (
            updateData.quantity !== undefined ||
            updateData.unit_price !== undefined
        ) {
            const current = await this.findById(id);

            const quantity =
                updateData.quantity !== undefined
                    ? Number(updateData.quantity)
                    : Number(current.quantity);

            const unit_price =
                updateData.unit_price !== undefined
                    ? Number(updateData.unit_price)
                    : Number(current.unit_price);

            updateData.total_price = quantity * unit_price;
        }

        const update = {
            $set: {
                ...updateData,
                updatedAt: new Date(),
            },
        };

        const result = await this.OrderDetails.findOneAndUpdate(
            filter,
            update,
            { returnDocument: "after" }
        );

        return result.value;
    }

    // =======================
    // XÓA 1 CHI TIẾT
    // =======================
    async delete(id) {
        const result = await this.OrderDetails.findOneAndDelete({
            _id: ObjectId.isValid(id) ? new ObjectId(id) : null,
        });

        return result.value;
    }

    // =======================
    // XÓA THEO ORDER_ID
    // =======================
    async deleteByOrderId(orderId) {
        const result = await this.OrderDetails.deleteMany({
            order_id: ObjectId.isValid(orderId)
                ? new ObjectId(orderId)
                : orderId,
        });

        return result.deletedCount;
    }

    // =======================
    // XÓA TẤT CẢ CHI TIẾT
    // =======================
    async deleteAll() {
        const result = await this.OrderDetails.deleteMany({});
        return result.deletedCount;
    }
}

module.exports = OrderDetailsService;
