const WarehouseService = require("../services/warehouse.service");
const MongoDB = require("../utils/mongodb.util");
const ApiError = require("../api-error");

exports.findAll = async (req, res, next) => {
    try {
        const warehouseService = new WarehouseService(MongoDB.client);
        const documents = await warehouseService.findAll();
        return res.send(documents);
    } catch (error) {
        console.error(error);
        return next(
            new ApiError(500, "An error occurred while retrieving warehouse items")
        );
    }
};

exports.create = async (req, res, next) => {
    try {
        const warehouseService = new WarehouseService(MongoDB.client);
        const document = await warehouseService.create(req.body);
        return res.send(document);
    } catch (error) {
        console.error(error);
        return next(
            new ApiError(500, "An error occurred while creating a warehouse item")
        );
    }
};
