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

exports.findOne = async (req, res, next) => {
    try {
        const warehouseService = new WarehouseService(MongoDB.client);
        const document = await warehouseService.findById(req.params.id);
        if (!document) {
            return next(new ApiError(404, "Warehouse item not found"));
        }
        return res.send(document);
    } catch (error) {
        return next(new ApiError(500, `Error retrieving warehouse item with id=${req.params.id}`));
    }
};

exports.create = async (req, res, next) => {
    try {
        console.log("Warehouse Import Payload:", req.body);
        const warehouseService = new WarehouseService(MongoDB.client);
        const document = await warehouseService.create(req.body);
        return res.send(document);
    } catch (error) {
        console.error("Warehouse Import Error:", error);
        // Trả về lỗi 400 nếu là lỗi validation
        if (error.message && (error.message.includes("Product ID") || error.message.includes("Quantity"))) {
            return next(new ApiError(400, error.message));
        }
        return next(
            new ApiError(500, "An error occurred while creating a warehouse item")
        );
    }
};
