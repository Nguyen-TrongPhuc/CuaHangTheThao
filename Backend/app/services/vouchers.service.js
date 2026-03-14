const { ObjectId } = require("mongodb");

class VoucherService {
    constructor(client) {
        this.Vouchers = client.db().collection("vouchers");
    }

    // Tạo voucher mới
    async create(payload) {
        const voucher = {
            code: payload.code.toUpperCase().trim(),
            discount_value: Number(payload.discount_value) || 0,
            discount_type: payload.discount_type || 'fixed', // 'fixed', 'percent', hoặc 'shipping'
            min_order_value: Number(payload.min_order_value) || 0,
            max_usage: Number(payload.max_usage) || 1,
            used_count: 0,
            start_date: new Date(payload.start_date),
            end_date: new Date(payload.end_date),
            is_active: payload.is_active !== false, // true mặc định
            description: payload.description || '',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Kiểm tra code unique
        const exists = await this.Vouchers.findOne({ code: voucher.code });
        if (exists) {
            throw new Error(`Mã voucher '${voucher.code}' đã tồn tại`);
        }

        const result = await this.Vouchers.insertOne(voucher);
        return { ...voucher, _id: result.insertedId };
    }

    // Validate voucher cho đơn hàng cụ thể
    async validateVoucher(code, subtotal, shipping_fee = 0) {
        code = code.toUpperCase().trim();
        const now = new Date();
        const fee = Number(shipping_fee) || 0;
        const voucher = await this.Vouchers.findOne({ 
            code: code,
            is_active: true,
            start_date: { $lte: now },
            end_date: { $gte: now },
            $expr: { $lt: ["$used_count", { $ifNull: ["$max_usage", 1] }] }
        });

        if (!voucher) {
            throw new Error('Mã voucher không hợp lệ, hết hạn hoặc đã hết lượt sử dụng');
        }

        // Kiểm tra điều kiện đơn hàng tối thiểu
        if (subtotal < voucher.min_order_value) {
            throw new Error(`Đơn hàng cần tối thiểu ${voucher.min_order_value.toLocaleString()}đ để áp dụng mã này`);
        }

        // Tính discount amount
        let discount_amount = 0;
        if (voucher.discount_type === 'percent') {
            discount_amount = Math.round(subtotal * (voucher.discount_value / 100));
        } else if (voucher.discount_type === 'shipping') {
            discount_amount = Math.min(fee, voucher.discount_value);
        } else {
            discount_amount = voucher.discount_value;
        }

        return {
            valid: true,
            voucher_id: voucher._id,
            code: voucher.code,
            discount_amount: discount_amount,
            discount_type: voucher.discount_type,
            discount_value: voucher.discount_value,
            message: `Áp dụng thành công! ${voucher.discount_type === 'shipping' ? 'Hỗ trợ phí ship' : 'Giảm'} ${voucher.discount_type === 'percent' ? voucher.discount_value + '%' : discount_amount.toLocaleString() + 'đ'}`
        };
    }

    // Tăng used_count sau khi áp dụng thành công (gọi sau khi tạo order)
    async useVoucher(voucherId) {
        // Chuyển đổi sang String rồi mới sang ObjectId để đảm bảo xử lý đúng cả chuỗi và object ID
        const id = new ObjectId(String(voucherId));

        // Thực hiện một thao tác cập nhật nguyên tử (atomic update).
        // Thao tác này sẽ tìm voucher theo ID VÀ kiểm tra xem nó còn lượt sử dụng hay không.
        // Điều này ngăn chặn các trường hợp lỗi (race conditions) khi 2 người dùng cùng lúc sử dụng voucher cuối cùng.
        const result = await this.Vouchers.updateOne(
            {
                _id: id,
                // Điều kiện: số lần đã dùng phải nhỏ hơn số lần dùng tối đa
                $expr: { $lt: ["$used_count", { $ifNull: ["$max_usage", 1] }] }
            },
            { 
                $inc: { used_count: 1 }, 
                $set: { updatedAt: new Date() } 
            }
        );

        // Nếu không có dòng nào được sửa đổi, nghĩa là voucher không tồn tại hoặc đã hết lượt.
        if (result.modifiedCount === 0) {
            const voucher = await this.findById(id);
            if (!voucher) throw new Error(`Voucher ID ${id} không tồn tại.`);
            throw new Error(`Voucher '${voucher.code}' đã hết lượt sử dụng hoặc không hợp lệ.`);
        }
        console.log(`✅ Đã tăng lượt dùng cho voucher ${id}`);

        return result;
    }

    // Lấy tất cả vouchers (admin)
    async findAll() {
        return await this.Vouchers.find({})
            .sort({ createdAt: -1 })
            .toArray();
    }

    // Tìm theo ID
    async findById(id) {
        if (!ObjectId.isValid(id)) {
            return null;
        }
        return await this.Vouchers.findOne({ _id: new ObjectId(id) });
    }

    // Tìm theo code
    async findByCode(code) {
        return await this.Vouchers.findOne({ code: code.toUpperCase().trim() });
    }

    // Cập nhật
    async update(id, payload) {
        const updateData = {
            discount_value: Number(payload.discount_value),
            discount_type: payload.discount_type || 'fixed',
            min_order_value: Number(payload.min_order_value),
            max_usage: Number(payload.max_usage),
            start_date: new Date(payload.start_date),
            end_date: new Date(payload.end_date),
            is_active: payload.is_active !== false,
            description: payload.description || '',
            updatedAt: new Date()
        };

        const result = await this.Vouchers.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: updateData },
            { returnDocument: 'after' }
        );

        // Kiểm tra tương thích: Driver mới trả về doc trực tiếp, cũ trả về { value: doc }
        const document = (result && result.value !== undefined) ? result.value : result;

        if (!document) {
            throw new Error('Voucher không tồn tại');
        }

        return document;
    }

    // Xóa
    async delete(id) {
        const result = await this.Vouchers.deleteOne({ _id: new ObjectId(id) });
        return result.deletedCount;
    }

    // Stats: Tổng voucher, còn hiệu lực, đã sử dụng
    async getStats() {
        const pipeline = [
            { $group: {
                _id: null,
                total: { $sum: 1 },
                active: { $sum: { $cond: [{ $and: ['$is_active', { $gte: ['$end_date', new Date()] }] }, 1, 0] } },
                used: { $sum: '$used_count' }
            }}
        ];
        const stats = await this.Vouchers.aggregate(pipeline).toArray();
        return stats[0] || { total: 0, active: 0, used: 0 };
    }
}

module.exports = VoucherService;
