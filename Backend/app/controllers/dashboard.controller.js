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