const { ObjectId } = require("mongodb");
const { calculateShippingFee } = require("../utils/shipping.util");
const VoucherService = require("./vouchers.service");

class OrderService {
    constructor(client) {
        this.Orders = client.db().collection("orders");
        this.Products = client.db().collection("products");
        this.Vouchers = new VoucherService(client);
    }

    async create(payload) {
        // Calculate shipping fee
        // Ưu tiên phí vận chuyển từ payload (frontend), nếu không có thì tính lại để dự phòng.
        // Điều này đảm bảo số tiền hiển thị cho người dùng và số tiền lưu trong DB là nhất quán.
        const subtotal = Number(payload.subtotal) || 0;
        const shipping_fee = (payload.shipping_fee !== undefined)
            ? Number(payload.shipping_fee)
            : calculateShippingFee(subtotal, payload.shipping_type || 'standard');
        
// ========== VALIDATE VOUCHERS FIRST (collect info only) ==========
        let total_discount_amount = 0;
        const applied_vouchers = [];
        
        // Process discount voucher (fixed or percent)
        if (payload.discount_voucher_code) {
            try {
                const result = await this.Vouchers.validateVoucher(payload.discount_voucher_code, subtotal, shipping_fee);
                if (result.discount_type !== 'shipping') {
                    total_discount_amount += result.discount_amount;
                    applied_vouchers.push({ _id: result.voucher_id, code: result.code, type: result.discount_type, amount: result.discount_amount });
                    console.log(`✅ VALIDATED discount voucher: ${result.code}`);
                } else {
                    console.log(`Voucher ${payload.discount_voucher_code} is shipping type, ignoring for discount.`);
                }
            } catch (e) {
                console.error(`❌ VALIDATE FAILED discount voucher (${payload.discount_voucher_code}):`, e.message);
            }
        }

        // Process shipping voucher
        if (payload.shipping_voucher_code) {
            try {
                const result = await this.Vouchers.validateVoucher(payload.shipping_voucher_code, subtotal, shipping_fee);
                if (result.discount_type === 'shipping') {
                    total_discount_amount += result.discount_amount;
                    applied_vouchers.push({ _id: result.voucher_id, code: result.code, type: result.discount_type, amount: result.discount_amount });
                    console.log(`✅ VALIDATED shipping voucher: ${result.code}`);
                } else {
                    console.log(`Voucher ${payload.shipping_voucher_code} is not shipping type, ignoring.`);
                }
            } catch (e) {
                console.error(`❌ VALIDATE FAILED shipping voucher (${payload.shipping_voucher_code}):`, e.message);
            }
        }
        
        // Determine payment status based on payment method
        let payment_status = 'unpaid';
        if (payload.payment_method === 'cod') {
            payment_status = 'pending'; // COD - wait for cash on delivery
        } else if (['vnpay', 'momo', 'bank_transfer'].includes(payload.payment_method)) {
            payment_status = payload.payment_status || 'unpaid';
        }

        const order = {
            customer_id: payload.customer_id ? new ObjectId(payload.customer_id) : null,
            name: payload.name,
            phone: payload.phone,
            address: payload.address,
            note: payload.note,
            payment_method: payload.payment_method || 'cod',
            payment_status: payment_status,
            shipping_type: payload.shipping_type || 'standard',
            shipping_fee: shipping_fee,
            subtotal: subtotal,
            discount_amount: total_discount_amount,
            vouchers: applied_vouchers,
            total_amount: subtotal + shipping_fee - total_discount_amount, // Final total sau discount
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
            // Payment transaction info (for online payments)
            transaction_id: payload.transaction_id || null,
            vnpay_info: payload.vnpay_info || null,
            createdAt: new Date(),
            updatedAt: new Date()
        };

// 1. LOG ORDER DATA (for debug)
        console.log("Tạo đơn hàng:", {
            subtotal, shipping_fee, total_discount_amount, 
            final_total: subtotal + shipping_fee - total_discount_amount,
            vouchers_used: applied_vouchers.map(v => v.code)
        });
        
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

        // 2. TRỪ TỒN KHO (Thực hiện trước khi tạo đơn để đảm bảo tính toàn vẹn)
        const reservedItems = [];
        try {
            for (const item of order.items) {
                let updateResult;
                if (item.variant_size_id || item.variant_color_id) {
                    // Cập nhật cho biến thể: Thêm điều kiện stock >= quantity để chặn số âm
                    updateResult = await this.Products.updateOne(
                        { 
                            _id: item.product_id,
                            variants: { 
                                $elemMatch: { 
                                    size_id: item.variant_size_id, 
                                    color_id: item.variant_color_id,
                                    stock: { $gte: item.quantity } // ĐIỀU KIỆN QUAN TRỌNG
                                } 
                            } 
                        },
                        { 
                            $inc: { 
                                "variants.$.stock": -item.quantity,
                                "stock": -item.quantity,
                                "sold": +item.quantity
                            } 
                        }
                    );
                } else {
                    // Cập nhật cho sản phẩm đơn giản: Thêm điều kiện stock >= quantity
                    updateResult = await this.Products.updateOne(
                        { 
                            _id: item.product_id,
                            stock: { $gte: item.quantity } // ĐIỀU KIỆN QUAN TRỌNG
                        },
                        { 
                            $inc: { 
                                stock: -item.quantity, 
                                sold: +item.quantity 
                            } 
                        }
                    );
                }

                // Nếu không cập nhật được (do hết hàng giữa chừng), ném lỗi để rollback
                if (updateResult.modifiedCount === 0) {
                    throw new Error(`Sản phẩm ${item.product_name} vừa hết hàng hoặc không đủ số lượng.`);
                }
                reservedItems.push(item);
            }
        } catch (error) {
            // Rollback: Hoàn lại kho cho các sản phẩm đã trừ thành công trước đó (nếu có lỗi xảy ra)
            for (const item of reservedItems) {
                if (item.variant_size_id || item.variant_color_id) {
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
                                "variants.$.stock": +item.quantity,
                                "stock": +item.quantity,
                                "sold": -item.quantity
                            } 
                        }
                    );
                } else {
                    await this.Products.updateOne(
                        { _id: item.product_id },
                        { 
                            $inc: { 
                                stock: +item.quantity, 
                                sold: -item.quantity 
                            } 
                        } 
                    );
                }
            }
            throw error;
        }

        // 3. TẠO ĐƠN HÀNG (Chỉ tạo khi đã trừ kho thành công hết)
        // 3. CREATE ORDER after inventory success
        const insertResult = await this.Orders.insertOne(order);
        console.log(`✅ Order created successfully: ${insertResult.insertedId}`);
        
        // 4. NOW increment voucher usage COUNTS (only if order succeeded!)
        for (const voucher of applied_vouchers) {
            try {
                await this.Vouchers.useVoucher(voucher._id);
                console.log(`✅ Voucher usage incremented: ${voucher.code} (order: ${insertResult.insertedId})`);
            } catch (voucherError) {
                console.error(`❌ FAILED to increment voucher ${voucher.code} for order ${insertResult.insertedId}:`, voucherError.message);
                // Continue - don't fail entire order if voucher update fails
            }
        }
        
        return insertResult;
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
        
        // Logic hoàn kho (Restocking) khi hủy đơn hàng HOẶC trả hàng thành công
        if (payload.status === 'cancelled' || payload.status === 'returned') {
            const order = await this.Orders.findOne(filter);
            // Chỉ hoàn kho nếu đơn hàng tồn tại và trạng thái trước đó KHÔNG phải là cancelled hoặc returned
            if (order && order.status !== 'cancelled' && order.status !== 'returned') {
                for (const item of order.items) {
                    if (item.variant_size_id || item.variant_color_id) {
                        // Hoàn kho cho biến thể: Cộng lại stock, Trừ đi sold
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
                                    "variants.$.stock": +item.quantity, 
                                    "stock": +item.quantity,            
                                    "sold": -item.quantity              
                                } 
                            }
                        );
                    } else {
                        // Hoàn kho cho sản phẩm đơn giản
                        await this.Products.updateOne(
                            { _id: item.product_id },
                            { 
                                $inc: { 
                                    stock: +item.quantity, 
                                    sold: -item.quantity 
                                } 
                            }
                        );
                    }
                }
            }
        }

// ========== LOYALTY: Add totalSpent when delivered + paid ==========
        const oldOrder = await this.Orders.findOne(filter);

        // Tự động cập nhật trạng thái thanh toán dựa trên trạng thái đơn hàng
        if (oldOrder && payload.status) {
            if (payload.status === 'returned') {
                payload.payment_status = 'refunded';
            } else if (payload.status === 'cancelled') {
                // Nếu đã thanh toán mà hủy thì xem như hoàn tiền, ngược lại thì thất bại
                payload.payment_status = oldOrder.payment_status === 'paid' ? 'refunded' : 'failed';
            } else if (oldOrder.payment_method === 'cod') {
                if (['pending', 'shipping'].includes(payload.status)) {
                    payload.payment_status = 'pending';
                } else if (['delivered', 'completed'].includes(payload.status)) {
                    payload.payment_status = 'paid';
                }
            }
        }

        const newPaymentStatus = payload.payment_status !== undefined ? payload.payment_status : (oldOrder ? oldOrder.payment_status : null);

        // Cộng tổng chi khi trạng thái thanh toán chuyển sang Đã thanh toán
        if (oldOrder && oldOrder.customer_id && newPaymentStatus === 'paid' && oldOrder.payment_status !== 'paid') {
            const CustomerService = require('./customer.service');
            const MongoDB = require('../utils/mongodb.util');
            const customerService = new CustomerService(MongoDB.client);
            await customerService.addTotalSpent(String(oldOrder.customer_id), oldOrder.total_amount);
            await customerService.updateRank(String(oldOrder.customer_id));
            console.log(`⭐ Loyalty: Added ${oldOrder.total_amount.toLocaleString()}đ to totalSpent for customer ${oldOrder.customer_id}`);
        }

        // Trừ tổng chi khi đơn hàng bị trả lại/hủy (hoàn tiền) và trước đó đã tính điểm (đã thanh toán)
        if (oldOrder && oldOrder.customer_id && newPaymentStatus === 'refunded' && oldOrder.payment_status === 'paid') {
            const CustomerService = require('./customer.service');
            const MongoDB = require('../utils/mongodb.util');
            const customerService = new CustomerService(MongoDB.client);
            await customerService.addTotalSpent(String(oldOrder.customer_id), -oldOrder.total_amount);
            await customerService.updateRank(String(oldOrder.customer_id));
            console.log(`⭐ Loyalty: Subtracted ${oldOrder.total_amount.toLocaleString()}đ from totalSpent for customer ${oldOrder.customer_id} due to refund`);
        }

        const updateSet = { ...payload, updatedAt: new Date() };
        return await this.Orders.findOneAndUpdate(filter, { $set: updateSet }, { returnDocument: "after" });
    }

    async delete(id) {
        return await this.Orders.deleteOne({ _id: new ObjectId(id) });
    }

    async deleteAll() {
        const result = await this.Orders.deleteMany({});
        return result.deletedCount;
    }

    // Tự động hủy các đơn hàng thanh toán online chưa được thanh toán sau 15 phút
    async cancelExpiredOrders() {
        const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
        const expiredOrders = await this.Orders.find({
            payment_status: "unpaid",
            status: "pending",
            payment_method: { $in: ['vnpay', 'momo'] }, // Chỉ quét đơn thanh toán online
            createdAt: { $lt: fifteenMinsAgo }
        }).toArray();

        let canceledCount = 0;
        for (const order of expiredOrders) {
            await this.update(order._id, { status: 'cancelled' }); // Hàm update đã có sẵn logic hoàn kho
            canceledCount++;
        }
        
        if (canceledCount > 0) {
            console.log(`⏰ [CRON] Đã tự động hủy và hoàn kho ${canceledCount} đơn hàng chưa thanh toán quá 15 phút.`);
        }
    }
}

module.exports = OrderService;