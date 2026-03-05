const { ObjectId } = require("mongodb");

class DashboardService {
    constructor(client) {
        this.Orders = client.db().collection("orders");
        this.OrderDetails = client.db().collection("order_details");
        this.Products = client.db().collection("products");
        this.Customers = client.db().collection("customers");
        this.Warehouse = client.db().collection("warehouse");
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

    // 1. Thống kê doanh số theo tháng trong năm
    async getMonthlySales(year) {
        const y = parseInt(year) || new Date().getFullYear();
        const startOfYear = new Date(y, 0, 1);
        const endOfYear = new Date(y, 11, 31, 23, 59, 59);

        const result = await this.Orders.aggregate([
            {
                $match: {
                    status: { $in: ["completed", "delivered", "paid"] },
                    createdAt: { $gte: startOfYear, $lte: endOfYear }
                }
            },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    totalRevenue: { $sum: "$total_amount" },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]).toArray();
        
        // Điền dữ liệu cho các tháng không có doanh thu
        const fullData = [];
        for (let m = 1; m <= 12; m++) {
            const found = result.find(r => r._id === m);
            fullData.push({
                month: m,
                totalRevenue: found ? found.totalRevenue : 0,
                orderCount: found ? found.orderCount : 0
            });
        }
        return fullData;
    }

    // 2. Khách hàng mua nhiều nhất trong khoảng thời gian
    async getTopCustomers(startDate, endDate, limit = 10) {
        const start = startDate ? new Date(startDate) : new Date(0);
        const end = endDate ? new Date(endDate) : new Date();
        // Đảm bảo lấy hết ngày cuối cùng
        if (endDate && endDate.indexOf('T') === -1) {
             end.setHours(23, 59, 59, 999);
        }

        return await this.Orders.aggregate([
            {
                $match: {
                    status: { $in: ["completed", "delivered", "paid"] },
                    createdAt: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: "$customer_id",
                    totalSpent: { $sum: "$total_amount" },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { totalSpent: -1 } },
            { $limit: parseInt(limit) },
            {
                $lookup: {
                    from: "customers",
                    localField: "_id",
                    foreignField: "_id",
                    as: "customer"
                }
            },
            { $unwind: "$customer" },
            {
                $project: {
                    _id: 1,
                    name: { $concat: ["$customer.last_name", " ", "$customer.first_name"] },
                    email: "$customer.email",
                    phone: "$customer.phone",
                    totalSpent: 1,
                    orderCount: 1
                }
            }
        ]).toArray();
    }

    // 3. Sản phẩm sắp hết hàng (Low Stock)
    async getLowStockProducts(threshold = 10) {
        return await this.Products.find({ 
            stock: { $lte: parseInt(threshold) } 
        })
        .sort({ stock: 1 })
        .project({ name: 1, stock: 1, image: 1, price: 1 })
        .toArray();
    }

    // 4. Báo cáo nhập hàng (Đơn giá gốc, ngày nhập, người nhập, số lượng)
    async getImportReport(startDate, endDate) {
        const start = startDate ? new Date(startDate) : new Date(0);
        const end = endDate ? new Date(endDate) : new Date();
        if (endDate && endDate.indexOf('T') === -1) {
             end.setHours(23, 59, 59, 999);
        }

        // Kết nối bảng warehouse -> products -> employees
        return await this.Warehouse.aggregate([
            { $match: { createdAt: { $gte: start, $lte: end } } },
            { $lookup: { from: "products", localField: "product_id", foreignField: "_id", as: "product" } },
            { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
            { $lookup: { from: "employees", localField: "employee_id", foreignField: "_id", as: "employee" } },
            { $unwind: { path: "$employee", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 1,
                    product_name: "$product.name",
                    import_price: "$import_price", // Đơn giá gốc
                    quantity: "$quantity",         // Số lượng
                    total_cost: { $multiply: ["$import_price", "$quantity"] },
                    importer: "$employee.full_name", // Người nhập
                    createdAt: 1                   // Ngày nhập
                }
            },
            { $sort: { createdAt: -1 } }
        ]).toArray();
    }
}

module.exports = DashboardService;