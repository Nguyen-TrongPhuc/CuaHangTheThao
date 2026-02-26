const ColorsService = require("../services/colors.service");
const MongoDB = require("../utils/mongodb.util");
const ApiError = require("../api-error");

exports.create = async (req, res, next) => {
    if (!req.body?.name) return next(new ApiError(400, "Name can not be empty"));
    try {
        const service = new ColorsService(MongoDB.client);
        const document = await service.create(req.body);
        return res.send(document);
    } catch (error) { return next(new ApiError(500, "An error occurred")); }
};

exports.findAll = async (req, res, next) => {
    try {
        const service = new ColorsService(MongoDB.client);
        const documents = await service.find({});
        return res.send(documents);
    } catch (error) { return next(new ApiError(500, "An error occurred")); }
};

exports.findOne = async (req, res, next) => {
    try {
        const service = new ColorsService(MongoDB.client);
        const document = await service.findById(req.params.id);
        if (!document) return next(new ApiError(404, "Color not found"));
        return res.send(document);
    } catch (error) { return next(new ApiError(500, "Error retrieving color")); }
};

exports.update = async (req, res, next) => {
    if (Object.keys(req.body).length === 0) return next(new ApiError(400, "Data can not be empty"));
    try {
        const service = new ColorsService(MongoDB.client);
        const document = await service.update(req.params.id, req.body);
        if (!document) return next(new ApiError(404, "Color not found"));
        return res.send({ message: "Updated successfully" });
    } catch (error) { return next(new ApiError(500, "Error updating color")); }
};

exports.delete = async (req, res, next) => {
    try {
        const service = new ColorsService(MongoDB.client);
        const document = await service.delete(req.params.id);
        if (!document) return next(new ApiError(404, "Color not found"));
        return res.send({ message: "Deleted successfully" });
    } catch (error) { return next(new ApiError(500, "Could not delete color")); }
};