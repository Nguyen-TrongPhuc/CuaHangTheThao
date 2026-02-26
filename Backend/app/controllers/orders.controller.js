const OrdersService = require("../services/orders.service");
const MongoDB = require("../utils/mongodb.util");
const ApiError = require("../api-error");

// =======================
// TẠO ĐƠN HÀNG
// =======================
exports.create = async (req, res, next) => {
    if (!req.body?.items || req.body.items.length === 0) {
        return next(new ApiError(400, "Order items are required"));
    }

    try {
        const ordersService = new OrdersService(MongoDB.client);

        // payload mẫu:
        // {
        //   customer_id: null | "id",   // null = khách vãng lai
        //   employee_id: "id",
        //   payment_method: "cash" | "card",
        //   items: [{ product_id, quantity, unit_price }]
        // }

        const document = await ordersService.create(req.body);
        return res.send(document);

    } catch (error) {
        console.log(error);
        return next(
            new ApiError(500, "An error occurred while creating the order")
        );
    }
};

// =======================
// LẤY LỊCH SỬ ĐƠN HÀNG (USER)
// =======================
exports.findHistory = async (req, res, next) => {
    try {
        const ordersService = new OrdersService(MongoDB.client);
        const userId = req.user.userId || req.user.id || req.user._id; 
        const documents = await ordersService.findByCustomerWithDetails(userId);
        return res.send(documents);
    } catch (error) {
        return next(new ApiError(500, "An error occurred while retrieving order history"));
    }
};

// =======================
// LẤY DANH SÁCH ĐƠN HÀNG
// =======================
exports.findAll = async (req, res, next) => {
    let documents = [];

    try {
        const ordersService = new OrdersService(MongoDB.client);
        const { status, employee_id, customer_id } = req.query;

        if (status) {
            documents = await ordersService.findByStatus(status);
        } else if (employee_id) {
            documents = await ordersService.findByEmployee(employee_id);
        } else if (customer_id) {
            documents = await ordersService.findByCustomer(customer_id);
        } else {
            documents = await ordersService.find({});
        }

    } catch (error) {
        return next(
            new ApiError(500, "An error occurred while retrieving orders")
        );
    }

    return res.send(documents);
};

// =======================
// LẤY 1 ĐƠN HÀNG
// =======================
exports.findOne = async (req, res, next) => {
    try {
        const ordersService = new OrdersService(MongoDB.client);
        const document = await ordersService.findById(req.params.id);

        if (!document) {
            return next(new ApiError(404, "Order not found"));
        }

        return res.send(document);

    } catch (error) {
        return next(
            new ApiError(500, `Error retrieving order with id=${req.params.id}`)
        );
    }
};

// =======================
// CẬP NHẬT TRẠNG THÁI ĐƠN
// =======================
exports.update = async (req, res, next) => {
    if (Object.keys(req.body).length === 0) {
        return next(new ApiError(400, "Data to update can not be empty"));
    }

    try {
        const ordersService = new OrdersService(MongoDB.client);
        const document = await ordersService.update(req.params.id, req.body);

        if (!document) {
            return next(new ApiError(404, "Order not found"));
        }

        return res.send({ message: "Order was updated successfully" });

    } catch (error) {
        return next(
            new ApiError(500, `Error updating order with id=${req.params.id}`)
        );
    }
};

// =======================
// XÓA ĐƠN HÀNG
// =======================
exports.delete = async (req, res, next) => {
    try {
        const ordersService = new OrdersService(MongoDB.client);
        const document = await ordersService.delete(req.params.id);

        if (!document) {
            return next(new ApiError(404, "Order not found"));
        }

        return res.send({ message: "Order was deleted successfully" });

    } catch (error) {
        return next(
            new ApiError(500, `Could not delete order with id=${req.params.id}`)
        );
    }
};

// =======================
// XÓA TẤT CẢ ĐƠN HÀNG
// =======================
exports.deleteAll = async (_req, res, next) => {
    try {
        const ordersService = new OrdersService(MongoDB.client);
        const deletedCount = await ordersService.deleteAll();

        return res.send({
            message: `${deletedCount} orders were deleted successfully`,
        });

    } catch (error) {
        return next(
            new ApiError(500, "An error occurred while removing all orders")
        );
    }
};
