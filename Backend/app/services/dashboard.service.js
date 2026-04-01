const { ObjectId } = require("mongodb");

class DashboardService {
    constructor(client) {
        this.Orders = client.db().collection("orders");
        this.OrderDetails = client.db().collection("order_details");
        this.Products = client.db().collection("products");
        this.Customers = client.db().collection("customers");
        this.Warehouse = client.db().collection("warehouse");
        this.Salaries = client.db().collection("salaries");
    }

    async getSummary(role = 'staff') {
        // 1. Dữ liệu cơ bản (Staff & Admin đều xem được)
        const [
            newOrdersToday,
            cancelledOrdersMonth,
            orderStatusDistribution,
            topSellingProducts
        ] = await Promise.all([
            this.getNewOrdersToday(),
            this.getCancelledOrdersMonth(),
            this.getOrderStatusDistribution(),
            this.getTopSellingProducts(5)
        ]);

        // 2. Dữ liệu nhạy cảm (Doanh thu - Chỉ Admin mới được database tính toán)
        let totalRevenueMonth = 0;
        let dailyRevenue = [];
        let totalCostMonth = 0;

        if (role === 'admin') {
            [totalRevenueMonth, dailyRevenue, totalCostMonth] = await Promise.all([
                this.getTotalRevenueMonth(),
                this.getDailyRevenueCurrentMonth(),
                this.getTotalCostMonth()
            ]);
        }

        return {
            totalRevenueMonth,
            totalCostMonth,
            newOrdersToday,
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

    // Thống kê tổng chi phí trong tháng hiện tại
    async getTotalCostMonth() {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        // 1. Chi phí nhập hàng
        const importsResult = await this.Warehouse.aggregate([
            {
                $match: {
                    createdAt: { $gte: startOfMonth, $lte: endOfMonth }
                }
            },
            { $unwind: "$items" },
            {
                $group: {
                    _id: null,
                    totalImportCost: { $sum: { $multiply: ["$items.import_price", "$items.quantity"] } }
                }
            }
        ]).toArray();
        const importCost = importsResult.length > 0 ? importsResult[0].totalImportCost : 0;

        // 2. Chi phí trả lương nhân viên
        const salariesResult = await this.Salaries.aggregate([
            {
                $match: { month: now.getMonth() + 1, year: now.getFullYear(), status: "paid" }
            },
            { $group: { _id: null, totalSalaryCost: { $sum: "$net_salary" } } }
        ]).toArray();
        const salaryCost = salariesResult.length > 0 ? salariesResult[0].totalSalaryCost : 0;

        return importCost + salaryCost;
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

// Thống kê doanh thu các ngày trong tháng hiện tại cho biểu đồ
    async getDailyRevenueCurrentMonth() {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

        const results = await this.Orders.aggregate([
            {
                $match: {
                    status: { $in: ["completed", "delivered"] },
                    createdAt: { $gte: startOfMonth, $lte: today }
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
        const currentDay = now.getDate();
        for (let day = 1; day <= currentDay; day++) {
            // FIX 1: Đặt 12h trưa để tránh việc múi giờ Việt Nam (+7) làm toISOString bị lùi về ngày hôm trước
            const d = new Date(now.getFullYear(), now.getMonth(), day, 12, 0, 0);
            const dateString = d.toISOString().split('T')[0];
            finalData.push({
                date: `${day}/${now.getMonth() + 1}`, // Cắt ngắn nhãn hiển thị thành "Ngày/Tháng" để không chèn ép biểu đồ
                total: dateMap.get(dateString) || 0
            });
        }
        return finalData;
    }

    // Thống kê doanh thu theo khoảng ngày tùy chọn cho biểu đồ
    async getDailyRevenueByRange(startDateStr, endDateStr) {
        const startDate = new Date(startDateStr);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(endDateStr);
        endDate.setHours(23, 59, 59, 999);

        const results = await this.Orders.aggregate([
            {
                $match: {
                    status: { $in: ["completed", "delivered"] },
                    createdAt: { $gte: startDate, $lte: endDate }
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
        const current = new Date(startDate);
        current.setHours(12, 0, 0, 0); // Tránh lỗi timezone
        while (current <= endDate) {
            const dateString = current.toISOString().split('T')[0];
            finalData.push({
                date: `${current.getDate()}/${current.getMonth() + 1}`, // Format nhãn ngắn gọn
                total: dateMap.get(dateString) || 0
            });
            current.setDate(current.getDate() + 1);
        }
        return finalData;
    }

    // Thống kê tỷ lệ các trạng thái đơn hàng
    async getOrderStatusDistribution() {
        // FIX 2: Đồng bộ đếm trạng thái đơn hàng theo tháng hiện tại (Giống hệt Thẻ tóm tắt ở trên)
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        return await this.Orders.aggregate([
            {
                $match: {
                    createdAt: { $gte: startOfMonth, $lte: endOfMonth }
                }
            },
            { $group: { _id: "$status", count: { $sum: 1 } } },
            { $project: { _id: 0, status: "$_id", count: "$count" } }
        ]).toArray();
    }

    // Top sản phẩm bán chạy - bao gồm cả lượt bán và số lượng
    async getTopSellingProducts(limit = 5) {
        const parsedLimit = parseInt(limit) || 5;
        return await this.Orders.aggregate([
            { $match: { status: { $in: ["completed", "delivered", "paid"] } } },
            { $unwind: "$items" },
            {
                $group: { 
                    _id: "$items.product_id", 
                    totalSold: { $sum: 1 },
                    totalQuantity: { $sum: "$items.quantity" }
                }
            },
            { $sort: { totalQuantity: -1 } },
            {
                $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "productInfo" }
            },
            { $unwind: "$productInfo" },
            { $limit: parsedLimit },
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
                    totalSold: "$totalSold", // Số lượt bán
                    totalQuantity: "$totalQuantity" // Tổng số lượng bán
                }
            }
        ]).toArray();
    }

    // Top sản phẩm bán chạy theo tháng cụ thể
    async getTopSellingProductsByMonth(year, month, limit = 5) {
        const y = parseInt(year) || new Date().getFullYear();
        const m = parseInt(month) || new Date().getMonth() + 1;
        const parsedLimit = parseInt(limit) || 5;
        const startOfMonth = new Date(y, m - 1, 1);
        const endOfMonth = new Date(y, m, 0, 23, 59, 59, 999);

        return await this.Orders.aggregate([
            { 
                $match: { 
                    status: { $in: ["completed", "delivered", "paid"] },
                    createdAt: { $gte: startOfMonth, $lte: endOfMonth }
                } 
            },
            { $unwind: "$items" },
            {
                $group: { 
                    _id: "$items.product_id", 
                    totalSold: { $sum: 1 },
                    totalQuantity: { $sum: "$items.quantity" }
                }
            },
            { $sort: { totalQuantity: -1 } },
            {
                $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "productInfo" }
            },
            { $unwind: "$productInfo" },
            { $limit: parsedLimit },
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
                    totalSold: "$totalSold",
                    totalQuantity: "$totalQuantity"
                }
            }
        ]).toArray();
    }

    // 1. Thống kê doanh số theo tháng trong năm
    async getMonthlySales(year) {
        const y = parseInt(year) || new Date().getFullYear();
        const startOfYear = new Date(y, 0, 1);
        const endOfYear = new Date(y, 11, 31, 23, 59, 59);

        // 1. Doanh số và số lượng bán ra
        const salesResult = await this.Orders.aggregate([
            {
                $match: {
                    status: { $in: ["completed", "delivered", "paid"] },
                    createdAt: { $gte: startOfYear, $lte: endOfYear }
                }
            },
            {
                $addFields: {
                    totalItemsInOrder: {
                        $reduce: {
                            input: { $ifNull: ["$items", []] },
                            initialValue: 0,
                            in: { $add: ["$$value", { $ifNull: ["$$this.quantity", 0] }] }
                        }
                    }
                }
            },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    totalRevenue: { $sum: "$total_amount" },
                    orderCount: { $sum: 1 },
                    totalSoldQuantity: { $sum: "$totalItemsInOrder" }
                }
            },
            { $sort: { _id: 1 } }
        ]).toArray();
        
        // 2. Số lượng và chi phí nhập vào
        const importsResult = await this.Warehouse.aggregate([
            {
                $match: {
                    createdAt: { $gte: startOfYear, $lte: endOfYear }
                }
            },
            { $unwind: "$items" }, // FIX 3: Bung mảng items ra trước để có thể đọc được giá nhập và số lượng
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    totalImportCost: { $sum: { $multiply: ["$items.import_price", "$items.quantity"] } },
                    totalImportQuantity: { $sum: "$items.quantity" }
                }
            }
        ]).toArray();
        
        // 3. Chi phí trả lương nhân viên
        const salariesResult = await this.Salaries.aggregate([
            {
                $match: {
                    year: y,
                    status: "paid" // Chỉ tính những khoản lương ĐÃ THANH TOÁN vào chi phí
                }
            },
            {
                $group: {
                    _id: "$month",
                    totalSalaryCost: { $sum: "$net_salary" }
                }
            }
        ]).toArray();
        
        // Điền dữ liệu cho các tháng
        const fullData = [];
        for (let m = 1; m <= 12; m++) {
            const sale = salesResult.find(r => r._id === m);
            const imp = importsResult.find(r => r._id === m);
            const sal = salariesResult.find(r => r._id === m);
            
            fullData.push({
                month: m,
                totalRevenue: sale ? sale.totalRevenue : 0,
                orderCount: sale ? sale.orderCount : 0,
                totalSoldQuantity: sale ? sale.totalSoldQuantity : 0,
                totalImportCost: imp ? imp.totalImportCost : 0,
                totalImportQuantity: imp ? imp.totalImportQuantity : 0,
                totalSalaryCost: sal ? sal.totalSalaryCost : 0,
                profit: (sale ? sale.totalRevenue : 0) - (imp ? imp.totalImportCost : 0) - (sal ? sal.totalSalaryCost : 0)
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

    // 3. Sản phẩm sắp hết hàng (Low Stock) - bao gồm cả sản phẩm đơn giản và biến thể
    async getLowStockProducts(threshold = 10) {
        const thresholdNum = parseInt(threshold);
        
        return await this.Products.aggregate([
            {
                $addFields: {
                    // Tính toán lại tồn kho thực tế (để tránh trường hợp stock tổng bị sai lệch với variants)
                    actualStock: {
                        $cond: {
                            if: { $gt: [{ $size: { $ifNull: ["$variants", []] } }, 0] },
                            then: { $sum: "$variants.stock" },
                            else: "$stock"
                        }
                    },
                    lowStockVariants: {
                        $filter: {
                            input: { $ifNull: ["$variants", []] },
                            as: "variant",
                            cond: { $lte: ["$$variant.stock", thresholdNum] }
                        }
                    }
                }
            },
            {
                $match: {
                    $or: [
                        { actualStock: { $lte: thresholdNum } }, // So sánh với tồn kho thực tế
                        { lowStockVariants: { $ne: [] } }
                    ]
                }
            },
            // Tách mảng biến thể ra để tra cứu tên Size/Màu
            { $unwind: { path: "$lowStockVariants", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "sizes",
                    localField: "lowStockVariants.size_id",
                    foreignField: "_id",
                    as: "sizeInfo"
                }
            },
            {
                $lookup: {
                    from: "colors",
                    localField: "lowStockVariants.color_id",
                    foreignField: "_id",
                    as: "colorInfo"
                }
            },
            {
                $addFields: {
                    "lowStockVariants.size_name": { $arrayElemAt: ["$sizeInfo.name", 0] },
                    "lowStockVariants.color_name": { $arrayElemAt: ["$colorInfo.name", 0] }
                }
            },
            // Gom nhóm lại thành sản phẩm như cũ
            {
                $project: {
                    name: 1,
                    stock: "$actualStock", // Trả về số lượng thực tế đã tính toán
                    image: 1,
                    price: 1,
                    lowStockVariants: 1,
                    // Đảm bảo giữ lại variants gốc để debug nếu cần
                    // variants: 1 
                }
            },
            {
                $group: {
                    _id: "$_id",
                    name: { $first: "$name" },
                    stock: { $first: "$stock" },
                    image: { $first: "$image" },
                    price: { $first: "$price" },
                    // Chỉ push vào mảng nếu đó là biến thể thực sự (có stock)
                    lowStockVariants: { 
                        $push: {
                            $cond: [
                                { $gt: ["$lowStockVariants.stock", null] }, 
                                "$lowStockVariants", 
                                "$$REMOVE"
                            ]
                        } 
                    }
                }
            },
            { $sort: { stock: 1 } }
        ]).toArray();
    }

    // 4. Báo cáo nhập hàng (Đơn giá gốc, ngày nhập, người nhập, số lượng)
    async getImportReport(startDate, endDate) {
        const start = startDate ? new Date(startDate) : new Date(0);
        const end = endDate ? new Date(endDate) : new Date();
        if (endDate && endDate.indexOf('T') === -1) {
             end.setHours(23, 59, 59, 999);
        }

        return await this.Warehouse.aggregate([
            { $match: { createdAt: { $gte: start, $lte: end } } },
            { $unwind: "$items" }, // Bung mảng các sản phẩm trong phiếu nhập
            {
                $project: {
                    _id: 1,
                    product_name: "$items.product_name",
                    variant_desc: "$items.variant_desc", // Lấy thêm phân loại (size/màu)
                    import_price: "$items.import_price", // Đơn giá gốc
                    quantity: "$items.quantity",         // Số lượng
                    total_cost: { $multiply: ["$items.import_price", "$items.quantity"] },
                    importer: "$staff_name", // Người lập phiếu
                    createdAt: 1                   // Ngày nhập
                }
            },
            { $sort: { createdAt: -1 } }
        ]).toArray();
    }

    // 5. Đồng bộ lại tồn kho (Fix lỗi sai lệch số liệu trong DB)
    async syncStock() {
        const products = await this.Products.find({}).toArray();
        let updatedCount = 0;

        for (const p of products) {
            let correctStock = p.stock;
            let shouldUpdate = false;

            // Trường hợp 1: Có biến thể -> Stock phải bằng tổng biến thể
            if (p.variants && p.variants.length > 0) {
                const totalVariantStock = p.variants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0);
                if (p.stock !== totalVariantStock) {
                    correctStock = totalVariantStock;
                    shouldUpdate = true;
                }
            } 
            // Trường hợp 2: Không biến thể -> Stock không được âm
            else {
                if (p.stock < 0) {
                    correctStock = 0;
                    shouldUpdate = true;
                }
            }

            if (shouldUpdate) {
                await this.Products.updateOne({ _id: p._id }, { $set: { stock: correctStock } });
                updatedCount++;
            }
        }
        return { updatedCount };
    }

    // 6. Sổ Quỹ (Cashflow): Xem chi tiết dòng tiền (Thu/Chi) trong 1 ngày cụ thể
    async getDailyCashflowDetail(dateString) {
        const targetDate = new Date(dateString);
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

        // 1. Nguồn Doanh thu (Từ Đơn hàng hoàn thành/đã thanh toán)
        const revenues = await this.Orders.aggregate([
            {
                $match: {
                    $or: [
                        { status: { $in: ["completed", "delivered"] } },
                        { payment_status: "paid" }
                    ],
                    createdAt: { $gte: startOfDay, $lte: endOfDay }
                }
            },
            {
                $project: {
                    _id: 1,
                    type: "revenue",
                    source: "Bán hàng",
                    description: { $concat: ["Đơn hàng #", { $substr: [{ $toString: "$_id" }, 18, 6] }, " - Khách: ", { $ifNull: ["$name", "Khách lẻ"] }] },
                    amount: { $ifNull: ["$total_amount", 0] },
                    time: "$createdAt"
                }
            }
        ]).toArray();

        // 2. Nguồn Chi phí Nhập hàng (Từ Phiếu nhập kho)
        const importCosts = await this.Warehouse.aggregate([
            {
                $match: {
                    createdAt: { $gte: startOfDay, $lte: endOfDay }
                }
            },
            {
                $addFields: {
                    calculated_amount: {
                        $reduce: {
                            input: { $ifNull: ["$items", []] },
                            initialValue: 0,
                            in: { $add: ["$$value", { $multiply: [{ $ifNull: ["$$this.import_price", 0] }, { $ifNull: ["$$this.quantity", 0] }] }] }
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    type: "cost",
                    source: "Nhập hàng",
                    description: { $concat: ["Phiếu nhập kho #", { $substr: [{ $toString: "$_id" }, 18, 6] }, " - NCC: ", { $ifNull: ["$supplier_name", "Không rõ"] }] },
                    amount: { $ifNull: ["$total_amount", "$calculated_amount"] },
                    time: "$createdAt"
                }
            }
        ]).toArray();

        // 3. Nguồn Chi phí Lương (Từ Bảng lương nếu có thanh toán trong ngày)
        const salaryCosts = await this.Salaries.aggregate([
            {
                $match: {
                    status: "paid",
                    payment_date: { $gte: startOfDay, $lte: endOfDay }
                }
            },
            {
                $project: {
                    _id: 1,
                    type: "cost",
                    source: "Trả lương",
                    description: { $concat: ["Lương T", { $toString: "$month" }, "/", { $toString: "$year" }, " - NV: ", "$employee_name"] },
                    amount: { $ifNull: ["$net_salary", 0] },
                    time: "$payment_date"
                }
            }
        ]).toArray();

        // Gộp chung và sắp xếp theo thời gian mới nhất lên đầu
        const cashflow = [...revenues, ...importCosts, ...salaryCosts].sort((a, b) => b.time - a.time);

        const totalRevenue = revenues.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
        const totalCost = importCosts.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) + salaryCosts.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

        return {
            date: dateString,
            totalRevenue,
            totalCost,
            profit: totalRevenue - totalCost,
            transactions: cashflow
        };
    }
}

module.exports = DashboardService;