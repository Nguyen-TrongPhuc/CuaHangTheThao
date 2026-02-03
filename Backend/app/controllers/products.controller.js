const ProductsService = require("../services/products.service");
const MongoDB = require("../utils/mongodb.util");
const ApiError = require("../api-error");

// Tạo sản phẩm mới
exports.create = async (req, res, next) => {
    if (!req.body?.name || !req.body?.price) {
        return next(new ApiError(400, "Product name and price can not be empty"));
    }

    try {
        const productsService = new ProductsService(MongoDB.client);

        const document = await productsService.create(req.body);
        return res.send(document);

    } catch (error) {
        return next(
            new ApiError(500, "An error occurred while creating the product")
        );
    }
};

// Lấy danh sách sản phẩm
exports.findAll = async (req, res, next) => {
    let documents = [];

    try {
        const productsService = new ProductsService(MongoDB.client);
        const { name, category_id, sport_id } = req.query;

        if (name) {
            documents = await productsService.findByName(name);
        } else if (category_id) {
            documents = await productsService.findByCategory(category_id);
        } else if (sport_id) {
            documents = await productsService.findBySport(sport_id);
        } else {
            documents = await productsService.find({});
        }

    } catch (error) {
        return next(
            new ApiError(500, "An error occurred while retrieving products")
        );
    }

    return res.send(documents);
};

// Lấy 1 sản phẩm theo id
exports.findOne = async (req, res, next) => {
    try {
        const productsService = new ProductsService(MongoDB.client);
        const document = await productsService.findById(req.params.id);

        if (!document) {
            return next(new ApiError(404, "Product not found"));
        }

        return res.send(document);

    } catch (error) {
        return next(
            new ApiError(500, `Error retrieving product with id=${req.params.id}`)
        );
    }
};

// Cập nhật sản phẩm
exports.update = async (req, res, next) => {
    if (Object.keys(req.body).length === 0) {
        return next(new ApiError(400, "Data to update can not be empty"));
    }

    try {
        const productsService = new ProductsService(MongoDB.client);
        const document = await productsService.update(req.params.id, req.body);

        if (!document) {
            return next(new ApiError(404, "Product not found"));
        }

        return res.send({ message: "Product was updated successfully" });

    } catch (error) {
        return next(
            new ApiError(500, `Error updating product with id=${req.params.id}`)
        );
    }
};

// Xóa 1 sản phẩm
exports.delete = async (req, res, next) => {
    try {
        const productsService = new ProductsService(MongoDB.client);
        const document = await productsService.delete(req.params.id);

        if (!document) {
            return next(new ApiError(404, "Product not found"));
        }

        return res.send({ message: "Product was deleted successfully" });

    } catch (error) {
        return next(
            new ApiError(500, `Could not delete product with id=${req.params.id}`)
        );
    }
};

// Xóa tất cả sản phẩm
exports.deleteAll = async (_req, res, next) => {
    try {
        const productsService = new ProductsService(MongoDB.client);
        const deletedCount = await productsService.deleteAll();

        return res.send({
            message: `${deletedCount} products were deleted successfully`,
        });

    } catch (error) {
        return next(
            new ApiError(500, "An error occurred while removing all products")
        );
    }
};
