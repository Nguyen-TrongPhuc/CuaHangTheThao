const DashboardService = require("../services/dashboard.service");
const MongoDB = require("../utils/mongodb.util");
const ApiError = require("../api-error");

exports.getSummary = async (req, res, next) => {
    try {
        const dashboardService = new DashboardService(MongoDB.client);
        const summary = await dashboardService.getSummary();
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
        const data = await dashboardService.getImportReport(startDate, endDate);
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