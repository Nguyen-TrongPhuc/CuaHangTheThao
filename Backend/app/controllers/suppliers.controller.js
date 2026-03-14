const SuppliersService = require("../services/suppliers.service");
const MongoDB = require("../utils/mongodb.util");
const ApiError = require("../api-error");

exports.create = async (req, res, next) => {
    try {
        const service = new SuppliersService(MongoDB.client);
        const document = await service.create(req.body);
        return res.send(document);
    } catch (error) {
        return next(new ApiError(500, "An error occurred while creating the supplier"));
    }
};

exports.findAll = async (req, res, next) => {
    try {
        const service = new SuppliersService(MongoDB.client);
        const documents = await service.findAll();
        return res.send(documents);
    } catch (error) {
        return next(new ApiError(500, "An error occurred while retrieving suppliers"));
    }
};

exports.update = async (req, res, next) => {
    try {
        const service = new SuppliersService(MongoDB.client);
        const document = await service.update(req.params.id, req.body);
        if (!document) {
            return next(new ApiError(404, "Supplier not found"));
        }
        return res.send({ message: "Supplier was updated successfully" });
    } catch (error) {
        return next(new ApiError(500, `Error updating supplier with id=${req.params.id}`));
    }
};

exports.delete = async (req, res, next) => {
    try {
        const service = new SuppliersService(MongoDB.client);
        const document = await service.delete(req.params.id);
        if (!document) {
            return next(new ApiError(404, "Supplier not found"));
        }
        return res.send({ message: "Supplier was deleted successfully" });
    } catch (error) {
        return next(new ApiError(500, `Could not delete supplier with id=${req.params.id}`));
    }
};