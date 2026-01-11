const CategoriesService = require("../services/categories.service");
const MongoDB = require("../utils/mongodb.util");
const ApiError = require("../api-error");

// Tạo loại sản phẩm mới
exports.create = async (req, res, next) => {
    if (!req.body?.name) {
        return next(new ApiError(400, "Category name can not be empty"));
    }

    try {
        const categoriesService = new CategoriesService(MongoDB.client);

        // kiểm tra trùng tên
        const existing = await categoriesService.findByName(req.body.name);
        if (existing) {
            return next(new ApiError(409, "Category already exists"));
        }

        const document = await categoriesService.create(req.body);
        return res.send(document);

    } catch (error) {
        return next(
            new ApiError(500, "An error occurred while creating the category")
        );
    }
};

// Lấy danh sách loại sản phẩm
exports.findAll = async (req, res, next) => {
    let documents = [];

    try {
        const categoriesService = new CategoriesService(MongoDB.client);
        const { name } = req.query;

        if (name) {
            documents = await categoriesService.findByName(name);
        } else {
            documents = await categoriesService.find({});
        }

    } catch (error) {
        return next(
            new ApiError(500, "An error occurred while retrieving categories")
        );
    }

    return res.send(documents);
};

// Lấy 1 loại sản phẩm theo id
exports.findOne = async (req, res, next) => {
    try {
        const categoriesService = new CategoriesService(MongoDB.client);
        const document = await categoriesService.findById(req.params.id);

        if (!document) {
            return next(new ApiError(404, "Category not found"));
        }

        return res.send(document);

    } catch (error) {
        return next(
            new ApiError(500, `Error retrieving category with id=${req.params.id}`)
        );
    }
};

// Cập nhật loại sản phẩm
exports.update = async (req, res, next) => {
    if (Object.keys(req.body).length === 0) {
        return next(new ApiError(400, "Data to update can not be empty"));
    }

    try {
        const categoriesService = new CategoriesService(MongoDB.client);
        const document = await categoriesService.update(req.params.id, req.body);

        if (!document) {
            return next(new ApiError(404, "Category not found"));
        }

        return res.send({ message: "Category was updated successfully" });

    } catch (error) {
        return next(
            new ApiError(500, `Error updating category with id=${req.params.id}`)
        );
    }
};

// Xóa 1 loại sản phẩm
exports.delete = async (req, res, next) => {
    try {
        const categoriesService = new CategoriesService(MongoDB.client);
        const document = await categoriesService.delete(req.params.id);

        if (!document) {
            return next(new ApiError(404, "Category not found"));
        }

        return res.send({ message: "Category was deleted successfully" });

    } catch (error) {
        return next(
            new ApiError(500, `Could not delete category with id=${req.params.id}`)
        );
    }
};

// Xóa tất cả loại sản phẩm
exports.deleteAll = async (_req, res, next) => {
    try {
        const categoriesService = new CategoriesService(MongoDB.client);
        const deletedCount = await categoriesService.deleteAll();

        return res.send({
            message: `${deletedCount} categories were deleted successfully`,
        });

    } catch (error) {
        return next(
            new ApiError(500, "An error occurred while removing all categories")
        );
    }
};
