const VoucherService = require("../services/vouchers.service");
const MongoDB = require("../utils/mongodb.util");
const ApiError = require("../api-error");

exports.validate = async (req, res, next) => {
    try {
        const voucherService = new VoucherService(MongoDB.client);
        const { code, subtotal, shipping_fee } = req.body;

        if (!code || !subtotal) {
            return next(new ApiError(400, "Thiếu mã voucher hoặc tổng tiền đơn hàng"));
        }

        const result = await voucherService.validateVoucher(code, Number(subtotal), Number(shipping_fee));
        return res.send(result);
    } catch (error) {
        console.error("Voucher validation error:", error);
        return next(new ApiError(400, error.message));
    }
};

exports.create = async (req, res, next) => {
    try {
        const voucherService = new VoucherService(MongoDB.client);
        const document = await voucherService.create(req.body);
        return res.send(document);
    } catch (error) {
        console.error("Voucher create error:", error);
        return next(new ApiError(400, error.message));
    }
};

exports.findAll = async (req, res, next) => {
    try {
        const voucherService = new VoucherService(MongoDB.client);
        const documents = await voucherService.findAll();
        return res.send(documents);
    } catch (error) {
        return next(new ApiError(500, "Lỗi lấy danh sách voucher"));
    }
};

exports.findOne = async (req, res, next) => {
    try {
        const voucherService = new VoucherService(MongoDB.client);
        const document = await voucherService.findById(req.params.id);
        if (!document) {
            return next(new ApiError(404, "Voucher không tồn tại"));
        }
        return res.send(document);
    } catch (error) {
        return next(new ApiError(500, "Lỗi lấy thông tin voucher"));
    }
};

exports.update = async (req, res, next) => {
    try {
        const voucherService = new VoucherService(MongoDB.client);
        const document = await voucherService.update(req.params.id, req.body);
        return res.send(document);
    } catch (error) {
        console.error("Voucher update error:", error);
        return next(new ApiError(400, error.message));
    }
};

exports.delete = async (req, res, next) => {
    try {
        const voucherService = new VoucherService(MongoDB.client);
        const result = await voucherService.delete(req.params.id);
        if (result === 0) {
            return next(new ApiError(404, "Voucher không tồn tại"));
        }
        return res.send({ message: "Xóa voucher thành công" });
    } catch (error) {
        return next(new ApiError(500, "Lỗi xóa voucher"));
    }
};

exports.stats = async (req, res, next) => {
    try {
        const voucherService = new VoucherService(MongoDB.client);
        const stats = await voucherService.getStats();
        return res.send(stats);
    } catch (error) {
        console.error("Voucher stats error:", error);
        return next(new ApiError(500, "Lỗi lấy thống kê voucher"));
    }
};
