const cron = require('node-cron');
const MongoDB = require('./app/utils/mongodb.util');
const CustomerService = require('./app/services/customer.service');

function initLoyaltyCron() {
    // Chạy vào 02:00 sáng mỗi ngày: '0 2 * * *'
    cron.schedule('0 2 * * *', async () => {
        console.log("⏰ [CRON] Bắt đầu quét và cập nhật Hạng thành viên (Chi tiêu 365 ngày qua)...");
        try {
            const db = MongoDB.client.db();
            const customers = await db.collection("customers").find({}).toArray();
            const customerService = new CustomerService(MongoDB.client);

            // Mốc thời gian 1 năm trước so với hiện tại
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

            let updatedCount = 0;

            for (const customer of customers) {
                // 1. Tính tổng tiền các đơn hàng đã thanh toán trong 365 ngày qua
                const orders = await db.collection("orders").aggregate([
                    {
                        $match: {
                            customer_id: customer._id,
                            payment_status: "paid",
                            updatedAt: { $gte: oneYearAgo } // Chỉ lấy đơn trong 1 năm qua
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            yearlySpent: { $sum: "$total_amount" }
                        }
                    }
                ]).toArray();

                const yearlySpent = orders.length > 0 ? orders[0].yearlySpent : 0;

                // 2. Nếu tổng chi tiêu 1 năm qua khác với tổng chi tiêu hiện tại -> Cập nhật & Xét lại hạng
                if (customer.totalSpent !== yearlySpent) {
                    await db.collection("customers").updateOne({ _id: customer._id }, { $set: { totalSpent: yearlySpent } });
                    await customerService.updateRank(customer._id.toString());
                    updatedCount++;
                }
            }
            
            console.log(`✅ [CRON] Đã cập nhật lại hạng cho ${updatedCount} khách hàng có biến động chi tiêu.`);
        } catch (error) {
            console.error("❌ [CRON] Lỗi khi cập nhật hạng thành viên:", error);
        }
    });
}

module.exports = initLoyaltyCron;