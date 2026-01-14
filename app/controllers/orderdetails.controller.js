const OrderDetailsService = require("../services/orderdetails.service");
const MongoDB = require("../utils/mongodb.util");
const ApiError = require("../api-error");

// =======================
// TẠO CHI TIẾT ĐƠN HÀNG
// =======================
exports.create = async (req, res, next) => {
    if (
        !req.body?.order_id ||
        !req.body?.product_id ||
        !req.body?.quantity ||
        !req.body?.unit_price
    ) {
        return next(
            new ApiError(
                400,
                "order_id, product_id, quantity and unit_price are required"
            )
        );
    }

    try {
        const orderDetailsService = new OrderDetailsService(MongoDB.client);
        const document = await orderDetailsService.create(req.body);
        return res.send(document);
    } catch (error) {
        return next(
            new ApiError(500, "An error occurred while creating order details")
        );
    }
};

// =======================
// LẤY DANH SÁCH CHI TIẾT
// =======================
exports.findAll = async (req, res, next) => {
    try {
        const orderDetailsService = new OrderDetailsService(MongoDB.client);
        const { order_id } = req.query;

        let documents = [];
        if (order_id) {
            documents = await orderDetailsService.findByOrderId(order_id);
        } else {
            documents = await orderDetailsService.find({});
        }

        return res.send(documents);
    } catch (error) {
        return next(
            new ApiError(500, "An error occurred while retrieving order details")
        );
    }
};

// =======================
// LẤY 1 CHI TIẾT THEO ID
// =======================
exports.findOne = async (req, res, next) => {
    try {
        const orderDetailsService = new OrderDetailsService(MongoDB.client);
        const document = await orderDetailsService.findById(req.params.id);

        if (!document) {
            return next(new ApiError(404, "Order detail not found"));
        }

        return res.send(document);
    } catch (error) {
        return next(
            new ApiError(
                500,
                `Error retrieving order detail with id=${req.params.id}`
            )
        );
    }
};

// =======================
// CẬP NHẬT CHI TIẾT
// =======================
exports.update = async (req, res, next) => {
    if (Object.keys(req.body).length === 0) {
        return next(new ApiError(400, "Data to update can not be empty"));
    }

    try {
        const orderDetailsService = new OrderDetailsService(MongoDB.client);
        const document = await orderDetailsService.update(
            req.params.id,
            req.body
        );

        if (!document) {
            return next(new ApiError(404, "Order detail not found"));
        }

        return res.send({ message: "Order detail was updated successfully" });
    } catch (error) {
        return next(
            new ApiError(
                500,
                `Error updating order detail with id=${req.params.id}`
            )
        );
    }
};

// =======================
// XÓA 1 CHI TIẾT
// =======================
exports.delete = async (req, res, next) => {
    try {
        const orderDetailsService = new OrderDetailsService(MongoDB.client);
        const document = await orderDetailsService.delete(req.params.id);

        if (!document) {
            return next(new ApiError(404, "Order detail not found"));
        }

        return res.send({ message: "Order detail was deleted successfully" });
    } catch (error) {
        return next(
            new ApiError(
                500,
                `Could not delete order detail with id=${req.params.id}`
            )
        );
    }
};

// =======================
// XÓA TẤT CẢ CHI TIẾT THEO ORDER_ID
// =======================
exports.deleteByOrderId = async (req, res, next) => {
    try {
        const orderDetailsService = new OrderDetailsService(MongoDB.client);
        const deletedCount = await orderDetailsService.deleteByOrderId(
            req.params.order_id
        );

        return res.send({
            message: `${deletedCount} order details were deleted successfully`,
        });
    } catch (error) {
        return next(
            new ApiError(
                500,
                "An error occurred while removing order details by order_id"
            )
        );
    }
};

// =======================
// XÓA TẤT CẢ CHI TIẾT
// =======================
exports.deleteAll = async (_req, res, next) => {
    try {
        const orderDetailsService = new OrderDetailsService(MongoDB.client);
        const deletedCount = await orderDetailsService.deleteAll();

        return res.send({
            message: `${deletedCount} order details were deleted successfully`,
        });
    } catch (error) {
        return next(
            new ApiError(500, "An error occurred while removing all order details")
        );
    }
};
