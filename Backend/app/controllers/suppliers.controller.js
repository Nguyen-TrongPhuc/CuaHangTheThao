const SuppliersService = require("../services/suppliers.service");
const MongoDB = require("../utils/mongodb.util");
const ApiError = require("../api-error");

// Tạo nhà cung cấp mới
exports.create = async (req, res, next) => {
    if (!req.body?.name) {
        return next(new ApiError(400, "Supplier name can not be empty"));
    }

    try {
        const suppliersService = new SuppliersService(MongoDB.client);

        // kiểm tra trùng tên (nếu muốn)
        const existing = await suppliersService.findByName(req.body.name);
        if (existing) {
            return next(new ApiError(409, "Supplier already exists"));
        }

        const document = await suppliersService.create(req.body);
        return res.send(document);

    } catch (error) {
        return next(
            new ApiError(500, "An error occurred while creating the supplier")
        );
    }
};

// Lấy danh sách nhà cung cấp
exports.findAll = async (req, res, next) => {
    let documents = [];

    try {
        const suppliersService = new SuppliersService(MongoDB.client);
        const { name } = req.query;

        if (name) {
            documents = await suppliersService.findByName(name);
        } else {
            documents = await suppliersService.find({});
        }

    } catch (error) {
        return next(
            new ApiError(500, "An error occurred while retrieving suppliers")
        );
    }

    return res.send(documents);
};

// Lấy 1 nhà cung cấp theo id
exports.findOne = async (req, res, next) => {
    try {
        const suppliersService = new SuppliersService(MongoDB.client);
        const document = await suppliersService.findById(req.params.id);

        if (!document) {
            return next(new ApiError(404, "Supplier not found"));
        }

        return res.send(document);

    } catch (error) {
        return next(
            new ApiError(500, `Error retrieving supplier with id=${req.params.id}`)
        );
    }
};

// Cập nhật nhà cung cấp
exports.update = async (req, res, next) => {
    if (Object.keys(req.body).length === 0) {
        return next(new ApiError(400, "Data to update can not be empty"));
    }

    try {
        const suppliersService = new SuppliersService(MongoDB.client);
        const document = await suppliersService.update(req.params.id, req.body);

        if (!document) {
            return next(new ApiError(404, "Supplier not found"));
        }

        return res.send({ message: "Supplier was updated successfully" });

    } catch (error) {
        return next(
            new ApiError(500, `Error updating supplier with id=${req.params.id}`)
        );
    }
};

// Xóa 1 nhà cung cấp
exports.delete = async (req, res, next) => {
    try {
        const suppliersService = new SuppliersService(MongoDB.client);
        const document = await suppliersService.delete(req.params.id);

        if (!document) {
            return next(new ApiError(404, "Supplier not found"));
        }

        return res.send({ message: "Supplier was deleted successfully" });

    } catch (error) {
        return next(
            new ApiError(500, `Could not delete supplier with id=${req.params.id}`)
        );
    }
};

// Xóa tất cả nhà cung cấp
exports.deleteAll = async (_req, res, next) => {
    try {
        const suppliersService = new SuppliersService(MongoDB.client);
        const deletedCount = await suppliersService.deleteAll();

        return res.send({
            message: `${deletedCount} suppliers were deleted successfully`,
        });

    } catch (error) {
        return next(
            new ApiError(500, "An error occurred while removing all suppliers")
        );
    }
};
