const { ObjectId } = require("mongodb");

class DashboardService {
    constructor(client) {
        this.Orders = client.db().collection("orders");
        this.OrderDetails = client.db().collection("order_details");
        this.Products = client.db().collection("products");
        this.Customers = client.db().collection("customers");
    }

    async getSummary() {
        // Sử dụng Promise.all để chạy các truy vấn song song, tăng hiệu năng
        const [
            totalRevenueMonth,
            newOrdersToday,
            newUsersMonth,
            cancelledOrdersMonth,
            dailyRevenue,
            orderStatusDistribution,
            topSellingProducts
        ] = await Promise.all([
            this.getTotalRevenueMonth(),
            this.getNewOrdersToday(),
            this.getNewUsersMonth(),
            this.getCancelledOrdersMonth(),
            this.getDailyRevenueLast7Days(),
            this.getOrderStatusDistribution(),
            this.getTopSellingProducts(5)
        ]);

        return {
            totalRevenueMonth,
            newOrdersToday,
            newUsersMonth,
            cancelledOrdersMonth,
            dailyRevenue,
            orderStatusDistribution,
            topSellingProducts
        };
    }

    // Thống kê doanh thu trong tháng hiện tại
    async getTotalRevenueMonth() {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const result = await this.Orders.aggregate([
            {
                $match: {
                    status: { $in: ["completed", "delivered"] }, // Chỉ tính đơn đã giao/hoàn thành
                    createdAt: { $gte: startOfMonth, $lte: endOfMonth }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$total_amount" }
                }
            }
        ]).toArray();

        return result.length > 0 ? result[0].total : 0;
    }

    // Đếm đơn hàng mới trong ngày
    async getNewOrdersToday() {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        return await this.Orders.countDocuments({
            createdAt: { $gte: startOfDay, $lte: endOfDay }
        });
    }

    // Đếm người dùng mới trong tháng
    async getNewUsersMonth() {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        return await this.Customers.countDocuments({
            // Giả sử collection người dùng có trường createdAt
            createdAt: { $gte: startOfMonth, $lte: endOfMonth }
        });
    }

    // Đếm đơn hàng bị hủy trong tháng
    async getCancelledOrdersMonth() {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        return await this.Orders.countDocuments({
            status: "cancelled",
            createdAt: { $gte: startOfMonth, $lte: endOfMonth }
        });
    }

    // Thống kê doanh thu 7 ngày gần nhất cho biểu đồ
    async getDailyRevenueLast7Days() {
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const results = await this.Orders.aggregate([
            {
                $match: {
                    status: { $in: ["completed", "delivered"] },
                    createdAt: { $gte: sevenDaysAgo, $lte: today }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    total: { $sum: "$total_amount" }
                }
            },
            { $sort: { _id: 1 } }
        ]).toArray();

        // Điền các ngày không có doanh thu bằng 0
        const dateMap = new Map(results.map(r => [r._id, r.total]));
        const finalData = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(sevenDaysAgo);
            d.setDate(d.getDate() + i + 1); // Bắt đầu từ ngày kế tiếp của 7 ngày trước
            const dateString = d.toISOString().split('T')[0];
            finalData.push({
                date: dateString,
                total: dateMap.get(dateString) || 0
            });
        }
        return finalData;
    }

    // Thống kê tỷ lệ các trạng thái đơn hàng
    async getOrderStatusDistribution() {
        return await this.Orders.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } },
            { $project: { _id: 0, status: "$_id", count: "$count" } }
        ]).toArray();
    }

    // Top sản phẩm bán chạy
    async getTopSellingProducts(limit = 5) {
        return await this.OrderDetails.aggregate([
            {
                $lookup: { from: "orders", localField: "order_id", foreignField: "_id", as: "order" }
            },
            { $unwind: "$order" },
            { $match: { "order.status": { $in: ["completed", "delivered"] } } },
            {
                $group: { _id: "$product_id", totalSold: { $sum: "$quantity" } }
            },
            { $sort: { totalSold: -1 } },
            { $limit: limit },
            {
                $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "productInfo" }
            },
            { $unwind: "$productInfo" },
            {
                $project: {
                    _id: "$productInfo._id",
                    name: "$productInfo.name",
                    image: { 
                        $ifNull: [ 
                            { $arrayElemAt: ["$productInfo.images.url", 0] }, 
                            "$productInfo.image" 
                        ] 
                    },
                    totalSold: "$totalSold"
                }
            }
        ]).toArray();
    }
}

module.exports = DashboardService;