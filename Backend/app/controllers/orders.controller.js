const OrderService = require("../services/orders.service");
const MongoDB = require("../utils/mongodb.util");
const ApiError = require("../api-error");

exports.create = async (req, res, next) => {
    try {
        const orderService = new OrderService(MongoDB.client);
        // Thêm user_id vào payload từ token
        const payload = {
            ...req.body,
            customer_id: req.user ? req.user.userId : null
        };
        
        const document = await orderService.create(payload);
        return res.send(document);
    } catch (error) {
        console.error("Order Create Error:", error);
        // Trả về lỗi 400 nếu là lỗi logic (hết hàng), 500 nếu lỗi hệ thống
        if (error.message && (
            error.message.includes("không đủ") || 
            error.message.includes("không tồn tại") || 
            error.message.includes("không hợp lệ")
        )) {
            return next(new ApiError(400, error.message));
        }
        return next(new ApiError(500, "An error occurred while creating the order"));
    }
};

exports.findAll = async (req, res, next) => {
    try {
        const orderService = new OrderService(MongoDB.client);
        const documents = await orderService.findAll();
        return res.send(documents);
    } catch (error) {
        return next(new ApiError(500, "An error occurred while retrieving orders"));
    }
};

exports.findHistory = async (req, res, next) => {
    try {
        const orderService = new OrderService(MongoDB.client);
        const documents = await orderService.findByCustomerId(req.user.userId);
        return res.send(documents);
    } catch (error) {
        return next(new ApiError(500, "An error occurred while retrieving order history"));
    }
};

exports.findOne = async (req, res, next) => {
    try {
        const orderService = new OrderService(MongoDB.client);
        const document = await orderService.findById(req.params.id);
        if (!document) {
            return next(new ApiError(404, "Order not found"));
        }
        return res.send(document);
    } catch (error) {
        return next(new ApiError(500, "Error retrieving order"));
    }
};

exports.update = async (req, res, next) => {
    try {
        const orderService = new OrderService(MongoDB.client);
        const document = await orderService.update(req.params.id, req.body);
        return res.send(document);
    } catch (error) {
        return next(new ApiError(500, "Error updating order"));
    }
};

exports.delete = async (req, res, next) => {
    try {
        const orderService = new OrderService(MongoDB.client);
        const document = await orderService.delete(req.params.id);
        if (!document) {
            return next(new ApiError(404, "Order not found"));
        }
        return res.send({ message: "Order was deleted successfully" });
    } catch (error) {
        return next(new ApiError(500, "Could not delete order"));
    }
};

exports.deleteAll = async (req, res, next) => {
    try {
        const orderService = new OrderService(MongoDB.client);
        const deletedCount = await orderService.deleteAll();
        return res.send({
            message: `${deletedCount} orders were deleted successfully`,
        });
    } catch (error) {
        return next(
            new ApiError(500, "An error occurred while removing all orders")
        );
    }
};