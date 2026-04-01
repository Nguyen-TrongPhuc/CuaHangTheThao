const DashboardService = require("../services/dashboard.service");
const MongoDB = require("../utils/mongodb.util");
const ApiError = require("../api-error");

exports.getSummary = async (req, res, next) => {
    try {
        const dashboardService = new DashboardService(MongoDB.client);
        
        // Lấy quyền từ token (middleware xác thực đã gắn vào req.user)
        const role = req.user ? req.user.role : 'staff'; 
        const summary = await dashboardService.getSummary(role);
        res.send(summary);
    } catch (error) {
        console.error(error);
        return next(
            new ApiError(500, "An error occurred while retrieving dashboard summary")
        );
    }
};

exports.getMonthlySales = async (req, res, next) => {
    try {
        const dashboardService = new DashboardService(MongoDB.client);
        const { year } = req.query;
        const data = await dashboardService.getMonthlySales(year);
        res.send(data);
    } catch (error) {
        console.error(error);
        return next(new ApiError(500, "Error retrieving monthly sales"));
    }
};

exports.getTopCustomers = async (req, res, next) => {
    try {
        const dashboardService = new DashboardService(MongoDB.client);
        const { startDate, endDate, limit } = req.query;
        const data = await dashboardService.getTopCustomers(startDate, endDate, limit);
        res.send(data);
    } catch (error) {
        console.error(error);
        return next(new ApiError(500, "Error retrieving top customers"));
    }
};

exports.getLowStockProducts = async (req, res, next) => {
    try {
        const dashboardService = new DashboardService(MongoDB.client);
        const { threshold } = req.query;
        const data = await dashboardService.getLowStockProducts(threshold);
        res.send(data);
    } catch (error) {
        console.error(error);
        return next(new ApiError(500, "Error retrieving low stock products"));
    }
};

exports.getImportReport = async (req, res, next) => {
    try {
        const dashboardService = new DashboardService(MongoDB.client);
        const { startDate, endDate } = req.query;
        let data = await dashboardService.getImportReport(startDate, endDate);
        
        // BẢO MẬT: Nếu không phải Admin, xóa sạch dữ liệu giá vốn nhập hàng trước khi gửi về
        const role = req.user ? req.user.role : 'staff';
        if (role !== 'admin') {
            data = data.map(item => {
                const { import_price, total_cost, ...safeData } = item;
                return safeData;
            });
        }

        res.send(data);
    } catch (error) {
        console.error(error);
        return next(new ApiError(500, "Error retrieving import report"));
    }
};

exports.syncStock = async (req, res, next) => {
    try {
        const dashboardService = new DashboardService(MongoDB.client);
        const result = await dashboardService.syncStock();
        res.send(result);
    } catch (error) {
        console.error(error);
        return next(new ApiError(500, "Error syncing stock"));
    }
};

exports.getTopProductsByMonth = async (req, res, next) => {
    try {
        const dashboardService = new DashboardService(MongoDB.client);
        const { year, month, limit } = req.query;
        const data = await dashboardService.getTopSellingProductsByMonth(year, month, limit);
        res.send(data);
    } catch (error) {
        console.error(error);
        return next(new ApiError(500, "Error retrieving top products by month"));
    }
};

exports.getDailyRevenueRange = async (req, res, next) => {
    try {
        const dashboardService = new DashboardService(MongoDB.client);
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return next(new ApiError(400, "startDate and endDate are required"));
        }
        const data = await dashboardService.getDailyRevenueByRange(startDate, endDate);
        res.send(data);
    } catch (error) {
        console.error(error);
        return next(new ApiError(500, "Error retrieving daily revenue range"));
    }
};

exports.getDailyCashflow = async (req, res, next) => {
    try {
        const date = req.query.date || new Date().toISOString().split('T')[0];
        const dashboardService = new DashboardService(MongoDB.client);
        
        const data = await dashboardService.getDailyCashflowDetail(date);
        return res.send(data);
    } catch (error) {
        console.error("Lỗi getDailyCashflow:", error);
        return next(new ApiError(500, "Lỗi khi lấy dữ liệu sổ quỹ"));
    }
};
